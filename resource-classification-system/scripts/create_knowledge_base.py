"""
Create and Configure AWS Bedrock Knowledge Base with Vector DB
Enables semantic search and RAG capabilities for classified resources

FEATURES:
- Creates OpenSearch Serverless vector database
- Configures Bedrock Knowledge Base
- Generates embeddings for all resources
- Enables semantic search across content
- Supports RAG (Retrieval Augmented Generation)

USAGE:
    # Create knowledge base infrastructure
    python3 scripts/create_knowledge_base.py --create
    
    # Ingest data into knowledge base
    python3 scripts/create_knowledge_base.py --ingest
    
    # Test semantic search
    python3 scripts/create_knowledge_base.py --test "memory problems after encephalitis"
"""

import boto3
import json
import time
from typing import Dict, List, Any, Optional
from datetime import datetime
from pathlib import Path
import hashlib


class BedrockKnowledgeBaseManager:
    """
    Manages AWS Bedrock Knowledge Base with OpenSearch Serverless vector store
    """
    
    def __init__(self, region_name: str = 'us-west-2'):
        """
        Initialize Bedrock Knowledge Base manager
        
        Args:
            region_name: AWS region (default: us-west-2)
        """
        self.region = region_name
        self.bedrock_agent = boto3.client('bedrock-agent', region_name=region_name)
        self.bedrock_agent_runtime = boto3.client('bedrock-agent-runtime', region_name=region_name)
        self.s3 = boto3.client('s3', region_name=region_name)
        self.iam = boto3.client('iam', region_name=region_name)
        self.aoss = boto3.client('opensearchserverless', region_name=region_name)
        
        # Configuration
        self.kb_name = 'EncephalitisResourcesKB'
        self.kb_description = 'Knowledge base for Encephalitis International classified resources with semantic search'
        self.collection_name = 'encephalitis-resources'
        self.bucket_name = f'encephalitis-kb-{self.region}'
        self.embedding_model = 'amazon.titan-embed-text-v2:0'
        
        print(f"✅ Initialized Bedrock Knowledge Base Manager")
        print(f"   Region: {region_name}")
        print(f"   Embedding Model: {self.embedding_model}")
        print(f"   Collection: {self.collection_name}")
        print()
    
    def create_s3_bucket(self) -> str:
        """Create S3 bucket for knowledge base data source"""
        try:
            print(f"📦 Creating S3 bucket: {self.bucket_name}")
            
            if self.region == 'us-east-1':
                self.s3.create_bucket(Bucket=self.bucket_name)
            else:
                self.s3.create_bucket(
                    Bucket=self.bucket_name,
                    CreateBucketConfiguration={'LocationConstraint': self.region}
                )
            
            # Enable versioning
            self.s3.put_bucket_versioning(
                Bucket=self.bucket_name,
                VersioningConfiguration={'Status': 'Enabled'}
            )
            
            print(f"✅ S3 bucket created: {self.bucket_name}")
            return self.bucket_name
            
        except self.s3.exceptions.BucketAlreadyOwnedByYou:
            print(f"✅ S3 bucket already exists: {self.bucket_name}")
            return self.bucket_name
        except Exception as e:
            print(f"❌ Error creating S3 bucket: {e}")
            raise
    
    def create_opensearch_collection(self) -> Dict[str, Any]:
        """Create OpenSearch Serverless collection for vector storage"""
        try:
            print(f"🔍 Creating OpenSearch Serverless collection: {self.collection_name}")
            
            # Create encryption policy
            encryption_policy = {
                "Rules": [
                    {
                        "ResourceType": "collection",
                        "Resource": [f"collection/{self.collection_name}"]
                    }
                ],
                "AWSOwnedKey": True
            }
            
            try:
                self.aoss.create_security_policy(
                    name=f"{self.collection_name}-encryption",
                    type='encryption',
                    policy=json.dumps(encryption_policy)
                )
                print("   ✓ Created encryption policy")
            except self.aoss.exceptions.ConflictException:
                print("   ✓ Encryption policy already exists")
            
            # Create network policy (public access for demo)
            network_policy = [
                {
                    "Rules": [
                        {
                            "ResourceType": "collection",
                            "Resource": [f"collection/{self.collection_name}"]
                        },
                        {
                            "ResourceType": "dashboard",
                            "Resource": [f"collection/{self.collection_name}"]
                        }
                    ],
                    "AllowFromPublic": True
                }
            ]
            
            try:
                self.aoss.create_security_policy(
                    name=f"{self.collection_name}-network",
                    type='network',
                    policy=json.dumps(network_policy)
                )
                print("   ✓ Created network policy")
            except self.aoss.exceptions.ConflictException:
                print("   ✓ Network policy already exists")
            
            # Create collection
            try:
                response = self.aoss.create_collection(
                    name=self.collection_name,
                    type='VECTORSEARCH',
                    description='Vector database for Encephalitis International resources'
                )
                
                collection_id = response['createCollectionDetail']['id']
                print(f"   ✓ Collection created: {collection_id}")
                
                # Wait for collection to be active
                print("   ⏳ Waiting for collection to be active...")
                while True:
                    status = self.aoss.batch_get_collection(
                        names=[self.collection_name]
                    )
                    if status['collectionDetails'][0]['status'] == 'ACTIVE':
                        break
                    time.sleep(10)
                
                print("   ✅ Collection is active")
                return status['collectionDetails'][0]
                
            except self.aoss.exceptions.ConflictException:
                print("   ✓ Collection already exists")
                status = self.aoss.batch_get_collection(names=[self.collection_name])
                return status['collectionDetails'][0]
                
        except Exception as e:
            print(f"❌ Error creating OpenSearch collection: {e}")
            raise
    
    def create_iam_role(self) -> str:
        """Create IAM role for Bedrock Knowledge Base"""
        role_name = f"{self.kb_name}-Role"
        
        try:
            print(f"🔐 Creating IAM role: {role_name}")
            
            # Trust policy for Bedrock
            trust_policy = {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "bedrock.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            }
            
            # Create role
            try:
                response = self.iam.create_role(
                    RoleName=role_name,
                    AssumeRolePolicyDocument=json.dumps(trust_policy),
                    Description='Role for Bedrock Knowledge Base to access S3 and OpenSearch'
                )
                role_arn = response['Role']['Arn']
                print(f"   ✓ Role created: {role_arn}")
            except self.iam.exceptions.EntityAlreadyExistsException:
                response = self.iam.get_role(RoleName=role_name)
                role_arn = response['Role']['Arn']
                print(f"   ✓ Role already exists: {role_arn}")
            
            # Attach policies
            policies = [
                {
                    "name": "S3Access",
                    "policy": {
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "s3:GetObject",
                                    "s3:ListBucket"
                                ],
                                "Resource": [
                                    f"arn:aws:s3:::{self.bucket_name}",
                                    f"arn:aws:s3:::{self.bucket_name}/*"
                                ]
                            }
                        ]
                    }
                },
                {
                    "name": "OpenSearchAccess",
                    "policy": {
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "aoss:APIAccessAll"
                                ],
                                "Resource": f"arn:aws:aoss:{self.region}:*:collection/*"
                            }
                        ]
                    }
                },
                {
                    "name": "BedrockAccess",
                    "policy": {
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "bedrock:InvokeModel"
                                ],
                                "Resource": f"arn:aws:bedrock:{self.region}::foundation-model/{self.embedding_model}"
                            }
                        ]
                    }
                }
            ]
            
            for policy_config in policies:
                policy_name = f"{role_name}-{policy_config['name']}"
                try:
                    self.iam.put_role_policy(
                        RoleName=role_name,
                        PolicyName=policy_name,
                        PolicyDocument=json.dumps(policy_config['policy'])
                    )
                    print(f"   ✓ Attached policy: {policy_name}")
                except Exception as e:
                    print(f"   ⚠️  Policy attachment warning: {e}")
            
            # Wait for role to propagate
            print("   ⏳ Waiting for IAM role to propagate...")
            time.sleep(10)
            
            return role_arn
            
        except Exception as e:
            print(f"❌ Error creating IAM role: {e}")
            raise
    
    def create_knowledge_base(self, role_arn: str, collection_arn: str) -> Dict[str, Any]:
        """Create Bedrock Knowledge Base"""
        try:
            print(f"🧠 Creating Bedrock Knowledge Base: {self.kb_name}")
            
            # Knowledge base configuration
            kb_config = {
                'type': 'VECTOR',
                'vectorKnowledgeBaseConfiguration': {
                    'embeddingModelArn': f'arn:aws:bedrock:{self.region}::foundation-model/{self.embedding_model}'
                }
            }
            
            # Storage configuration (OpenSearch Serverless)
            storage_config = {
                'type': 'OPENSEARCH_SERVERLESS',
                'opensearchServerlessConfiguration': {
                    'collectionArn': collection_arn,
                    'vectorIndexName': 'encephalitis-resources-index',
                    'fieldMapping': {
                        'vectorField': 'embedding',
                        'textField': 'text',
                        'metadataField': 'metadata'
                    }
                }
            }
            
            try:
                response = self.bedrock_agent.create_knowledge_base(
                    name=self.kb_name,
                    description=self.kb_description,
                    roleArn=role_arn,
                    knowledgeBaseConfiguration=kb_config,
                    storageConfiguration=storage_config
                )
                
                kb_id = response['knowledgeBase']['knowledgeBaseId']
                print(f"✅ Knowledge Base created: {kb_id}")
                return response['knowledgeBase']
                
            except self.bedrock_agent.exceptions.ConflictException:
                print("   ✓ Knowledge Base already exists")
                # List and find existing KB
                kbs = self.bedrock_agent.list_knowledge_bases()
                for kb in kbs['knowledgeBaseSummaries']:
                    if kb['name'] == self.kb_name:
                        kb_details = self.bedrock_agent.get_knowledge_base(
                            knowledgeBaseId=kb['knowledgeBaseId']
                        )
                        return kb_details['knowledgeBase']
                raise Exception("Knowledge Base exists but couldn't retrieve details")
                
        except Exception as e:
            print(f"❌ Error creating Knowledge Base: {e}")
            raise
    
    def create_data_source(self, kb_id: str) -> Dict[str, Any]:
        """Create S3 data source for Knowledge Base"""
        try:
            print(f"📂 Creating data source for Knowledge Base")
            
            data_source_config = {
                'type': 'S3',
                's3Configuration': {
                    'bucketArn': f'arn:aws:s3:::{self.bucket_name}',
                    'inclusionPrefixes': ['knowledge-base/']
                }
            }
            
            try:
                response = self.bedrock_agent.create_data_source(
                    knowledgeBaseId=kb_id,
                    name=f"{self.kb_name}-S3-DataSource",
                    description='S3 data source for classified resources',
                    dataSourceConfiguration=data_source_config
                )
                
                ds_id = response['dataSource']['dataSourceId']
                print(f"✅ Data source created: {ds_id}")
                return response['dataSource']
                
            except self.bedrock_agent.exceptions.ConflictException:
                print("   ✓ Data source already exists")
                # List and find existing data source
                sources = self.bedrock_agent.list_data_sources(knowledgeBaseId=kb_id)
                if sources['dataSourceSummaries']:
                    return sources['dataSourceSummaries'][0]
                raise Exception("Data source exists but couldn't retrieve details")
                
        except Exception as e:
            print(f"❌ Error creating data source: {e}")
            raise
    
    def prepare_documents_for_kb(self, json_file: str = 'output/encephalitis_content_database.json') -> List[str]:
        """
        Prepare documents for Knowledge Base ingestion
        Converts classified resources to text documents with metadata
        
        Args:
            json_file: Path to complete classification results
            
        Returns:
            List of S3 keys for uploaded documents
        """
        print(f"\n📄 Preparing documents for Knowledge Base")
        print(f"   Source: {json_file}")
        
        # Load classified results
        with open(json_file, 'r', encoding='utf-8') as f:
            results = json.load(f)
        
        print(f"   Found {len(results)} resources to process")
        
        uploaded_keys = []
        
        for idx, result in enumerate(results, 1):
            if 'error' in result:
                continue
            
            original = result.get('original', {})
            refined = result.get('refined', {})
            refined_tags = refined.get('refined_tags', {})
            metadata = refined.get('metadata', {})
            recommendations = refined.get('recommendations', {})
            
            # Create rich text document for embedding
            document_text = self._create_document_text(original, refined, refined_tags, metadata, recommendations)
            
            # Create metadata for filtering
            document_metadata = self._create_document_metadata(result, refined_tags, metadata)
            
            # Create document with metadata
            document = {
                'text': document_text,
                'metadata': document_metadata
            }
            
            # Upload to S3
            key = f"knowledge-base/resource_{idx:05d}.json"
            try:
                self.s3.put_object(
                    Bucket=self.bucket_name,
                    Key=key,
                    Body=json.dumps(document, ensure_ascii=False),
                    ContentType='application/json'
                )
                uploaded_keys.append(key)
                
                if idx % 100 == 0:
                    print(f"   Uploaded {idx}/{len(results)} documents...")
                    
            except Exception as e:
                print(f"   ⚠️  Failed to upload document {idx}: {e}")
        
        print(f"✅ Uploaded {len(uploaded_keys)} documents to S3")
        return uploaded_keys
    
    def _create_document_text(self, original: Dict, refined: Dict, tags: Dict, metadata: Dict, recommendations: Dict) -> str:
        """Create rich text representation for embedding"""
        
        # Extract key information
        title = original.get('title', 'Untitled')
        description = original.get('description', original.get('summary', ''))
        url = original.get('url', '')
        content = original.get('content', original.get('full_content', ''))[:2000]
        
        # Build comprehensive text for semantic search
        text_parts = [
            f"Title: {title}",
            f"Description: {description}",
            f"URL: {url}",
            ""
        ]
        
        # Add classification tags in natural language
        if tags.get('personas'):
            personas_text = ', '.join([p.replace('persona:', '') for p in tags['personas']])
            text_parts.append(f"Target Audience: {personas_text}")
        
        if tags.get('stages'):
            stages_text = ', '.join([s.replace('stage:', '').replace('_', ' ') for s in tags['stages']])
            text_parts.append(f"Journey Stage: {stages_text}")
        
        if tags.get('topics'):
            topics_text = ', '.join([t.replace('topic:', '') for t in tags['topics']])
            text_parts.append(f"Topics: {topics_text}")
        
        if tags.get('symptoms'):
            symptoms_text = ', '.join([s.replace('symptom:', '') for s in tags['symptoms']])
            text_parts.append(f"Symptoms Addressed: {symptoms_text}")
        
        if tags.get('types'):
            types_text = ', '.join([t.replace('type:', '') for t in tags['types']])
            text_parts.append(f"Condition Types: {types_text}")
        
        # Add metadata
        if metadata.get('complexity_level'):
            text_parts.append(f"Complexity: {metadata['complexity_level']}")
        
        if metadata.get('emotional_tone'):
            text_parts.append(f"Tone: {metadata['emotional_tone']}")
        
        # Add recommendations
        if recommendations.get('best_used_when'):
            text_parts.append(f"\nBest Used When: {recommendations['best_used_when']}")
        
        if recommendations.get('primary_audience'):
            text_parts.append(f"Primary Audience: {recommendations['primary_audience']}")
        
        # Add content excerpt
        if content:
            text_parts.append(f"\nContent Excerpt: {content}")
        
        return '\n'.join(text_parts)
    
    def _create_document_metadata(self, result: Dict, tags: Dict, metadata: Dict) -> Dict:
        """Create metadata for filtering and retrieval"""
        
        original = result.get('original', {})
        
        return {
            'source_type': result.get('source_type', 'unknown'),
            'url': original.get('url', ''),
            'title': original.get('title', 'Untitled'),
            'personas': ','.join(tags.get('personas', [])),
            'stages': ','.join(tags.get('stages', [])),
            'topics': ','.join(tags.get('topics', [])),
            'symptoms': ','.join(tags.get('symptoms', [])),
            'types': ','.join(tags.get('types', [])),
            'locations': ','.join(tags.get('locations', [])),
            'resource_type': ','.join(tags.get('resource_type', [])),
            'complexity_level': metadata.get('complexity_level', ''),
            'priority_level': metadata.get('priority_level', ''),
            'processed_at': result.get('processed_at', '')
        }
    
    def ingest_data(self, kb_id: str, data_source_id: str) -> str:
        """Start ingestion job for Knowledge Base"""
        try:
            print(f"\n🔄 Starting ingestion job")
            
            response = self.bedrock_agent.start_ingestion_job(
                knowledgeBaseId=kb_id,
                dataSourceId=data_source_id,
                description='Ingest classified Encephalitis resources'
            )
            
            job_id = response['ingestionJob']['ingestionJobId']
            print(f"   Job ID: {job_id}")
            print(f"   Status: {response['ingestionJob']['status']}")
            
            # Monitor ingestion job
            print("\n   ⏳ Monitoring ingestion progress...")
            while True:
                status = self.bedrock_agent.get_ingestion_job(
                    knowledgeBaseId=kb_id,
                    dataSourceId=data_source_id,
                    ingestionJobId=job_id
                )
                
                current_status = status['ingestionJob']['status']
                print(f"   Status: {current_status}")
                
                if current_status in ['COMPLETE', 'FAILED']:
                    break
                
                time.sleep(30)
            
            if current_status == 'COMPLETE':
                stats = status['ingestionJob'].get('statistics', {})
                print(f"\n✅ Ingestion complete!")
                print(f"   Documents processed: {stats.get('numberOfDocumentsScanned', 0)}")
                print(f"   Documents indexed: {stats.get('numberOfDocumentsIndexed', 0)}")
                print(f"   Documents failed: {stats.get('numberOfDocumentsFailed', 0)}")
            else:
                print(f"\n❌ Ingestion failed")
                print(f"   Failure reasons: {status['ingestionJob'].get('failureReasons', [])}")
            
            return job_id
            
        except Exception as e:
            print(f"❌ Error starting ingestion: {e}")
            raise
    
    def query_knowledge_base(self, kb_id: str, query: str, max_results: int = 5) -> List[Dict]:
        """
        Query Knowledge Base with semantic search
        
        Args:
            kb_id: Knowledge Base ID
            query: Natural language query
            max_results: Maximum number of results
            
        Returns:
            List of relevant documents with scores
        """
        try:
            print(f"\n🔍 Querying Knowledge Base")
            print(f"   Query: {query}")
            
            response = self.bedrock_agent_runtime.retrieve(
                knowledgeBaseId=kb_id,
                retrievalQuery={'text': query},
                retrievalConfiguration={
                    'vectorSearchConfiguration': {
                        'numberOfResults': max_results
                    }
                }
            )
            
            results = response['retrievalResults']
            
            print(f"\n✅ Found {len(results)} results")
            print("\n" + "="*80)
            
            for idx, result in enumerate(results, 1):
                score = result.get('score', 0)
                content = result.get('content', {}).get('text', '')
                metadata = result.get('metadata', {})
                
                print(f"\nResult {idx} (Score: {score:.3f})")
                print(f"Title: {metadata.get('title', 'N/A')}")
                print(f"URL: {metadata.get('url', 'N/A')}")
                print(f"Personas: {metadata.get('personas', 'N/A')}")
                print(f"Topics: {metadata.get('topics', 'N/A')}")
                print(f"Content: {content[:200]}...")
                print("-"*80)
            
            return results
            
        except Exception as e:
            print(f"❌ Error querying Knowledge Base: {e}")
            raise
    
    def setup_complete_infrastructure(self) -> Dict[str, str]:
        """
        Complete setup: Create all infrastructure components
        
        Returns:
            Dict with all resource IDs
        """
        print("\n" + "="*80)
        print("BEDROCK KNOWLEDGE BASE SETUP")
        print("="*80)
        print()
        
        # Step 1: Create S3 bucket
        bucket_name = self.create_s3_bucket()
        
        # Step 2: Create OpenSearch collection
        collection = self.create_opensearch_collection()
        collection_arn = collection['arn']
        
        # Step 3: Create IAM role
        role_arn = self.create_iam_role()
        
        # Step 4: Create Knowledge Base
        kb = self.create_knowledge_base(role_arn, collection_arn)
        kb_id = kb['knowledgeBaseId']
        
        # Step 5: Create data source
        data_source = self.create_data_source(kb_id)
        ds_id = data_source['dataSourceId']
        
        print("\n" + "="*80)
        print("SETUP COMPLETE")
        print("="*80)
        print(f"\n✅ Knowledge Base ID: {kb_id}")
        print(f"✅ Data Source ID: {ds_id}")
        print(f"✅ S3 Bucket: {bucket_name}")
        print(f"✅ OpenSearch Collection: {self.collection_name}")
        print(f"✅ IAM Role: {role_arn}")
        
        # Save configuration
        config = {
            'knowledge_base_id': kb_id,
            'data_source_id': ds_id,
            'bucket_name': bucket_name,
            'collection_name': self.collection_name,
            'collection_arn': collection_arn,
            'role_arn': role_arn,
            'region': self.region,
            'created_at': datetime.now().isoformat()
        }
        
        config_file = 'knowledge_base_config.json'
        with open(config_file, 'w') as f:
            json.dump(config, f, indent=2)
        
        print(f"\n💾 Configuration saved to: {config_file}")
        
        return config


def load_config() -> Dict[str, str]:
    """Load Knowledge Base configuration"""
    config_file = 'knowledge_base_config.json'
    if Path(config_file).exists():
        with open(config_file, 'r') as f:
            return json.load(f)
    return {}


if __name__ == "__main__":
    import sys
    
    manager = BedrockKnowledgeBaseManager(region_name='us-west-2')
    
    if '--create' in sys.argv:
        # Create infrastructure
        config = manager.setup_complete_infrastructure()
        
        print("\n" + "="*80)
        print("NEXT STEPS")
        print("="*80)
        print("\n1. Prepare and upload documents:")
        print("   python3 scripts/create_knowledge_base.py --ingest")
        print("\n2. Test semantic search:")
        print("   python3 scripts/create_knowledge_base.py --test \"memory problems\"")
        print()
        
    elif '--ingest' in sys.argv:
        # Ingest data
        config = load_config()
        if not config:
            print("❌ No configuration found. Run with --create first.")
            sys.exit(1)
        
        # Prepare documents
        manager.prepare_documents_for_kb()
        
        # Start ingestion
        manager.ingest_data(
            kb_id=config['knowledge_base_id'],
            data_source_id=config['data_source_id']
        )
        
    elif '--test' in sys.argv:
        # Test query
        config = load_config()
        if not config:
            print("❌ No configuration found. Run with --create first.")
            sys.exit(1)
        
        # Get query from command line or use default
        query = ' '.join(sys.argv[sys.argv.index('--test')+1:]) if len(sys.argv) > sys.argv.index('--test')+1 else "memory problems after encephalitis"
        
        results = manager.query_knowledge_base(
            kb_id=config['knowledge_base_id'],
            query=query,
            max_results=5
        )
        
    else:
        print("\nUSAGE:")
        print("  python3 scripts/create_knowledge_base.py --create")
        print("  python3 scripts/create_knowledge_base.py --ingest")
        print("  python3 scripts/create_knowledge_base.py --test \"your query here\"")
        print()
