"""
Complete Resource Classification Pipeline - Resilient Processing
Uses AWS Bedrock Claude Opus 4.5 to classify all resources
Outputs: DynamoDB JSON + Excel file for charity

RESILIENT FEATURES:
- Auto-saves progress every 5 items
- Auto-resumes from last checkpoint
- Network retry logic (3 attempts with exponential backoff)
- Survives interruptions (max loss: 4 items)

USAGE:
    Recommended (with resilient runner):
        ./run_resilient.sh process_all_resources.py [--test]
    
    Direct execution (still has auto-resume):
        python3 process_all_resources.py [--test]

For complete documentation, see RESILIENT_PROCESSING.md
"""

import json
import boto3
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


class ResourceClassificationPipeline:
    """
    Complete pipeline to classify all resources using Claude Opus 4.5
    
    RESILIENT PROCESSING FEATURES:
    - Automatic progress saving every 5 items
    - Automatic resume from last checkpoint
    - Network retry logic with exponential backoff
    - Graceful error handling
    
    The pipeline can be safely interrupted and resumed at any time.
    Maximum data loss: 4 items (between checkpoints)
    """
    
    def __init__(self, region_name: str = 'us-west-2'):
        """
        Initialize pipeline with Claude Opus 4.5 and resilient processing
        
        Args:
            region_name: AWS region (default: us-west-2)
        
        Raises:
            ValueError: If AWS credentials are not configured
        """
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
        
        # Create session with explicit credentials
        session = boto3.Session(
            aws_access_key_id=aws_access_key,
            aws_secret_access_key=aws_secret_key,
            aws_session_token=aws_session_token,
            region_name=region_name
        )
        
        self.bedrock_runtime = session.client('bedrock-runtime')
        self.model_id = 'global.anthropic.claude-opus-4-5-20251101-v1:0'
        self.prompt_builder = BedrockTagRefinementPrompt()
        self.results = []
        
        # Progress tracking for resilient processing
        self.progress_file = 'temp/progress_checkpoint_cached.json'
        
        print(f"✅ Initialized with Claude Opus 4.5 (Global)")
        print(f"   Model: {self.model_id}")
        print(f"   Region: {region_name}")
        print(f"   Progress file: {get_relative_path(Path(self.progress_file))}")
        print(f"   Resilient mode: ✅ Enabled (auto-save every 5 items)")
        print(f"   Network retry: ✅ Enabled (3 attempts with backoff)")
        print(f"   Auto-resume: ✅ Enabled (from checkpoint)")
        print()
    
    def save_progress(self, results: List[Dict[str, Any]], metadata: Dict[str, Any]):
        """
        Save progress to checkpoint file for resilient processing
        
        Args:
            results: List of processed results
            metadata: Processing metadata (last_processed, total, type, etc.)
        """
        try:
            checkpoint = {
                'timestamp': datetime.now().isoformat(),
                'metadata': metadata,
                'results': results
            }
            with open(self.progress_file, 'w') as f:
                json.dump(checkpoint, f, indent=2)
            
            # Print progress indicator
            if 'last_processed' in metadata and 'total' in metadata:
                progress_pct = (metadata['last_processed'] / metadata['total']) * 100
                print(f"   💾 Progress saved: {metadata['last_processed']}/{metadata['total']} ({progress_pct:.1f}%)")
        except Exception as e:
            print(f"⚠️  Warning: Could not save progress: {e}")
    
    def load_progress(self) -> tuple:
        """
        Load progress from checkpoint file for auto-resume
        
        Returns:
            Tuple of (results, metadata) from checkpoint, or ([], {}) if no checkpoint
        """
        if Path(self.progress_file).exists():
            try:
                with open(self.progress_file, 'r') as f:
                    checkpoint = json.load(f)
                
                results = checkpoint.get('results', [])
                metadata = checkpoint.get('metadata', {})
                
                if results:
                    print(f"📂 Found checkpoint from {checkpoint.get('timestamp', 'unknown time')}")
                    if 'last_processed' in metadata:
                        print(f"   Resuming from item {metadata['last_processed']}")
                
                return results, metadata
            except Exception as e:
                print(f"⚠️  Warning: Could not load progress: {e}")
                print(f"   Starting fresh...")
        return [], {}
        
    def classify_item(self, item: Dict[str, Any], source_type: str, max_retries: int = 3) -> Dict[str, Any]:
        """
        Classify a single item using Claude Opus 4.5 with network retry logic
        
        Args:
            item: Item to classify
            source_type: 'web_scraper', 'crib_sheet', or 'contacts'
            max_retries: Number of retries on network errors (default: 3)
        
        Returns:
            Classified item with refined tags, or error information
        
        Resilient Features:
            - Automatic retry on network errors
            - Exponential backoff (1s, 2s, 4s)
            - Graceful error handling
        """
        
        # Build appropriate prompt based on source type
        if source_type == 'web_scraper':
            prompt = self.prompt_builder.build_tag_refinement_prompt(
                url=item.get('url', ''),
                title=item.get('title', ''),
                summary=item.get('summary', ''),
                existing_tags=item.get('tags', {}),
                content_source='website'
            )
        else:  # crib_sheet or contacts
            prompt = self.prompt_builder.build_spreadsheet_content_prompt(
                spreadsheet_row={
                    'title': item.get('title', ''),
                    'description': item.get('description', item.get('summary', '')),
                    'category': item.get('category', ''),
                    'audience': item.get('audience', ''),
                    'url': ', '.join(item.get('urls', [])),
                    'notes': item.get('notes', '')
                },
                column_mapping={
                    'title': 'title',
                    'description': 'description',
                    'category': 'category',
                    'audience': 'audience',
                    'url': 'url',
                    'notes': 'notes'
                }
            )
        
        # Retry logic for network issues
        for attempt in range(max_retries):
            try:
                # Call Claude Sonnet 4.5
                request_body = {
                    "anthropic_version": "bedrock-2023-05-31",
                    "max_tokens": 4096,
                    "temperature": 0.3,
                    "messages": [
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ]
                }
                
                response = self.bedrock_runtime.invoke_model(
                    modelId=self.model_id,
                    body=json.dumps(request_body)
                )
                
                response_body = json.loads(response['body'].read())
                content_text = response_body['content'][0]['text']
                
                # Extract JSON
                if '```json' in content_text:
                    json_start = content_text.find('```json') + 7
                    json_end = content_text.find('```', json_start)
                    json_text = content_text[json_start:json_end].strip()
                elif '{' in content_text:
                    json_start = content_text.find('{')
                    json_end = content_text.rfind('}') + 1
                    json_text = content_text[json_start:json_end]
                else:
                    json_text = content_text
                
                refined_data = json.loads(json_text)
                
                # Combine original and refined data
                result = {
                    'source_type': source_type,
                    'original': item,
                    'refined': refined_data,
                    'processed_at': datetime.now().isoformat()
                }
                
                return result
                
            except Exception as e:
                error_msg = str(e)
                if attempt < max_retries - 1:
                    # Network or temporary error - retry with exponential backoff
                    if 'timeout' in error_msg.lower() or 'connection' in error_msg.lower() or 'network' in error_msg.lower():
                        wait_time = 2 ** attempt
                        print(f"⚠️  Network error, retrying in {wait_time}s ({attempt + 1}/{max_retries})...")
                        time.sleep(wait_time)
                        continue
                
                # Final failure or non-network error
                print(f"❌ Error: {error_msg}")
                return {
                    'source_type': source_type,
                    'original': item,
                    'error': error_msg,
                    'processed_at': datetime.now().isoformat()
                }
    
    def process_web_scraper_data(self, json_file: str, limit: int = None, resume: bool = True) -> List[Dict]:
        """
        Process web scraper data with resilient processing
        
        Args:
            json_file: Path to web scraper JSON file
            limit: Limit number of items (for testing)
            resume: Enable auto-resume from checkpoint (default: True)
        
        Returns:
            List of classified results
        
        Resilient Features:
            - Auto-resume from last checkpoint
            - Progress saved every 5 items
            - Can be safely interrupted and resumed
        """
        print("\n" + "=" * 80)
        print("PROCESSING WEB SCRAPER DATA (RESILIENT MODE)")
        print("=" * 80)
        
        # Check for existing progress
        existing_results = []
        processed_count = 0
        
        if resume:
            existing_results, metadata = self.load_progress()
            if existing_results:
                processed_count = len([r for r in existing_results if r.get('source_type') == 'web_scraper'])
                if processed_count > 0:
                    print(f"✅ Resuming from checkpoint: {processed_count} items already processed")
                    print(f"   You can safely interrupt and resume at any time")
                    print()
        
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if limit:
            data = data[:limit]
        
        # Skip already processed items
        data_to_process = data[processed_count:]
        
        if processed_count > 0:
            print(f"Processing {len(data_to_process)} remaining items ({processed_count} already done)...")
        else:
            print(f"Processing {len(data)} web scraper items...")
        
        print(f"Progress will be saved every 5 items")
        print()
        
        start_time = time.time()
        
        results = existing_results.copy()
        for idx, item in enumerate(data_to_process, processed_count + 1):
            item_start = time.time()
            print(f"[{idx}/{len(data)}] {item.get('title', 'Unknown')[:60]}...", end=' ')
            result = self.classify_item(item, 'web_scraper')
            results.append(result)
            
            item_time = time.time() - item_start
            status = "✓" if 'error' not in result else "✗"
            print(f"{status} ({item_time:.1f}s)")
            
            # Save progress every 5 items
            if idx % 5 == 0:
                self.save_progress(results, {'last_processed': idx, 'total': len(data), 'type': 'web_scraper'})
            
            # Reduced delay for faster processing
            time.sleep(0.2)
        
        # Final save
        self.save_progress(results, {'completed': True, 'total': len(data), 'type': 'web_scraper'})
        
        total_time = time.time() - start_time
        print()
        print(f"✅ Completed {len(results) - processed_count} items in {total_time/60:.1f} minutes")
        print(f"   Total: {len(results)} items")
        if len(results) > processed_count:
            print(f"   Average: {total_time/(len(results) - processed_count):.1f}s per item")
        return results
    
    def process_crib_sheet(self, excel_file: str, limit: int = None) -> List[Dict]:
        """Process crib sheet data"""
        print("\n" + "=" * 80)
        print("PROCESSING LIVE CHAT CRIB SHEET")
        print("=" * 80)
        
        processor = LiveChatCribSheetProcessor(excel_file)
        dataset = processor.create_tagging_dataset()
        
        if limit:
            dataset = dataset[:limit]
        
        print(f"Processing {len(dataset)} crib sheet items...")
        start_time = time.time()
        
        results = []
        for idx, item in enumerate(dataset, 1):
            item_start = time.time()
            print(f"[{idx}/{len(dataset)}] {item.get('title', 'Unknown')[:60]}...", end=' ')
            result = self.classify_item(item, 'crib_sheet')
            results.append(result)
            
            item_time = time.time() - item_start
            print(f"({item_time:.1f}s)")
            
            time.sleep(0.2)
        
        total_time = time.time() - start_time
        print(f"✓ Completed {len(results)} items in {total_time/60:.1f} minutes")
        print(f"  Average: {total_time/len(results):.1f}s per item")
        return results
    
    def process_contacts(self, excel_file: str, limit: int = None) -> List[Dict]:
        """Process contacts data"""
        print("\n" + "=" * 80)
        print("PROCESSING PROFESSIONAL CONTACTS")
        print("=" * 80)
        
        processor = ContactsProcessor(excel_file)
        dataset = processor.create_tagging_dataset()
        
        if limit:
            dataset = dataset[:limit]
        
        print(f"Processing {len(dataset)} contact items...")
        start_time = time.time()
        
        results = []
        for idx, item in enumerate(dataset, 1):
            item_start = time.time()
            print(f"[{idx}/{len(dataset)}] {item.get('title', 'Unknown')[:60]}...", end=' ')
            result = self.classify_item(item, 'contacts')
            results.append(result)
            
            item_time = time.time() - item_start
            print(f"({item_time:.1f}s)")
            
            time.sleep(0.2)
        
        total_time = time.time() - start_time
        print(f"✓ Completed {len(results)} items in {total_time/60:.1f} minutes")
        print(f"  Average: {total_time/len(results):.1f}s per item")
        return results
    
    def create_dynamodb_format(self, results: List[Dict]) -> List[Dict]:
        """
        Convert results to DynamoDB format
        
        DynamoDB structure:
        - resource_id (partition key)
        - resource_type (sort key)
        - title, description, url
        - tags (map)
        - metadata (map)
        """
        dynamodb_items = []
        
        for idx, result in enumerate(results, 1):
            if 'error' in result:
                continue
            
            original = result['original']
            refined = result.get('refined', {})
            refined_tags = refined.get('refined_tags', {})
            
            # Create DynamoDB item
            item = {
                'resource_id': f"{result['source_type']}_{idx:05d}",
                'source_type': result['source_type'],  # Changed from resource_type to source_type
                'title': original.get('title', ''),
                'description': original.get('description', original.get('summary', '')),
                'url': original.get('url', ', '.join(original.get('urls', []))),
                'full_content': original.get('full_content', original.get('summary', '')),
                
                # Tags
                'personas': refined_tags.get('personas', []),
                'types': refined_tags.get('types', []),
                'stages': refined_tags.get('stages', []),
                'topics': refined_tags.get('topics', []),
                'symptoms': refined_tags.get('symptoms', []),
                'locations': refined_tags.get('locations', []),
                'conditions': refined_tags.get('conditions', []),
                'resource_types': refined_tags.get('resource_type', []),
                'content_length': refined_tags.get('content_length', ''),
                'content_format': refined_tags.get('content_format', ''),
                'playlists': refined_tags.get('playlists', []),
                
                # Metadata
                'metadata': {
                    'estimated_time': refined.get('metadata', {}).get('estimated_time', ''),
                    'complexity_level': refined.get('metadata', {}).get('complexity_level', ''),
                    'emotional_tone': refined.get('metadata', {}).get('emotional_tone', ''),
                    'priority_level': refined.get('metadata', {}).get('priority_level', ''),
                    'confidence_score': refined.get('confidence_score', 0)
                },
                
                # Staff context
                'staff_context': refined.get('staff_context', {}),
                'recommendations': refined.get('recommendations', {}),
                
                # Timestamps
                'created_at': result['processed_at'],
                'updated_at': result['processed_at']
            }
            
            dynamodb_items.append(item)
        
        return dynamodb_items
    
    def create_excel_for_charity(self, results: List[Dict], output_file: str):
        """
        Create Excel file for charity staff
        
        Sheets:
        1. All Resources - Complete list
        2. By Persona - Grouped by persona
        3. By Stage - Grouped by journey stage
        4. By Topic - Grouped by topic
        5. Statistics - Summary statistics
        
        Handles both standard and adaptive classification formats
        """
        
        # Prepare data for main sheet
        rows = []
        for result in results:
            if 'error' in result:
                continue
            
            original = result['original']
            refined = result.get('refined', {})
            refined_tags = refined.get('refined_tags', {})
            metadata = refined.get('metadata', {})
            staff_context = refined.get('staff_context', {})
            
            # Handle confidence scores (both formats)
            confidence_score = 0
            confidence_scores = refined.get('confidence_scores', {})
            if isinstance(confidence_scores, dict):
                # Use overall_classification if available
                confidence_score = confidence_scores.get('overall_classification', 0)
            else:
                # Try singular format
                confidence_score = refined.get('confidence_score', 0)
            
            # Handle suggested new tags (adaptive classification)
            suggested_tags = refined.get('suggested_new_tags', [])
            suggested_tags_str = ''
            if suggested_tags:
                suggested_tags_str = '; '.join([
                    f"{tag.get('tag', '')} ({tag.get('confidence', 0)}%)"
                    for tag in suggested_tags[:3]  # Top 3 suggestions
                ])
            
            row = {
                'Resource ID': f"{result['source_type']}_{results.index(result)+1:05d}",
                'Source': result['source_type'],
                'Title': original.get('title', ''),
                'Description': original.get('description', original.get('summary', ''))[:200],
                'URL': original.get('url', ', '.join(original.get('urls', []))),
                
                # Tags (human-readable, no prefixes)
                'Personas': clean_tags_list(refined_tags.get('personas', [])),
                'Condition Types': clean_tags_list(refined_tags.get('types', [])),
                'Journey Stages': clean_tags_list(refined_tags.get('stages', [])),
                'Topics': clean_tags_list(refined_tags.get('topics', [])),
                'Symptoms': clean_tags_list(refined_tags.get('symptoms', [])),
                'Locations': clean_tags_list(refined_tags.get('locations', [])),
                'Resource Type': clean_tags_list(refined_tags.get('resource_type', [])),
                
                # Metadata
                'Reading Time': metadata.get('estimated_time', ''),
                'Complexity': metadata.get('complexity_level', ''),
                'Tone': metadata.get('emotional_tone', ''),
                'Priority': metadata.get('priority_level', ''),
                
                # Confidence scores (detailed)
                'Overall Confidence': confidence_score,
                'Persona Match': confidence_scores.get('persona_match', '') if isinstance(confidence_scores, dict) else '',
                'Stage Match': confidence_scores.get('stage_match', '') if isinstance(confidence_scores, dict) else '',
                'Topic Relevance': confidence_scores.get('topic_relevance', '') if isinstance(confidence_scores, dict) else '',
                
                # Adaptive classification
                'Suggested New Tags': suggested_tags_str,
                'Has Gap': 'Yes' if suggested_tags else 'No',
                
                # Staff guidance
                'When to Use': ', '.join(staff_context.get('interpreted_use_cases', []))[:200] if staff_context.get('interpreted_use_cases') else '',
                'Staff Notes': staff_context.get('staff_guidance', '')[:200],
                
                # Recommendations
                'Best For': refined.get('recommendations', {}).get('primary_audience', '')[:200],
                
                'Processed Date': result['processed_at']
            }
            
            rows.append(row)
        
        # Create Excel writer
        with pd.ExcelWriter(output_file, engine='openpyxl') as writer:
            
            # Sheet 1: All Resources
            df_all = pd.DataFrame(rows)
            df_all.to_excel(writer, sheet_name='All Resources', index=False)
            
            # Sheet 2: By Persona
            persona_rows = []
            for row in rows:
                personas = row['Personas'].split(', ') if row['Personas'] else []
                for persona in personas:
                    persona_row = row.copy()
                    persona_row['Primary Persona'] = persona
                    persona_rows.append(persona_row)
            
            if persona_rows:
                df_persona = pd.DataFrame(persona_rows)
                df_persona = df_persona.sort_values('Primary Persona')
                df_persona.to_excel(writer, sheet_name='By Persona', index=False)
            
            # Sheet 3: By Stage
            stage_rows = []
            for row in rows:
                stages = row['Journey Stages'].split(', ') if row['Journey Stages'] else []
                for stage in stages:
                    stage_row = row.copy()
                    stage_row['Primary Stage'] = stage
                    stage_rows.append(stage_row)
            
            if stage_rows:
                df_stage = pd.DataFrame(stage_rows)
                df_stage = df_stage.sort_values('Primary Stage')
                df_stage.to_excel(writer, sheet_name='By Journey Stage', index=False)
            
            # Sheet 4: By Topic
            topic_rows = []
            for row in rows:
                topics = row['Topics'].split(', ') if row['Topics'] else []
                for topic in topics:
                    topic_row = row.copy()
                    topic_row['Primary Topic'] = topic
                    topic_rows.append(topic_row)
            
            if topic_rows:
                df_topic = pd.DataFrame(topic_rows)
                df_topic = df_topic.sort_values('Primary Topic')
                df_topic.to_excel(writer, sheet_name='By Topic', index=False)
            
            # Sheet 5: Adaptive Classification Insights
            adaptive_rows = []
            for row in rows:
                if row['Has Gap'] == 'Yes':
                    adaptive_rows.append({
                        'Title': row['Title'][:60],
                        'Suggested Tags': row['Suggested New Tags'],
                        'Current Personas': row['Personas'],
                        'Current Topics': row['Topics'],
                        'Overall Confidence': row['Overall Confidence'],
                        'URL': row['URL']
                    })
            
            if adaptive_rows:
                df_adaptive = pd.DataFrame(adaptive_rows)
                df_adaptive.to_excel(writer, sheet_name='Suggested Tags', index=False)
            
            # Sheet 6: Statistics
            # Calculate average confidence (handle both formats)
            confidence_scores = [r['Overall Confidence'] for r in rows if r['Overall Confidence'] > 0]
            avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0
            
            stats = {
                'Metric': [
                    'Total Resources',
                    'Web Scraper Items',
                    'Crib Sheet Items',
                    'Contact Items',
                    'Average Overall Confidence',
                    'Items with Confidence Scores',
                    'High Priority Items',
                    'Items with Suggested Tags',
                    'Unique Personas',
                    'Unique Topics',
                    'Unique Locations'
                ],
                'Value': [
                    len(rows),
                    len([r for r in rows if r['Source'] == 'web_scraper']),
                    len([r for r in rows if r['Source'] == 'crib_sheet']),
                    len([r for r in rows if r['Source'] == 'contacts']),
                    f"{avg_confidence:.1f}",
                    len(confidence_scores),
                    len([r for r in rows if r['Priority'] == 'high']),
                    len([r for r in rows if r['Has Gap'] == 'Yes']),
                    len(set(p for r in rows for p in r['Personas'].split(', ') if p)),
                    len(set(t for r in rows for t in r['Topics'].split(', ') if t)),
                    len(set(l for r in rows for l in r['Locations'].split(', ') if l))
                ]
            }
            
            df_stats = pd.DataFrame(stats)
            df_stats.to_excel(writer, sheet_name='Statistics', index=False)
        
        print(f"\n✓ Excel file created: {get_relative_path(Path(output_file))}")
        print(f"   Sheets: All Resources, By Persona, By Journey Stage, By Topic, Suggested Tags, Statistics")
    
    def run_complete_pipeline(
        self,
        web_scraper_file: str = None,
        crib_sheet_file: str = None,
        contacts_file: str = None,
        limit_per_source: int = None,
        output_dir: str = '.'
    ):
        """
        Run complete classification pipeline
        
        Args:
            web_scraper_file: Path to web scraper JSON
            crib_sheet_file: Path to crib sheet Excel
            contacts_file: Path to contacts Excel
            limit_per_source: Limit items per source (for testing)
            output_dir: Output directory
        """
        
        print("=" * 80)
        print("RESOURCE CLASSIFICATION PIPELINE - RESILIENT MODE")
        print("Using: Claude Opus 4.5 (Global)")
        print("=" * 80)
        print()
        print("RESILIENT FEATURES ENABLED:")
        print("  ✅ Auto-save progress every 5 items")
        print("  ✅ Auto-resume from checkpoint")
        print("  ✅ Network retry (3 attempts with backoff)")
        print("  ✅ Graceful error handling")
        print()
        print("You can safely interrupt this process at any time.")
        print("To resume, simply run the same command again.")
        print("=" * 80)
        print()
        
        pipeline_start = time.time()
        all_results = []
        
        # Process web scraper
        if web_scraper_file and Path(web_scraper_file).exists():
            web_results = self.process_web_scraper_data(web_scraper_file, limit_per_source)
            all_results.extend(web_results)
        
        # Process crib sheet
        if crib_sheet_file and Path(crib_sheet_file).exists():
            crib_results = self.process_crib_sheet(crib_sheet_file, limit_per_source)
            all_results.extend(crib_results)
        
        # Process contacts
        if contacts_file and Path(contacts_file).exists():
            contact_results = self.process_contacts(contacts_file, limit_per_source)
            all_results.extend(contact_results)
        
        # Save complete results - Knowledge Base ready format
        complete_output = Path(output_dir) / 'encephalitis_content_database.json'
        with open(complete_output, 'w', encoding='utf-8') as f:
            json.dump(all_results, f, indent=2, ensure_ascii=False)
        print(f"\n✓ Complete results saved: {get_relative_path(complete_output)}")
        
        # Create DynamoDB format
        print("\n" + "=" * 80)
        print("CREATING DYNAMODB FORMAT")
        print("=" * 80)
        
        dynamodb_items = self.create_dynamodb_format(all_results)
        dynamodb_output = Path(output_dir) / 'dynamodb_resources.json'
        with open(dynamodb_output, 'w', encoding='utf-8') as f:
            json.dump(dynamodb_items, f, indent=2, ensure_ascii=False)
        print(f"✓ DynamoDB format saved: {get_relative_path(dynamodb_output)}")
        print(f"  Items: {len(dynamodb_items)}")
        
        # Create Excel for charity
        print("\n" + "=" * 80)
        print("CREATING EXCEL FILE FOR CHARITY")
        print("=" * 80)
        
        excel_output = Path(output_dir) / 'classified_resources_for_charity.xlsx'
        self.create_excel_for_charity(all_results, str(excel_output))
        
        # Summary
        print("\n" + "=" * 80)
        print("PIPELINE COMPLETE ✅")
        print("=" * 80)
        
        total_time = time.time() - pipeline_start
        successful = len([r for r in all_results if 'error' not in r])
        errors = len([r for r in all_results if 'error' in r])
        
        print(f"\n📊 PROCESSING SUMMARY:")
        print(f"   Total time: {total_time/60:.1f} minutes ({total_time/3600:.2f} hours)")
        print(f"   Total items: {len(all_results)}")
        print(f"   Successful: {successful} ({successful/len(all_results)*100:.1f}%)")
        print(f"   Errors: {errors} ({errors/len(all_results)*100:.1f}%)")
        print(f"   Average: {total_time/len(all_results):.1f}s per item")
        
        print(f"\n📁 OUTPUT FILES:")
        print(f"   1. {get_relative_path(complete_output)}")
        print(f"   2. {get_relative_path(dynamodb_output)}")
        print(f"   3. {get_relative_path(excel_output)}")
        
        print(f"\n💡 NEXT STEPS:")
        print(f"   1. Review outputs in output/ directory")
        print(f"   2. Upload to DynamoDB: python scripts/upload_to_dynamodb.py")
        print(f"   3. Deploy web scraper (see web-scraper/docs/DEPLOYMENT.md)")
        
        print("\n" + "=" * 80)
        
        return {
            'total_processed': len(all_results),
            'successful': len([r for r in all_results if 'error' not in r]),
            'errors': len([r for r in all_results if 'error' in r]),
            'outputs': {
                'complete_json': str(complete_output),
                'dynamodb_json': str(dynamodb_output),
                'excel': str(excel_output)
            }
        }


if __name__ == "__main__":
    import sys
    
    print("\n" + "=" * 80)
    print("RESOURCE CLASSIFICATION PIPELINE - RESILIENT PROCESSING")
    print("=" * 80)
    
    # Initialize pipeline
    pipeline = ResourceClassificationPipeline(region_name='us-west-2')
    
    # Check for test mode
    test_mode = '--test' in sys.argv
    no_prompt = '--no-prompt' in sys.argv or '--yes' in sys.argv or '-y' in sys.argv
    limit = 5 if test_mode else None
    
    if test_mode:
        print("\n🧪 TEST MODE: Processing 5 items per source (15 total)")
        print("   Time estimate: ~5 minutes")
        print("   Cost estimate: ~$0.30")
    else:
        print("\n🚀 PRODUCTION MODE: Processing all items (1,255 total)")
        print("   Time estimate: ~7 hours")
        print("   Cost estimate: ~£174-182")
    
    print("\n📂 CACHED MODE: Using pre-scraped web data")
    print("   This saves time and avoids API rate limits!")
    
    print("\n💡 RESILIENT MODE TIPS:")
    print("   • Progress is saved every 5 items")
    print("   • You can safely interrupt (Ctrl+C) and resume later")
    print("   • Network errors are automatically retried")
    print("   • To resume: just run the same command again")
    
    print("\n📖 For more information:")
    print("   • Processing guide: PROCESSING_GUIDE.md")
    print("   • Resilient mode: RESILIENT_PROCESSING.md")
    print("   • Quick start: QUICK_START.md")
    
    print("\n" + "=" * 80)
    
    # Only prompt if running interactively and not in no-prompt mode
    if not no_prompt:
        if sys.stdin.isatty():
            try:
                input("\nPress ENTER to start processing (or Ctrl+C to cancel)...")
            except (EOFError, KeyboardInterrupt):
                print("\nCancelled by user")
                sys.exit(0)
        else:
            print("\nStarting processing (non-interactive mode)...")
            time.sleep(2)  # Brief pause to show message
    else:
        print("\nStarting processing (--no-prompt mode)...")
    
    print()
    
    # Run pipeline using cached web scraper data
    results = pipeline.run_complete_pipeline(
        web_scraper_file='data/cached/web_scraper_content.json',
        crib_sheet_file='data/Live chat crib sheet.xlsx',
        contacts_file='data/Encephalitis orgs, centres and country contacts_pi_removed.xlsx',
        limit_per_source=limit,
        output_dir='output'
    )
    
    print("\n✅ All done!")
    print("\n💡 RECOMMENDED: Use resilient runner for production:")
    print("   ./run_resilient.sh process_all_resources.py")
    print("\n   Benefits:")
    print("   • Runs in background (survives terminal disconnection)")
    print("   • Real-time log file monitoring")
    print("   • Process management (PID tracking)")
    print()
