"""
Query AWS Bedrock Knowledge Base for Semantic Search
Provides natural language search across classified resources

FEATURES:
- Semantic search using vector embeddings
- Natural language queries
- Metadata filtering
- Confidence scores
- RAG-ready results

USAGE:
    # Simple query
    python3 scripts/query_knowledge_base.py "memory problems after encephalitis"
    
    # Query with filters
    python3 scripts/query_knowledge_base.py "treatment options" --persona patient --stage early_recovery
    
    # Query with max results
    python3 scripts/query_knowledge_base.py "support for caregivers" --max-results 10
    
    # RAG query (with generation)
    python3 scripts/query_knowledge_base.py "What helps with memory problems?" --rag
"""

import boto3
import json
from typing import Dict, List, Any, Optional
from pathlib import Path
import argparse


class KnowledgeBaseQuery:
    """
    Query interface for Bedrock Knowledge Base
    """
    
    def __init__(self, kb_id: str, region_name: str = 'us-west-2'):
        """
        Initialize Knowledge Base query interface
        
        Args:
            kb_id: Knowledge Base ID
            region_name: AWS region
        """
        self.kb_id = kb_id
        self.region = region_name
        self.bedrock_agent_runtime = boto3.client('bedrock-agent-runtime', region_name=region_name)
        self.bedrock_runtime = boto3.client('bedrock-runtime', region_name=region_name)
        
        print(f"✅ Connected to Knowledge Base: {kb_id}")
        print(f"   Region: {region_name}")
        print()
    
    def retrieve(
        self,
        query: str,
        max_results: int = 5,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieve relevant documents using semantic search
        
        Args:
            query: Natural language query
            max_results: Maximum number of results
            filters: Optional metadata filters
            
        Returns:
            List of relevant documents with scores
        """
        print(f"🔍 Searching Knowledge Base")
        print(f"   Query: {query}")
        if filters:
            print(f"   Filters: {filters}")
        print()
        
        # Build retrieval configuration
        retrieval_config = {
            'vectorSearchConfiguration': {
                'numberOfResults': max_results
            }
        }
        
        # Add filters if provided
        if filters:
            retrieval_config['vectorSearchConfiguration']['filter'] = self._build_filter(filters)
        
        try:
            response = self.bedrock_agent_runtime.retrieve(
                knowledgeBaseId=self.kb_id,
                retrievalQuery={'text': query},
                retrievalConfiguration=retrieval_config
            )
            
            results = response['retrievalResults']
            
            print(f"✅ Found {len(results)} results\n")
            
            # Format results
            formatted_results = []
            for idx, result in enumerate(results, 1):
                formatted = self._format_result(result, idx)
                formatted_results.append(formatted)
            
            return formatted_results
            
        except Exception as e:
            print(f"❌ Error querying Knowledge Base: {e}")
            raise
    
    def retrieve_and_generate(
        self,
        query: str,
        max_results: int = 5,
        model_id: str = 'anthropic.claude-3-sonnet-20240229-v1:0'
    ) -> Dict[str, Any]:
        """
        Retrieve relevant documents and generate answer using RAG
        
        Args:
            query: Natural language question
            max_results: Maximum number of source documents
            model_id: LLM model for generation
            
        Returns:
            Dict with generated answer and source documents
        """
        print(f"🤖 RAG Query (Retrieve and Generate)")
        print(f"   Question: {query}")
        print(f"   Model: {model_id}")
        print()
        
        try:
            response = self.bedrock_agent_runtime.retrieve_and_generate(
                input={'text': query},
                retrieveAndGenerateConfiguration={
                    'type': 'KNOWLEDGE_BASE',
                    'knowledgeBaseConfiguration': {
                        'knowledgeBaseId': self.kb_id,
                        'modelArn': f'arn:aws:bedrock:{self.region}::foundation-model/{model_id}',
                        'retrievalConfiguration': {
                            'vectorSearchConfiguration': {
                                'numberOfResults': max_results
                            }
                        }
                    }
                }
            )
            
            # Extract answer and citations
            answer = response['output']['text']
            citations = response.get('citations', [])
            
            print("✅ Generated Answer:\n")
            print(answer)
            print("\n" + "="*80)
            print(f"SOURCES ({len(citations)} citations)")
            print("="*80 + "\n")
            
            sources = []
            for idx, citation in enumerate(citations, 1):
                for ref in citation.get('retrievedReferences', []):
                    metadata = ref.get('metadata', {})
                    content = ref.get('content', {}).get('text', '')
                    
                    print(f"Source {idx}:")
                    print(f"  Title: {metadata.get('title', 'N/A')}")
                    print(f"  URL: {metadata.get('url', 'N/A')}")
                    print(f"  Excerpt: {content[:150]}...")
                    print()
                    
                    sources.append({
                        'title': metadata.get('title'),
                        'url': metadata.get('url'),
                        'content': content,
                        'metadata': metadata
                    })
            
            return {
                'answer': answer,
                'sources': sources,
                'citations': citations
            }
            
        except Exception as e:
            print(f"❌ Error in RAG query: {e}")
            raise
    
    def _build_filter(self, filters: Dict[str, Any]) -> Dict[str, Any]:
        """Build metadata filter for retrieval"""
        # Convert simple filters to OpenSearch filter format
        filter_conditions = []
        
        for key, value in filters.items():
            if isinstance(value, list):
                # OR condition for multiple values
                or_conditions = [
                    {'equals': {'key': key, 'value': v}}
                    for v in value
                ]
                filter_conditions.append({'orAll': or_conditions})
            else:
                # Single value
                filter_conditions.append({'equals': {'key': key, 'value': value}})
        
        if len(filter_conditions) == 1:
            return filter_conditions[0]
        else:
            return {'andAll': filter_conditions}
    
    def _format_result(self, result: Dict[str, Any], index: int) -> Dict[str, Any]:
        """Format a single result for display"""
        score = result.get('score', 0)
        content = result.get('content', {}).get('text', '')
        metadata = result.get('metadata', {})
        
        # Print result
        print(f"Result {index} (Relevance: {score:.3f})")
        print("="*80)
        print(f"Title: {metadata.get('title', 'N/A')}")
        print(f"URL: {metadata.get('url', 'N/A')}")
        print(f"Personas: {metadata.get('personas', 'N/A')}")
        print(f"Journey Stage: {metadata.get('stages', 'N/A')}")
        print(f"Topics: {metadata.get('topics', 'N/A')}")
        print(f"Complexity: {metadata.get('complexity_level', 'N/A')}")
        print(f"\nContent Preview:")
        print(content[:300] + "..." if len(content) > 300 else content)
        print("="*80 + "\n")
        
        return {
            'score': score,
            'content': content,
            'metadata': metadata,
            'title': metadata.get('title'),
            'url': metadata.get('url')
        }


def load_config() -> Dict[str, str]:
    """Load Knowledge Base configuration"""
    config_file = 'knowledge_base_config.json'
    if Path(config_file).exists():
        with open(config_file, 'r') as f:
            return json.load(f)
    return {}


def main():
    parser = argparse.ArgumentParser(
        description='Query AWS Bedrock Knowledge Base for Encephalitis resources'
    )
    parser.add_argument('query', nargs='+', help='Search query')
    parser.add_argument('--max-results', type=int, default=5, help='Maximum number of results')
    parser.add_argument('--persona', help='Filter by persona (e.g., patient, caregiver)')
    parser.add_argument('--stage', help='Filter by journey stage (e.g., pre_diagnosis)')
    parser.add_argument('--topic', help='Filter by topic (e.g., memory, treatment)')
    parser.add_argument('--rag', action='store_true', help='Use RAG to generate answer')
    parser.add_argument('--model', default='anthropic.claude-3-sonnet-20240229-v1:0', help='Model for RAG')
    
    args = parser.parse_args()
    
    # Load configuration
    config = load_config()
    if not config:
        print("❌ No Knowledge Base configuration found.")
        print("   Run: python3 scripts/create_knowledge_base.py --create")
        return
    
    # Initialize query interface
    kb_query = KnowledgeBaseQuery(
        kb_id=config['knowledge_base_id'],
        region_name=config.get('region', 'us-west-2')
    )
    
    # Build query string
    query_text = ' '.join(args.query)
    
    # Build filters
    filters = {}
    if args.persona:
        filters['personas'] = f'persona:{args.persona}'
    if args.stage:
        filters['stages'] = f'stage:{args.stage}'
    if args.topic:
        filters['topics'] = f'topic:{args.topic}'
    
    # Execute query
    if args.rag:
        # RAG query with answer generation
        result = kb_query.retrieve_and_generate(
            query=query_text,
            max_results=args.max_results,
            model_id=args.model
        )
        
        # Save result
        output_file = 'rag_query_result.json'
        with open(output_file, 'w') as f:
            json.dump(result, f, indent=2)
        print(f"\n💾 Result saved to: {output_file}")
        
    else:
        # Simple retrieval
        results = kb_query.retrieve(
            query=query_text,
            max_results=args.max_results,
            filters=filters if filters else None
        )
        
        # Save results
        output_file = 'kb_query_results.json'
        with open(output_file, 'w') as f:
            json.dump(results, f, indent=2)
        print(f"💾 Results saved to: {output_file}")


if __name__ == "__main__":
    main()
