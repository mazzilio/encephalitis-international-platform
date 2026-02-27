"""
Live Resource Classification Pipeline - Resilient Processing
Scrapes current data from Encephalitis International website and classifies it
Uses AWS Bedrock Claude Opus 4.5 for classification

RESILIENT FEATURES:
- Auto-saves progress every 5 items
- Auto-resumes from last checkpoint
- Network retry logic (3 attempts with exponential backoff)
- Survives interruptions (max loss: 4 items)

USAGE:
    Recommended (with resilient runner):
        ./run_resilient.sh process_live_resources.py [--test] [--cached]
    
    Direct execution (still has auto-resume):
        python3 process_live_resources.py [--test] [--cached]

For complete documentation, see RESILIENT_PROCESSING.md
"""

import json
import boto3
import requests
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
import pandas as pd
from datetime import datetime
from pathlib import Path
import time
import sys
import os
from typing import Dict, List, Any

# Add parent directory to path so we can import from scripts/
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scripts.excel_processor import LiveChatCribSheetProcessor, ContactsProcessor
from scripts.bedrock_tag_refinement_prompt import BedrockTagRefinementPrompt


def get_relative_path(path: Path) -> str:
    """Convert absolute path to relative path from project root for cleaner logs"""
    try:
        project_root = Path(__file__).parent.parent
        return str(path.relative_to(project_root))
    except (ValueError, AttributeError):
        # If path is already relative or can't be made relative, return as-is
        return str(path)


def clean_tag_for_excel(tag: str) -> str:
    """Remove tag prefix for human-readable Excel output"""
    if ':' in tag:
        return tag.split(':', 1)[1].replace('_', ' ').title()
    return tag.replace('_', ' ').title()


def clean_tags_list(tags: List[str]) -> str:
    """Convert tag list to human-readable comma-separated string"""
    if not tags:
        return ''
    cleaned = [clean_tag_for_excel(tag) for tag in tags]
    return ', '.join(cleaned)


class LiveWebScraper:
    """Scrape content from Encephalitis International website"""
    
    def __init__(self):
        self.base_url = "https://www.encephalitis.info"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (compatible; EncephalitisResourceClassifier/1.0)'
        })
    
    def get_sitemap(self, sitemap_url: str = None) -> List[str]:
        """Fetch and parse sitemap to get all URLs"""
        if not sitemap_url:
            sitemap_url = f"{self.base_url}/sitemap.xml"
        
        print(f"📡 Fetching sitemap from {sitemap_url}")
        
        try:
            response = self.session.get(sitemap_url, timeout=30)
            response.raise_for_status()
            
            # Parse XML
            root = ET.fromstring(response.content)
            
            # Extract URLs (handle different sitemap formats)
            urls = []
            
            # Standard sitemap namespace
            ns = {'ns': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
            
            # Try with namespace
            url_elements = root.findall('.//ns:url/ns:loc', ns)
            if url_elements:
                urls = [elem.text for elem in url_elements if elem.text]
            else:
                # Try without namespace
                url_elements = root.findall('.//url/loc')
                if url_elements:
                    urls = [elem.text for elem in url_elements if elem.text]
                else:
                    # Try sitemap index
                    sitemap_elements = root.findall('.//ns:sitemap/ns:loc', ns)
                    if not sitemap_elements:
                        sitemap_elements = root.findall('.//sitemap/loc')
                    
                    if sitemap_elements:
                        print(f"📋 Found sitemap index with {len(sitemap_elements)} sitemaps")
                        # Recursively fetch from sub-sitemaps
                        for elem in sitemap_elements[:3]:  # Limit to first 3 sitemaps for test
                            sub_urls = self.get_sitemap(elem.text)
                            urls.extend(sub_urls)
            
            print(f"✅ Found {len(urls)} URLs in sitemap")
            return urls
            
        except Exception as e:
            print(f"❌ Error fetching sitemap: {e}")
            return []
    
    def scrape_url(self, url: str) -> Dict[str, Any]:
        """Scrape content from a single URL"""
        try:
            print(f"  📄 Scraping: {url}")
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Remove script and style elements
            for script in soup(["script", "style", "nav", "footer", "header"]):
                script.decompose()
            
            # Extract title
            title = soup.find('title')
            title = title.get_text().strip() if title else url.split('/')[-1]
            
            # Extract main content
            main_content = soup.find('main') or soup.find('article') or soup.find('body')
            
            if main_content:
                # Get text content
                text = main_content.get_text(separator=' ', strip=True)
                
                # Clean up whitespace
                text = ' '.join(text.split())
                
                # Limit length for API (match Lambda scraper limit)
                if len(text) > 50000:
                    text = text[:50000] + "..."
            else:
                text = soup.get_text(separator=' ', strip=True)[:50000]
            
            # Extract meta description
            meta_desc = soup.find('meta', attrs={'name': 'description'})
            description = meta_desc.get('content', '') if meta_desc else ''
            
            if not description:
                # Use first paragraph as description
                first_p = soup.find('p')
                description = first_p.get_text().strip()[:500] if first_p else text[:500]
            
            return {
                'url': url,
                'title': title,
                'description': description,
                'content': text,
                'scraped_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"  ❌ Error scraping {url}: {e}")
            return None
    
    def scrape_multiple(self, urls: List[str], limit: int = None) -> List[Dict[str, Any]]:
        """Scrape multiple URLs"""
        if limit:
            urls = urls[:limit]
        
        results = []
        total = len(urls)
        
        print(f"\n🌐 Scraping {total} URLs from Encephalitis International website...")
        
        for i, url in enumerate(urls, 1):
            print(f"[{i}/{total}] ", end='')
            
            result = self.scrape_url(url)
            if result:
                results.append(result)
            
            # Rate limiting
            if i < total:
                time.sleep(1)  # Be respectful to the server
        
        print(f"\n✅ Successfully scraped {len(results)} pages")
        return results


class LiveResourceClassificationPipeline:
    """
    Complete pipeline to scrape and classify resources using Claude Opus 4.5
    With automatic progress saving and resume capability
    """
    
    def __init__(self, region_name: str = 'us-west-2'):
        """Initialize with Claude Opus 4.5"""
        import os
        
        # Explicitly get credentials from environment
        aws_access_key = os.environ.get('AWS_ACCESS_KEY_ID')
        aws_secret_key = os.environ.get('AWS_SECRET_ACCESS_KEY')
        aws_session_token = os.environ.get('AWS_SESSION_TOKEN')
        
        if not aws_access_key or not aws_secret_key:
            raise ValueError(
                "AWS credentials not found in environment variables.\n"
                "Please set: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN"
            )
        
        self.bedrock = boto3.client(
            service_name='bedrock-runtime',
            region_name=region_name,
            aws_access_key_id=aws_access_key,
            aws_secret_access_key=aws_secret_key,
            aws_session_token=aws_session_token
        )
        
        self.model_id = "global.anthropic.claude-opus-4-5-20251101-v1:0"
        self.prompt_builder = BedrockTagRefinementPrompt()
        self.scraper = LiveWebScraper()
        
        # Progress tracking
        self.progress_file = 'temp/progress_checkpoint.json'
        self.results_cache = []
        
        print(f"✅ Initialized with Claude Opus 4.5 (Global)")
        print(f"   Region: {region_name}")
        print(f"   Model: {self.model_id}")
        print(f"   Progress file: {get_relative_path(Path(self.progress_file))}")
    
    def save_progress(self, results: List[Dict[str, Any]], metadata: Dict[str, Any]):
        """Save progress to checkpoint file"""
        try:
            checkpoint = {
                'timestamp': datetime.now().isoformat(),
                'metadata': metadata,
                'results': results
            }
            with open(self.progress_file, 'w') as f:
                json.dump(checkpoint, f, indent=2)
        except Exception as e:
            print(f"⚠️  Warning: Could not save progress: {e}")
    
    def load_progress(self) -> tuple:
        """Load progress from checkpoint file"""
        if Path(self.progress_file).exists():
            try:
                with open(self.progress_file, 'r') as f:
                    checkpoint = json.load(f)
                return checkpoint.get('results', []), checkpoint.get('metadata', {})
            except Exception as e:
                print(f"⚠️  Warning: Could not load progress: {e}")
        return [], {}
    
    def classify_resource(self, resource: Dict[str, Any], resource_type: str, max_retries: int = 3) -> Dict[str, Any]:
        """Classify a single resource using Claude Opus 4.5"""
        
        # Build prompt based on resource type
        if resource_type == 'web_content':
            # Use the actual method from BedrockTagRefinementPrompt
            prompt = self.prompt_builder.build_tag_refinement_prompt(
                url=resource.get('url', ''),
                title=resource.get('title', ''),
                summary=resource.get('description', ''),
                existing_tags={
                    'personas': [],
                    'types': [],
                    'stages': [],
                    'topics': []
                },
                content_source='website',
                full_content=resource.get('content', '')[:30000]
            )
        elif resource_type in ['crib_sheet', 'contact']:
            # For Excel data, use spreadsheet prompt
            column_mapping = {
                'topic': 'Topic',
                'content': 'Content',
                'name': 'Name',
                'description': 'Description'
            }
            prompt = self.prompt_builder.build_spreadsheet_content_prompt(
                spreadsheet_row=resource,
                column_mapping=column_mapping
            )
        else:
            # Fallback to basic prompt
            prompt = self.prompt_builder.build_tag_refinement_prompt(
                url='',
                title=resource.get('title', resource.get('name', 'Unknown')),
                summary=resource.get('description', resource.get('content', '')),
                existing_tags={'personas': [], 'types': [], 'stages': [], 'topics': []},
                content_source='other'
            )
        
        # Call Bedrock with retry logic
        for attempt in range(max_retries):
            try:
                response = self.bedrock.invoke_model(
                    modelId=self.model_id,
                    body=json.dumps({
                        "anthropic_version": "bedrock-2023-05-31",
                        "max_tokens": 4096,
                        "temperature": 0.3,
                        "messages": [
                            {
                                "role": "user",
                                "content": prompt
                            }
                        ]
                    })
                )
                
                response_body = json.loads(response['body'].read())
                content = response_body['content'][0]['text']
                
                # Parse JSON from response
                json_start = content.find('{')
                json_end = content.rfind('}') + 1
                
                if json_start >= 0 and json_end > json_start:
                    classification = json.loads(content[json_start:json_end])
                    return classification
                else:
                    print(f"  ⚠️  Could not parse JSON from response")
                    return {}
                    
            except Exception as e:
                if attempt < max_retries - 1:
                    wait_time = 2 ** attempt  # Exponential backoff: 1s, 2s, 4s
                    print(f"  ⚠️  Attempt {attempt + 1} failed: {e}")
                    print(f"     Retrying in {wait_time}s...")
                    time.sleep(wait_time)
                else:
                    print(f"  ❌ Classification error after {max_retries} attempts: {e}")
                    return {}
    
    def process_web_content(self, limit: int = None, use_cached: bool = False, cached_file: str = None, resume: bool = True) -> List[Dict[str, Any]]:
        """Scrape and classify web content, or use cached data, with resume capability"""
        print("\n" + "="*80)
        print("PROCESSING LIVE WEB CONTENT")
        print("="*80)
        
        # Check for existing progress
        existing_results = []
        processed_urls = set()
        
        if resume:
            existing_results, metadata = self.load_progress()
            if existing_results:
                processed_urls = {r['original']['url'] for r in existing_results if r.get('source_type') == 'web_content'}
                print(f"📂 Resuming from checkpoint: {len(processed_urls)} items already processed")
        
        # Check if we should use cached data
        if use_cached and cached_file and Path(cached_file).exists():
            print(f"📂 Using cached web scraper data from: {get_relative_path(Path(cached_file))}")
            try:
                with open(cached_file, 'r') as f:
                    cached_data = json.load(f)
                
                # Convert cached format to our format
                scraped_data = []
                for item in cached_data[:limit] if limit else cached_data:
                    url = item.get('url', '')
                    # Skip if already processed
                    if url in processed_urls:
                        continue
                    
                    scraped_data.append({
                        'url': url,
                        'title': item.get('title', ''),
                        'description': item.get('summary', item.get('description', '')),
                        'content': item.get('content', item.get('summary', ''))[:8000],
                        'scraped_at': item.get('scraped_at', datetime.now().isoformat())
                    })
                
                print(f"✅ Loaded {len(scraped_data)} items from cache ({len(processed_urls)} already done)")
                
            except Exception as e:
                print(f"❌ Error loading cached data: {e}")
                print("   Falling back to live scraping...")
                use_cached = False
        
        # If not using cache, scrape live
        if not use_cached:
            # Get URLs from sitemap
            urls = self.scraper.get_sitemap()
            
            if not urls:
                print("❌ No URLs found in sitemap")
                return existing_results
            
            # Filter out already processed URLs
            urls_to_process = [url for url in urls if url not in processed_urls]
            if limit:
                urls_to_process = urls_to_process[:limit]
            
            print(f"📋 {len(urls_to_process)} URLs to process ({len(processed_urls)} already done)")
            
            # Scrape content
            scraped_data = self.scraper.scrape_multiple(urls_to_process, limit=None)
            
            if not scraped_data:
                print("❌ No content scraped")
                return existing_results
        
        # Classify each resource
        results = existing_results.copy()
        total = len(scraped_data)
        
        print(f"\n🤖 Classifying {total} web resources with Claude Opus 4.5...")
        
        for i, resource in enumerate(scraped_data, 1):
            print(f"[{i}/{total}] {resource['title'][:60]}...", end=' ')
            
            start_time = time.time()
            classification = self.classify_resource(resource, 'web_content')
            duration = time.time() - start_time
            
            if classification:
                result = {
                    'source_type': 'web_content',
                    'original': resource,
                    'refined': classification,
                    'processed_at': datetime.now().isoformat()
                }
                results.append(result)
                print(f"✓ ({duration:.1f}s)")
                
                # Save progress every 5 items
                if i % 5 == 0:
                    self.save_progress(results, {'last_processed': i, 'total': total, 'type': 'web_content'})
            else:
                print(f"✗ ({duration:.1f}s)")
            
            # Rate limiting
            time.sleep(0.2)
        
        # Final save
        self.save_progress(results, {'completed': True, 'type': 'web_content'})
        
        print(f"\n✅ Classified {len(results) - len(existing_results)}/{total} web resources")
        print(f"   Total: {len(results)} items")
        return results
    
    def process_excel_data(self, crib_sheet_file: str, contacts_file: str, limit: int = None) -> List[Dict[str, Any]]:
        """Process Excel files (crib sheet and contacts)"""
        results = []
        
        # Process crib sheet
        print("\n" + "="*80)
        print("PROCESSING LIVE CHAT CRIB SHEET")
        print("="*80)
        
        try:
            processor = LiveChatCribSheetProcessor(crib_sheet_file)
            crib_items = processor.create_tagging_dataset()
            
            if limit:
                crib_items = crib_items[:limit]
            
            print(f"Processing {len(crib_items)} crib sheet items...")
            
            for i, item in enumerate(crib_items, 1):
                print(f"[{i}/{len(crib_items)}] {item.get('topic', 'Unknown')[:40]}...", end=' ')
                
                start_time = time.time()
                classification = self.classify_resource(item, 'crib_sheet')
                duration = time.time() - start_time
                
                if classification:
                    result = {
                        'source_type': 'crib_sheet',
                        'original': item,
                        'refined': classification,
                        'processed_at': datetime.now().isoformat()
                    }
                    results.append(result)
                    print(f"✓ ({duration:.1f}s)")
                else:
                    print(f"✗ ({duration:.1f}s)")
                
                time.sleep(0.2)
            
            print(f"✅ Classified {len([r for r in results if r['source_type'] == 'crib_sheet'])} crib sheet items")
            
        except Exception as e:
            print(f"❌ Error processing crib sheet: {e}")
        
        # Process contacts
        print("\n" + "="*80)
        print("PROCESSING PROFESSIONAL CONTACTS")
        print("="*80)
        
        try:
            processor = ContactsProcessor(contacts_file)
            contact_items = processor.create_tagging_dataset()
            
            if limit:
                contact_items = contact_items[:limit]
            
            print(f"Processing {len(contact_items)} contact items...")
            
            for i, item in enumerate(contact_items, 1):
                print(f"[{i}/{len(contact_items)}] {item.get('name', 'Unknown')[:40]}...", end=' ')
                
                start_time = time.time()
                classification = self.classify_resource(item, 'contact')
                duration = time.time() - start_time
                
                if classification:
                    result = {
                        'source_type': 'contact',
                        'original': item,
                        'refined': classification,
                        'processed_at': datetime.now().isoformat()
                    }
                    results.append(result)
                    print(f"✓ ({duration:.1f}s)")
                else:
                    print(f"✗ ({duration:.1f}s)")
                
                time.sleep(0.2)
            
            print(f"✅ Classified {len([r for r in results if r['source_type'] == 'contact'])} contact items")
            
        except Exception as e:
            print(f"❌ Error processing contacts: {e}")
        
        return results
    
    def generate_outputs(self, all_results: List[Dict[str, Any]], output_dir: str):
        """Generate output files"""
        output_path = Path(output_dir)
        output_path.mkdir(exist_ok=True)
        
        print("\n" + "="*80)
        print("GENERATING OUTPUT FILES")
        print("="*80)
        
        # 1. Complete JSON - Knowledge Base ready format
        complete_file = output_path / 'encephalitis_content_database.json'
        with open(complete_file, 'w') as f:
            json.dump(all_results, f, indent=2)
        print(f"✅ Saved: {get_relative_path(complete_file)}")
        
        # 2. DynamoDB JSON
        dynamodb_items = []
        for i, result in enumerate(all_results, 1):
            item = {
                'resource_id': f"{result['source_type']}_{i:05d}",
                'source_type': result['source_type'],  # Changed from resource_type to source_type
                'title': result['original'].get('title', ''),
                'description': result['original'].get('description', ''),
                'url': result['original'].get('url', ''),
                'created_at': result['processed_at']
            }
            
            # Add refined tags
            refined = result.get('refined', {}).get('refined_tags', {})
            for key, value in refined.items():
                if isinstance(value, list):
                    item[key] = value
                else:
                    item[key] = value
            
            # Add metadata
            metadata = result.get('refined', {}).get('metadata', {})
            item['metadata'] = metadata
            
            # Add recommendations
            recommendations = result.get('refined', {}).get('recommendations', {})
            item['recommendations'] = recommendations
            
            dynamodb_items.append(item)
        
        dynamodb_file = output_path / 'dynamodb_resources.json'
        with open(dynamodb_file, 'w') as f:
            json.dump(dynamodb_items, f, indent=2)
        print(f"✅ Saved: {get_relative_path(dynamodb_file)}")
        
        # 3. Excel for charity staff (enhanced with adaptive classification support)
        excel_data = []
        for item in dynamodb_items:
            result_idx = dynamodb_items.index(item)
            full_result = all_results[result_idx] if result_idx < len(all_results) else {}
            refined = full_result.get('refined', {})
            refined_tags = refined.get('refined_tags', {})
            metadata = item.get('metadata', {})
            recommendations = item.get('recommendations', {})
            
            # Handle confidence scores (both formats)
            confidence_score = 0
            confidence_scores = refined.get('confidence_scores', {})
            if isinstance(confidence_scores, dict):
                confidence_score = confidence_scores.get('overall_classification', 0)
            else:
                confidence_score = metadata.get('confidence_score', 0)
            
            # Handle suggested new tags (adaptive classification)
            suggested_tags = refined.get('suggested_new_tags', [])
            suggested_tags_str = ''
            if suggested_tags:
                suggested_tags_str = '; '.join([
                    f"{tag.get('tag', '')} ({tag.get('confidence', 0)}%)"
                    for tag in suggested_tags[:3]  # Top 3 suggestions
                ])
            
            row = {
                'Resource ID': item['resource_id'],
                'Source': item['source_type'],  # Changed from resource_type to source_type
                'Title': item['title'],
                'Description': item['description'][:200],
                'URL': item.get('url', ''),
                'Personas': clean_tags_list(refined_tags.get('personas', [])),
                'Condition Types': clean_tags_list(refined_tags.get('types', [])),
                'Journey Stages': clean_tags_list(refined_tags.get('stages', [])),
                'Topics': clean_tags_list(refined_tags.get('topics', [])),
                'Symptoms': clean_tags_list(refined_tags.get('symptoms', [])),
                'Locations': clean_tags_list(refined_tags.get('locations', [])),
                'Reading Time': metadata.get('estimated_time', ''),
                'Complexity': metadata.get('complexity_level', ''),
                
                # Confidence scores (detailed)
                'Overall Confidence': confidence_score,
                'Persona Match': confidence_scores.get('persona_match', '') if isinstance(confidence_scores, dict) else '',
                'Stage Match': confidence_scores.get('stage_match', '') if isinstance(confidence_scores, dict) else '',
                'Topic Relevance': confidence_scores.get('topic_relevance', '') if isinstance(confidence_scores, dict) else '',
                
                # Adaptive classification
                'Suggested New Tags': suggested_tags_str,
                'Has Gap': 'Yes' if suggested_tags else 'No',
                
                'When to Use': recommendations.get('best_used_when', ''),
                'Staff Notes': recommendations.get('staff_notes', ''),
                'Processed': item['created_at']
            }
            excel_data.append(row)
        
        df = pd.DataFrame(excel_data)
        
        excel_file = output_path / 'classified_resources_for_charity.xlsx'
        with pd.ExcelWriter(excel_file, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='All Resources', index=False)
            
            # By Persona
            for persona in ['Patient', 'Caregiver', 'Parent', 'Professional', 'Bereaved']:
                persona_df = df[df['Personas'].str.contains(persona, case=False, na=False)]
                if not persona_df.empty:
                    persona_df.to_excel(writer, sheet_name=f'By {persona}', index=False)
            
            # Suggested Tags (Adaptive Classification)
            gap_df = df[df['Has Gap'] == 'Yes'][['Title', 'Suggested New Tags', 'Personas', 'Topics', 'Overall Confidence', 'URL']]
            if not gap_df.empty:
                gap_df.to_excel(writer, sheet_name='Suggested Tags', index=False)
            
            # Statistics
            confidence_scores_list = [score for score in df['Overall Confidence'] if score > 0]
            avg_confidence = sum(confidence_scores_list) / len(confidence_scores_list) if confidence_scores_list else 0
            
            stats_data = {
                'Metric': [
                    'Total Resources',
                    'Web Content',
                    'Crib Sheet Items',
                    'Contact Items',
                    'Avg Overall Confidence',
                    'Items with Confidence Scores',
                    'Items with Suggested Tags'
                ],
                'Value': [
                    len(df),
                    len(df[df['Source'] == 'web_content']),
                    len(df[df['Source'] == 'crib_sheet']),
                    len(df[df['Source'] == 'contact']),
                    f"{avg_confidence:.1f}",
                    len(confidence_scores_list),
                    len(df[df['Has Gap'] == 'Yes'])
                ]
            }
            pd.DataFrame(stats_data).to_excel(writer, sheet_name='Statistics', index=False)
        
        print(f"✅ Saved: {get_relative_path(excel_file)}")
    
    def run_complete_pipeline(self, crib_sheet_file: str, contacts_file: str, 
                            limit_per_source: int = None, output_dir: str = 'Output',
                            use_cached_web: bool = False, cached_web_file: str = None) -> Dict[str, Any]:
        """Run complete pipeline with option to use cached web data"""
        start_time = time.time()
        
        print("\n" + "="*80)
        print("LIVE RESOURCE CLASSIFICATION PIPELINE")
        print(f"Using: Claude Opus 4.5 (Global)")
        if use_cached_web:
            print(f"Mode: Using cached web data + live Excel processing")
        else:
            print(f"Mode: Live scraping + classification")
        print("="*80)
        
        all_results = []
        
        # 1. Process web content (live or cached)
        web_results = self.process_web_content(
            limit=limit_per_source, 
            use_cached=use_cached_web, 
            cached_file=cached_web_file
        )
        all_results.extend(web_results)
        
        # 2. Process Excel data
        excel_results = self.process_excel_data(crib_sheet_file, contacts_file, limit=limit_per_source)
        all_results.extend(excel_results)
        
        # 3. Generate outputs
        if all_results:
            self.generate_outputs(all_results, output_dir)
        
        # Summary
        duration = time.time() - start_time
        
        print("\n" + "="*80)
        print("PIPELINE COMPLETE")
        print("="*80)
        print(f"Total processing time: {duration/60:.1f} minutes")
        print(f"Total items processed: {len(all_results)}")
        print(f"  - Web content: {len([r for r in all_results if r['source_type'] == 'web_content'])}")
        print(f"  - Crib sheet: {len([r for r in all_results if r['source_type'] == 'crib_sheet'])}")
        print(f"  - Contacts: {len([r for r in all_results if r['source_type'] == 'contact'])}")
        
        return {
            'total_items': len(all_results),
            'duration_minutes': duration/60,
            'results': all_results
        }


if __name__ == "__main__":
    import sys
    
    # Initialize pipeline
    pipeline = LiveResourceClassificationPipeline(region_name='us-west-2')
    
    # Check for test mode
    test_mode = '--test' in sys.argv
    use_cached = '--cached' in sys.argv
    
    # Check for custom limit
    limit = None
    if '--limit' in sys.argv:
        try:
            limit_idx = sys.argv.index('--limit')
            if limit_idx + 1 < len(sys.argv):
                limit = int(sys.argv[limit_idx + 1])
        except (ValueError, IndexError):
            pass
    
    # Default to 5 for test mode if no custom limit
    if limit is None and test_mode:
        limit = 5
    
    # Check for cached file path
    cached_file = None
    if use_cached:
        # Look for --cached-file argument
        try:
            cached_idx = sys.argv.index('--cached')
            if cached_idx + 1 < len(sys.argv) and not sys.argv[cached_idx + 1].startswith('--'):
                cached_file = sys.argv[cached_idx + 1]
            else:
                # Default cached file location (within repo)
                cached_file = 'data/cached/web_scraper_content.json'
        except (ValueError, IndexError):
            cached_file = 'data/cached/web_scraper_content.json'
    
    if test_mode:
        print(f"\n🧪 TEST MODE: Processing {limit if limit else 'all'} items per source")
    else:
        print("\n🚀 PRODUCTION MODE: Processing all items")
    
    if limit and not test_mode:
        print(f"📊 CUSTOM LIMIT: Processing {limit} items per source")
    
    if use_cached:
        print(f"📂 CACHED MODE: Using pre-scraped data from {get_relative_path(Path(cached_file))}")
        print("   This saves time and API rate limits!")
    
    # Run pipeline with live web scraping or cached data
    results = pipeline.run_complete_pipeline(
        crib_sheet_file='data/Live chat crib sheet.xlsx',
        contacts_file='data/Encephalitis orgs, centres and country contacts_pi_removed.xlsx',
        limit_per_source=limit,
        output_dir='output',
        use_cached_web=use_cached,
        cached_web_file=cached_file
    )
    
    print("\n✅ All done!")
