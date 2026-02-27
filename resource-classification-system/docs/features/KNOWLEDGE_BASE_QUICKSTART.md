# Knowledge Base Quick Start

**Get semantic search running in 15 minutes**

---

## What You'll Get

✅ Semantic search across 4,000+ classified resources  
✅ Natural language queries (e.g., "help with memory problems")  
✅ RAG-powered answers with source citations  
✅ Metadata filtering (persona, stage, topic)  

---

## Prerequisites

- ✅ Classified resources processed (`./run_resilient.sh process_all_resources.py`)
- ✅ AWS credentials configured
- ✅ Python 3.9+ with boto3

---

## 3-Step Setup

### Step 1: Create Infrastructure (5 minutes)

```bash
python3 scripts/create_knowledge_base.py --create
```

**Creates**:
- S3 bucket for data
- OpenSearch Serverless collection
- IAM roles and permissions
- Bedrock Knowledge Base
- Data source configuration

**Output**: `knowledge_base_config.json` with all IDs

---

### Step 2: Ingest Data (30-60 minutes)

```bash
python3 scripts/create_knowledge_base.py --ingest
```

**Does**:
- Prepares 4,000+ documents
- Uploads to S3
- Generates vector embeddings
- Indexes in OpenSearch

**Progress**: Shows real-time status

---

### Step 3: Test Search (1 minute)

```bash
# Semantic search
python3 scripts/query_knowledge_base.py "memory problems after encephalitis"

# RAG query (with AI-generated answer)
python3 scripts/query_knowledge_base.py "What helps with memory problems?" --rag

# Filtered search
python3 scripts/query_knowledge_base.py "treatment options" --persona patient --stage early_recovery
```

---

## Example Queries

### For Patients

```bash
# General support
python3 scripts/query_knowledge_base.py "newly diagnosed what to expect"

# Specific symptoms
python3 scripts/query_knowledge_base.py "dealing with fatigue"

# Recovery
python3 scripts/query_knowledge_base.py "returning to normal life"
```

### For Caregivers

```bash
# Support resources
python3 scripts/query_knowledge_base.py "support for caregivers" --persona caregiver

# Practical help
python3 scripts/query_knowledge_base.py "how to help someone with memory problems"

# Emotional support
python3 scripts/query_knowledge_base.py "coping with caregiver stress"
```

### For Professionals

```bash
# Clinical information
python3 scripts/query_knowledge_base.py "treatment protocols" --persona professional

# Research
python3 scripts/query_knowledge_base.py "latest research findings" --topic research

# Patient management
python3 scripts/query_knowledge_base.py "managing long-term effects"
```

---

## RAG Examples

**RAG = Retrieval Augmented Generation** (AI answers with sources)

```bash
# Get AI-generated answer with citations
python3 scripts/query_knowledge_base.py "What are the main symptoms of encephalitis?" --rag

# Complex questions
python3 scripts/query_knowledge_base.py "How long does recovery typically take?" --rag

# Practical advice
python3 scripts/query_knowledge_base.py "What should I do if I suspect encephalitis?" --rag
```

**Output includes**:
- AI-generated answer
- Source documents with URLs
- Citations and references

---

## Integration Example

```python
import boto3
import json

# Load config
with open('knowledge_base_config.json') as f:
    config = json.load(f)

# Initialize client
client = boto3.client('bedrock-agent-runtime', region_name='us-west-2')

# Semantic search
response = client.retrieve(
    knowledgeBaseId=config['knowledge_base_id'],
    retrievalQuery={'text': 'memory problems'},
    retrievalConfiguration={
        'vectorSearchConfiguration': {
            'numberOfResults': 5
        }
    }
)

# Process results
for result in response['retrievalResults']:
    print(f"Score: {result['score']:.3f}")
    print(f"Title: {result['metadata']['title']}")
    print(f"URL: {result['metadata']['url']}")
    print()
```

---

## Cost Estimate

**Setup**: ~£0.79-1.58 (one-time)  
**Monthly** (development): ~£8-16  
**Monthly** (production 24/7): ~£277-316  
**Per Query**: ~£0.002 (RAG) or ~£0.00008 (search only)  

**Optimization**: Scale down OCUs when not in use to reduce costs

---

## Troubleshooting

### "No configuration found"
```bash
# Run create first
python3 scripts/create_knowledge_base.py --create
```

### "No results returned"
```bash
# Check ingestion completed
python3 scripts/create_knowledge_base.py --ingest

# Try broader query
python3 scripts/query_knowledge_base.py "encephalitis"
```

### "Permission denied"
```bash
# Check AWS credentials
aws sts get-caller-identity

# Verify IAM permissions for Bedrock, OpenSearch, S3
```

---

## Next Steps

1. **Integrate with Web App**: Use API for user-facing search
2. **Add Caching**: Cache common queries for faster response
3. **Monitor Usage**: Track costs and optimize
4. **Feedback Loop**: Collect user feedback to improve relevance

---

## Full Documentation

See `KNOWLEDGE_BASE_INTEGRATION.md` for:
- Complete architecture details
- Advanced configuration
- API reference
- Best practices
- Cost optimization

---

**Ready to start? Run the first command:**

```bash
python3 scripts/create_knowledge_base.py --create
```

---

**Last Updated**: January 14, 2026  
**Version**: 1.0
