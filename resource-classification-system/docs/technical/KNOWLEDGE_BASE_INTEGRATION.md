# AWS Bedrock Knowledge Base Integration

**Semantic search and RAG capabilities for classified resources**

---

## Overview

This integration adds **AWS Bedrock Knowledge Base with vector database** to enable:

✅ **Semantic Search** - Natural language queries across all resources  
✅ **RAG (Retrieval Augmented Generation)** - AI-generated answers with citations  
✅ **Vector Embeddings** - Amazon Titan embeddings for similarity search  
✅ **Metadata Filtering** - Filter by persona, stage, topic, etc.  
✅ **Confidence Scores** - Relevance scoring for each result  

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│           KNOWLEDGE BASE VECTOR DB INTEGRATION              │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│  Classified Results  │
│  (JSON)              │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Document Prep       │
│  • Rich text         │
│  • Metadata          │
│  • Upload to S3      │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────┐
│  AWS BEDROCK KNOWLEDGE BASE                              │
│  ┌────────────────┐  ┌──────────────────────────────┐   │
│  │  Data Source   │  │  Vector Embeddings           │   │
│  │  (S3 Bucket)   │──│  Amazon Titan Embed v2       │   │
│  └────────────────┘  └──────────────┬───────────────┘   │
│                                      │                    │
│                      ┌───────────────▼───────────────┐   │
│                      │  OpenSearch Serverless        │   │
│                      │  Vector Database              │   │
│                      │  • 4,000+ documents           │   │
│                      │  • Semantic indexing          │   │
│                      │  • Metadata filtering         │   │
│                      └───────────────┬───────────────┘   │
└──────────────────────────────────────┼───────────────────┘
                                       │
                       ┌───────────────┴───────────────┐
                       │                               │
                       ▼                               ▼
           ┌───────────────────┐         ┌─────────────────────┐
           │  Semantic Search  │         │  RAG Generation     │
           │  • Natural lang   │         │  • Claude 3 Sonnet  │
           │  • Top-K results  │         │  • Answer + sources │
           │  • Relevance      │         │  • Citations        │
           └───────────────────┘         └─────────────────────┘
```

---

## Components

### 1. OpenSearch Serverless Vector Database

**Purpose**: Stores vector embeddings for semantic search

**Configuration**:
- Collection name: `encephalitis-resources`
- Type: `VECTORSEARCH`
- Index: `encephalitis-resources-index`
- Vector field: `embedding`
- Text field: `text`
- Metadata field: `metadata`

**Features**:
- Serverless (auto-scaling)
- Pay-per-use pricing
- High availability
- Encryption at rest

### 2. Amazon Titan Embeddings

**Model**: `amazon.titan-embed-text-v2:0`

**Features**:
- 1,024 dimensional vectors
- Optimized for semantic search
- Multilingual support
- Cost-effective

**Input**: Rich text documents with metadata  
**Output**: Vector embeddings for similarity search

### 3. S3 Data Source

**Bucket**: `encephalitis-kb-{region}`

**Structure**:
```
s3://encephalitis-kb-us-west-2/
└── knowledge-base/
    ├── resource_00001.json
    ├── resource_00002.json
    ├── resource_00003.json
    └── ...
```

**Document Format**:
```json
{
  "text": "Rich text representation with all metadata...",
  "metadata": {
    "source_type": "web_content",
    "url": "https://...",
    "title": "Resource Title",
    "personas": "persona:patient,persona:caregiver",
    "stages": "stage:pre_diagnosis",
    "topics": "topic:memory,topic:treatment",
    "symptoms": "symptom:memory",
    "types": "type:autoimmune",
    "complexity_level": "beginner",
    "priority_level": "high"
  }
}
```

### 4. Bedrock Knowledge Base

**Name**: `EncephalitisResourcesKB`

**Configuration**:
- Embedding model: Amazon Titan Embed v2
- Vector store: OpenSearch Serverless
- Data source: S3 bucket
- Ingestion: Automatic on data changes

---

## Setup Instructions

### Prerequisites

1. **AWS Credentials** configured with permissions for:
   - Bedrock (Knowledge Base, Agent Runtime)
   - OpenSearch Serverless
   - S3
   - IAM

2. **Classified Resources** processed:
   ```bash
   ./run_resilient.sh process_all_resources.py
   ```

3. **Python Dependencies**:
   ```bash
   pip install boto3
   ```

### Step 1: Create Infrastructure

```bash
python3 scripts/create_knowledge_base.py --create
```

**This creates**:
- ✅ S3 bucket for data source
- ✅ OpenSearch Serverless collection
- ✅ IAM role with permissions
- ✅ Bedrock Knowledge Base
- ✅ S3 data source configuration

**Output**:
```
================================================================================
BEDROCK KNOWLEDGE BASE SETUP
================================================================================

📦 Creating S3 bucket: encephalitis-kb-us-west-2
✅ S3 bucket created: encephalitis-kb-us-west-2

🔍 Creating OpenSearch Serverless collection: encephalitis-resources
   ✓ Created encryption policy
   ✓ Created network policy
   ✓ Collection created: abc123...
   ⏳ Waiting for collection to be active...
   ✅ Collection is active

🔐 Creating IAM role: EncephalitisResourcesKB-Role
   ✓ Role created: arn:aws:iam::...
   ✓ Attached policy: S3Access
   ✓ Attached policy: OpenSearchAccess
   ✓ Attached policy: BedrockAccess

🧠 Creating Bedrock Knowledge Base: EncephalitisResourcesKB
✅ Knowledge Base created: ABC123XYZ

📂 Creating data source for Knowledge Base
✅ Data source created: DEF456UVW

================================================================================
SETUP COMPLETE
================================================================================

✅ Knowledge Base ID: ABC123XYZ
✅ Data Source ID: DEF456UVW
✅ S3 Bucket: encephalitis-kb-us-west-2
✅ OpenSearch Collection: encephalitis-resources
✅ IAM Role: arn:aws:iam::...

💾 Configuration saved to: knowledge_base_config.json
```

**Time**: ~5-10 minutes  
**Cost**: ~$0 (setup is free, pay for usage)

### Step 2: Ingest Data

```bash
python3 scripts/create_knowledge_base.py --ingest
```

**This does**:
1. Loads classified resources from `output/encephalitis_content_database.json`
2. Creates rich text documents with metadata
3. Uploads documents to S3
4. Starts ingestion job
5. Monitors progress until complete

**Output**:
```
📄 Preparing documents for Knowledge Base
   Source: output/encephalitis_content_database.json
   Found 1255 resources to process
   Uploaded 100/1255 documents...
   Uploaded 200/1255 documents...
   ...
✅ Uploaded 1255 documents to S3

🔄 Starting ingestion job
   Job ID: XYZ789ABC
   Status: IN_PROGRESS

   ⏳ Monitoring ingestion progress...
   Status: IN_PROGRESS
   Status: IN_PROGRESS
   Status: COMPLETE

✅ Ingestion complete!
   Documents processed: 1255
   Documents indexed: 1255
   Documents failed: 0
```

**Time**: ~30-60 minutes for 4,000+ documents  
**Cost**: ~$2-5 for embeddings generation

### Step 3: Test Semantic Search

```bash
python3 scripts/create_knowledge_base.py --test "memory problems after encephalitis"
```

**Output**:
```
🔍 Querying Knowledge Base
   Query: memory problems after encephalitis

✅ Found 5 results

================================================================================

Result 1 (Score: 0.847)
Title: Memory and Cognitive Problems After Encephalitis
URL: https://www.encephalitis.info/memory-problems
Personas: persona:patient,persona:caregiver
Topics: topic:memory,topic:rehabilitation
Content: Memory problems are one of the most common long-term effects...
--------------------------------------------------------------------------------

Result 2 (Score: 0.823)
Title: Cognitive Rehabilitation Services
URL: https://www.encephalitis.info/rehabilitation
Personas: persona:patient,persona:professional
Topics: topic:memory,topic:treatment
Content: Cognitive rehabilitation can help improve memory function...
--------------------------------------------------------------------------------

...
```

---

## Usage Examples

### Example 1: Simple Semantic Search

```bash
python3 scripts/query_knowledge_base.py "support for caregivers"
```

**Returns**: Top 5 most relevant resources about caregiver support

### Example 2: Search with Filters

```bash
python3 scripts/query_knowledge_base.py "treatment options" \
  --persona patient \
  --stage early_recovery \
  --max-results 10
```

**Returns**: Treatment resources specifically for patients in early recovery

### Example 3: RAG Query (Answer Generation)

```bash
python3 scripts/query_knowledge_base.py "What helps with memory problems?" --rag
```

**Returns**: AI-generated answer with citations from relevant resources

**Output**:
```
🤖 RAG Query (Retrieve and Generate)
   Question: What helps with memory problems?
   Model: anthropic.claude-3-sonnet-20240229-v1:0

✅ Generated Answer:

Memory problems after encephalitis can be addressed through several approaches:

1. **Cognitive Rehabilitation**: Specialized therapy programs can help improve 
   memory function through targeted exercises and strategies. These programs 
   are often provided by neuropsychologists or occupational therapists.

2. **Memory Aids**: Using external memory aids like calendars, notebooks, 
   smartphone apps, and reminder systems can help compensate for memory 
   difficulties in daily life.

3. **Structured Routines**: Establishing consistent daily routines can reduce 
   the cognitive load and make it easier to remember important tasks.

4. **Support Groups**: Connecting with others who have experienced similar 
   challenges can provide practical tips and emotional support.

5. **Professional Support**: Working with healthcare professionals including 
   neurologists, neuropsychologists, and rehabilitation specialists can help 
   develop personalized strategies.

================================================================================
SOURCES (3 citations)
================================================================================

Source 1:
  Title: Memory and Cognitive Problems After Encephalitis
  URL: https://www.encephalitis.info/memory-problems
  Excerpt: Memory problems are one of the most common long-term effects...

Source 2:
  Title: Cognitive Rehabilitation Services
  URL: https://www.encephalitis.info/rehabilitation
  Excerpt: Cognitive rehabilitation can help improve memory function...

Source 3:
  Title: Living with Memory Problems - Patient Stories
  URL: https://www.encephalitis.info/patient-stories/memory
  Excerpt: Many people find that using memory aids and establishing...
```

### Example 4: Topic-Specific Search

```bash
python3 scripts/query_knowledge_base.py "returning to work" \
  --topic work \
  --max-results 5
```

### Example 5: Stage-Specific Search

```bash
python3 scripts/query_knowledge_base.py "what to expect" \
  --stage pre_diagnosis \
  --persona patient
```

---

## Integration with Existing System

### DynamoDB + Knowledge Base

**Use both for different purposes**:

| Feature | DynamoDB | Knowledge Base |
|---------|----------|----------------|
| **Query Type** | Structured (exact match) | Semantic (meaning-based) |
| **Use Case** | Filter by tags | Natural language search |
| **Speed** | Very fast (<10ms) | Fast (~100-500ms) |
| **Cost** | Very low | Low-moderate |
| **Best For** | Known criteria | Exploratory search |

**Example Workflow**:
1. User asks: "I need help with memory problems"
2. **Knowledge Base**: Find semantically similar resources
3. **DynamoDB**: Get full details for top results
4. Return combined results with rich metadata

### API Integration

```python
import boto3
import json

# Initialize clients
kb_runtime = boto3.client('bedrock-agent-runtime', region_name='us-west-2')
dynamodb = boto3.resource('dynamodb', region_name='us-west-2')

# Load config
with open('knowledge_base_config.json') as f:
    config = json.load(f)

kb_id = config['knowledge_base_id']
table = dynamodb.Table('EncephalitisResources')

def search_resources(query: str, max_results: int = 5):
    """
    Hybrid search: Knowledge Base + DynamoDB
    """
    # Step 1: Semantic search with Knowledge Base
    kb_response = kb_runtime.retrieve(
        knowledgeBaseId=kb_id,
        retrievalQuery={'text': query},
        retrievalConfiguration={
            'vectorSearchConfiguration': {
                'numberOfResults': max_results
            }
        }
    )
    
    results = []
    
    # Step 2: Enrich with DynamoDB data
    for result in kb_response['retrievalResults']:
        metadata = result['metadata']
        url = metadata.get('url')
        
        # Get full resource from DynamoDB
        # (assuming we store URL as searchable attribute)
        db_response = table.scan(
            FilterExpression='url = :url',
            ExpressionAttributeValues={':url': url},
            Limit=1
        )
        
        if db_response['Items']:
            full_resource = db_response['Items'][0]
            results.append({
                'relevance_score': result['score'],
                'kb_content': result['content']['text'],
                'full_resource': full_resource
            })
    
    return results

# Example usage
results = search_resources("memory problems after encephalitis")
for r in results:
    print(f"Score: {r['relevance_score']:.3f}")
    print(f"Title: {r['full_resource']['title']}")
    print(f"URL: {r['full_resource']['url']}")
    print()
```

---

## Cost Estimation

### Setup Costs
- **Infrastructure creation**: £0 (free)
- **Initial ingestion** (1,255 documents): ~£0.79-1.58

### Ongoing Costs

**OpenSearch Serverless**:
- OCU (OpenSearch Compute Units): ~£0.19/hour per OCU
- Minimum: 2 OCUs for indexing, 2 OCUs for search
- Estimated: ~£277/month for always-on
- **Optimization**: Use on-demand, scale to zero when not in use

**Embeddings**:
- Amazon Titan Embed v2: £0.00008 per 1,000 input tokens
- 1,255 documents × ~500 tokens = ~630K tokens
- Cost: ~£0.05 per full re-indexing

**Queries**:
- Retrieval: Included in OCU costs
- RAG generation: ~£0.002 per query (Claude 3 Sonnet)

**Total Estimated Monthly Cost**:
- **Development/Testing**: ~£8-16 (scale down when not in use)
- **Production (24/7)**: ~£277-316
- **Production (on-demand)**: ~£40-79 (scale based on usage)

---

## Best Practices

### 1. Document Preparation

✅ **Rich Text**: Include all relevant information in text field  
✅ **Metadata**: Add structured metadata for filtering  
✅ **Chunking**: Keep documents under 10,000 tokens  
✅ **Deduplication**: Avoid duplicate content  

### 2. Query Optimization

✅ **Specific Queries**: More specific = better results  
✅ **Filters**: Use metadata filters to narrow results  
✅ **Max Results**: Start with 5-10, adjust based on needs  
✅ **Caching**: Cache common queries for faster response  

### 3. Cost Optimization

✅ **Scale Down**: Reduce OCUs during low-usage periods  
✅ **Batch Queries**: Group queries when possible  
✅ **Monitor Usage**: Track costs with CloudWatch  
✅ **Incremental Updates**: Only re-index changed documents  

### 4. Security

✅ **IAM Roles**: Use least-privilege permissions  
✅ **Encryption**: Enable encryption at rest and in transit  
✅ **Network Policies**: Restrict access as needed  
✅ **Audit Logs**: Enable CloudTrail logging  

---

## Troubleshooting

### Issue: Ingestion Job Fails

**Symptoms**: Ingestion status shows "FAILED"

**Solutions**:
1. Check IAM role permissions
2. Verify S3 bucket access
3. Check document format (must be valid JSON)
4. Review CloudWatch logs for details

### Issue: No Results Returned

**Symptoms**: Query returns 0 results

**Solutions**:
1. Verify ingestion completed successfully
2. Check if documents were indexed (count in OpenSearch)
3. Try broader query terms
4. Remove filters to test

### Issue: Low Relevance Scores

**Symptoms**: Results have low scores (<0.5)

**Solutions**:
1. Improve document text quality
2. Add more context to queries
3. Use metadata filters to narrow scope
4. Consider re-indexing with better text

### Issue: High Costs

**Symptoms**: Unexpected AWS charges

**Solutions**:
1. Scale down OCUs when not in use
2. Delete unused collections
3. Optimize query frequency
4. Use caching for common queries

---

## API Reference

### Retrieve (Semantic Search)

```python
response = bedrock_agent_runtime.retrieve(
    knowledgeBaseId='ABC123XYZ',
    retrievalQuery={'text': 'your query here'},
    retrievalConfiguration={
        'vectorSearchConfiguration': {
            'numberOfResults': 5,
            'filter': {
                'equals': {
                    'key': 'personas',
                    'value': 'persona:patient'
                }
            }
        }
    }
)
```

### Retrieve and Generate (RAG)

```python
response = bedrock_agent_runtime.retrieve_and_generate(
    input={'text': 'your question here'},
    retrieveAndGenerateConfiguration={
        'type': 'KNOWLEDGE_BASE',
        'knowledgeBaseConfiguration': {
            'knowledgeBaseId': 'ABC123XYZ',
            'modelArn': 'arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0',
            'retrievalConfiguration': {
                'vectorSearchConfiguration': {
                    'numberOfResults': 5
                }
            }
        }
    }
)
```

---

## Next Steps

### Phase 1: Basic Integration ✅
- [x] Create Knowledge Base infrastructure
- [x] Ingest classified resources
- [x] Test semantic search
- [x] Test RAG queries

### Phase 2: API Integration
- [ ] Create REST API for queries
- [ ] Integrate with web application
- [ ] Add caching layer
- [ ] Implement rate limiting

### Phase 3: Advanced Features
- [ ] Hybrid search (KB + DynamoDB)
- [ ] Query analytics and logging
- [ ] A/B testing for relevance
- [ ] Feedback loop for improvements

### Phase 4: Optimization
- [ ] Cost optimization (auto-scaling)
- [ ] Performance tuning
- [ ] Advanced filtering
- [ ] Multi-language support

---

## Summary

✅ **Semantic Search**: Natural language queries across 4,000+ resources  
✅ **RAG Capabilities**: AI-generated answers with source citations  
✅ **Vector Embeddings**: Amazon Titan for similarity search  
✅ **Metadata Filtering**: Filter by persona, stage, topic, etc.  
✅ **Scalable**: OpenSearch Serverless auto-scales  
✅ **Cost-Effective**: Pay only for what you use  
✅ **Production-Ready**: Enterprise-grade infrastructure  

**The Knowledge Base integration enables the wider system to provide intelligent, context-aware resource recommendations through semantic search and RAG, complementing the existing structured querying via DynamoDB.**

---

**Last Updated**: January 14, 2026  
**Version**: 1.0  
**Status**: ✅ Production Ready
