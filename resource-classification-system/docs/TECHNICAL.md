# Technical Documentation

Complete technical reference for the Resource Classification System.

---

## System Architecture

### Overview

```
┌─────────────────────────────────────────────────────────────┐
│                  RESOURCE CLASSIFICATION SYSTEM              │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────┐         ┌──────────────────────────┐
│  BATCH PROCESSING    │         │  REAL-TIME WEB SCRAPER   │
│  (Python Pipeline)   │         │  (AWS Lambda + Gateway)  │
└──────────┬───────────┘         └──────────┬───────────────┘
           │                                │
           └────────────┬───────────────────┘
                        │
                        ▼
       ┌────────────────────────────────────┐
       │  AWS BEDROCK (Claude Opus 4.5)     │
       └────────────────┬───────────────────┘
                        │
       ┌────────────────┴───────────────────┐
       │                                    │
       ▼                                    ▼
┌──────────────────┐         ┌──────────────────────┐
│   DYNAMODB       │         │   S3 STORAGE         │
└──────────────────┘         └──────────────────────┘
```

---

## Component Details

### 1. Batch Processing Pipeline

**Language**: Python 3.9+  
**Entry Point**: `process_all_resources.py`

**Core Modules**:
- `scripts/bedrock_tag_refinement_prompt.py` - AI prompts
- `scripts/excel_processor.py` - Excel data extraction
- `scripts/upload_to_dynamodb.py` - Database upload

**Data Sources**:
- Web content from sitemap (425 items)
- Live chat crib sheet Excel (697 items)
- Professional contacts Excel (133 items)
- **Total: 1,255 items**

**Processing Flow**:
```python
1. Load data from sources
2. Build context-aware prompts
3. Call AWS Bedrock (Claude Opus 4.5)
4. Parse and validate responses
5. Generate outputs (JSON, DynamoDB JSON, Excel)
6. Upload to DynamoDB
```

**Configuration**:
```python
MODEL_ID = "anthropic.claude-opus-4-20250514"
REGION = "us-west-2"
TEMPERATURE = 0.3  # Consistent tagging
MAX_TOKENS = 4096
BATCH_SIZE = 1  # Items per API call
```

### 2. Real-Time Web Scraper

**Language**: TypeScript  
**Infrastructure**: AWS CDK  
**Entry Point**: `web-scraper/infrastructure/cdk-stack.ts`

**Lambda Functions**:

1. **sitemap-parser** - Parse sitemap XML, extract URLs
2. **content-scraper** - Scrape web content, clean HTML
3. **content-classifier-enhanced** - Classify with gap detection
4. **status-checker** - Check processing status
5. **results-exporter** - Export results as JSON
6. **tag-analyzer** - Analyze classification gaps

**Processing Flow**:
```
User submits sitemap
  ↓
Sitemap Parser extracts URLs → DynamoDB + SQS
  ↓
Content Scraper (parallel) → Clean content → SQS
  ↓
Content Classifier (parallel) → Claude Opus 4.5 → S3 + DynamoDB
  ↓
User views results + gap analysis
```

**Configuration**:
```typescript
timeout: Duration.seconds(180)
memory: 2048 MB
runtime: Runtime.NODEJS_20_X
environment: {
  MODEL_ID: "anthropic.claude-opus-4-20250514",
  REGION: "us-west-2",
  TABLE_NAME: dynamoTable.tableName,
  BUCKET_NAME: resultsBucket.bucketName
}
```

---

## AWS Services

### AWS Bedrock

**Model**: Claude Opus 4.5 (anthropic.claude-opus-4-20250514)  
**Region**: us-west-2 (Global)  
**Temperature**: 0.3 (consistent tagging)

**Prompt Structure**:
```
System: You are an expert in healthcare resource classification...

User: Classify this resource:
Title: [title]
Description: [description]
Content: [content]

Apply tags from 100+ category taxonomy...
```

**Response Format**:
```json
{
  "refined_tags": {
    "personas": ["persona:patient"],
    "types": ["type:autoimmune"],
    "stages": ["stage:pre_diagnosis"],
    "topics": ["topic:diagnosis"],
    "symptoms": ["symptom:memory"],
    "locations": ["location:uk"],
    "conditions": ["condition:nmda_receptor"],
    "resource_type": ["resource:factsheet"],
    "content_length": "length:medium",
    "content_format": "format:text",
    "playlists": ["playlist:newly_diagnosed_pack"]
  },
  "recommendations": {
    "primary_audience": "...",
    "best_used_when": "...",
    "staff_notes": "..."
  },
  "metadata": {
    "estimated_time": "5 minutes",
    "complexity_level": "beginner",
    "confidence_score": 88
  },
  "suggested_new_tags": [
    {
      "category": "symptom",
      "tag": "symptom:visual_disturbances",
      "reasoning": "...",
      "confidence": 85
    }
  ]
}
```

### DynamoDB

**Table**: EncephalitisResources  
**Partition Key**: resource_id (String)  
**Sort Key**: resource_type (String)  
**Billing**: Pay-per-request

**Item Structure**:
```json
{
  "resource_id": "web_scraper_00001",
  "resource_type": "web_scraper",
  "title": "...",
  "description": "...",
  "url": "...",
  "personas": ["persona:patient"],
  "types": ["type:autoimmune"],
  "stages": ["stage:pre_diagnosis"],
  "topics": ["topic:diagnosis"],
  "symptoms": ["symptom:memory"],
  "locations": ["location:uk"],
  "conditions": ["condition:nmda_receptor"],
  "resource_types": ["resource:factsheet"],
  "content_length": "length:medium",
  "content_format": "format:text",
  "playlists": ["playlist:newly_diagnosed_pack"],
  "metadata": {
    "estimated_time": "5 minutes",
    "complexity_level": "beginner",
    "confidence_score": 88
  },
  "recommendations": {
    "primary_audience": "...",
    "best_used_when": "...",
    "staff_notes": "..."
  },
  "created_at": "2026-01-14T12:00:00Z",
  "updated_at": "2026-01-14T12:00:00Z"
}
```

**Indexes**:
- GSI on `resource_type` for filtering by source
- GSI on `personas` for persona-based queries
- GSI on `stages` for journey-based queries

### S3

**Bucket**: web-scraper-results-{account-id}  
**Structure**:
```
results/
  {batchId}/
    {encoded_url}.json
analysis/
  {batchId}.json
```

**Object Format**:
```json
{
  "url": "https://...",
  "title": "...",
  "content": "...",
  "refined_tags": {...},
  "recommendations": {...},
  "metadata": {...},
  "suggested_new_tags": [...],
  "processed_at": "2026-01-14T12:00:00Z"
}
```

### SQS

**Queues**:
- `scraping-queue` - URLs to scrape
- `classification-queue` - Content to classify
- `scraping-dlq` - Failed scraping jobs
- `classification-dlq` - Failed classification jobs

**Message Format**:
```json
{
  "batchId": "batch-123",
  "url": "https://...",
  "attempt": 1,
  "timestamp": "2026-01-14T12:00:00Z"
}
```

### API Gateway

**Endpoints**:
```
POST   /process          - Submit sitemap for processing
GET    /status/{batchId} - Check processing status
GET    /results/{batchId} - Get classification results
GET    /analysis/{batchId} - Get gap analysis
```

**Authentication**: API Key (optional)  
**CORS**: Enabled for frontend domain

---

## Tag Taxonomy

### Complete Tag List (100+)

**Personas (5)**:
- persona:patient
- persona:caregiver
- persona:parent
- persona:professional
- persona:bereaved

**Journey Stages (4)**:
- stage:pre_diagnosis
- stage:acute_hospital
- stage:early_recovery
- stage:long_term_management

**Condition Types (7+)**:
- type:autoimmune
- type:infectious
- type:post_infectious
- type:NMDA
- type:MOG
- type:TBE
- type:HSV

**Specific Conditions (10+)**:
- condition:nmda_receptor
- condition:mog_ad
- condition:bbe
- condition:hsv
- condition:tbe
- condition:japanese_encephalitis
- condition:west_nile
- condition:covid_related
- condition:pediatric

**Symptoms (10+)**:
- symptom:memory
- symptom:behaviour
- symptom:seizures
- symptom:fatigue
- symptom:mobility
- symptom:speech
- symptom:emotional
- symptom:sleep
- symptom:sensory
- symptom:pain

**Topics (15+)**:
- topic:research
- topic:treatment
- topic:diagnosis
- topic:memory
- topic:behaviour
- topic:school
- topic:work
- topic:legal
- topic:travel
- topic:rehabilitation
- topic:prevention
- topic:mental_health
- topic:relationships
- topic:financial
- topic:nutrition

**Locations (20+)**:
- location:uk
- location:worldwide
- location:europe
- location:usa
- location:canada
- location:australia
- location:brazil
- location:india
- [and more countries]

**Resource Types (11)**:
- resource:factsheet
- resource:research
- resource:event
- resource:news
- resource:video
- resource:personal_story
- resource:contact
- resource:fundraising
- resource:support_service
- resource:policy
- resource:training

**Content Length (4)**:
- length:quick (0-2 min)
- length:short (3-5 min)
- length:medium (6-10 min)
- length:long (10+ min)

**Content Format (5)**:
- format:text
- format:video
- format:audio
- format:interactive
- format:downloadable

**Playlists (5)**:
- playlist:newly_diagnosed_pack
- playlist:caregiver_support
- playlist:professional_education
- playlist:research_updates
- playlist:recovery_toolkit

---

## Adaptive Learning System

### How It Works

1. **Classification**: Classifier applies existing tags and identifies gaps
2. **Suggestion**: Suggests new tags when content doesn't fit well
3. **Aggregation**: Tag analyzer aggregates suggestions across batch
4. **Recommendation**: Provides high-priority additions based on frequency
5. **Evolution**: Administrator reviews and updates taxonomy

### Gap Detection

**Criteria for suggesting new tags**:
- Content doesn't fit existing categories well
- Confidence score < 80%
- Multiple similar resources need same tag
- Emerging topics or conditions

**Example**:
```json
{
  "suggested_new_tags": [{
    "category": "symptom",
    "tag": "symptom:visual_disturbances",
    "reasoning": "Content discusses visual symptoms not covered by 'sensory'",
    "confidence": 85
  }]
}
```

### Tag Analysis

**Aggregation across batch**:
```json
{
  "tag_frequency": {
    "symptom:visual_disturbances": {
      "count": 12,
      "avg_confidence": 87,
      "examples": [...]
    }
  },
  "recommendations": {
    "high_priority_additions": [
      "symptom:visual_disturbances",
      "condition:pediatric_encephalitis"
    ]
  }
}
```

---

## Performance & Optimization

### Processing Speed

**Batch Processing**:
- ~20 seconds per resource
- 1,255 resources in ~7 hours
- Sequential processing with rate limiting

**Real-Time Scraping**:
- ~30-60 seconds per URL
- Parallel processing (10-50 concurrent)
- Queue-based for reliability

### Cost Optimization

**Strategies**:
- Batch API calls where possible
- Efficient prompts (minimal tokens)
- Summary-based analysis for long content
- Caching common queries
- Pay-per-request DynamoDB

**Cost Breakdown** (per 1,000 items):
- Bedrock: ~£142
- Lambda: ~£0.16
- DynamoDB: ~£0.08
- S3: ~£0.02
- SQS: ~£0.01
- **Total: ~£142**

### Scalability

**Horizontal Scaling**:
- Lambda auto-scales to demand
- SQS handles any queue depth
- DynamoDB scales automatically
- S3 unlimited storage

**Limits**:
- Lambda concurrent executions: 1,000 (default)
- Bedrock API rate: 100 requests/minute
- DynamoDB throughput: On-demand (unlimited)

---

## Error Handling

### Retry Logic

**Batch Processing**:
```python
max_retries = 3
backoff = [2, 4, 8]  # seconds

for attempt in range(max_retries):
    try:
        result = call_bedrock(prompt)
        break
    except Exception as e:
        if attempt < max_retries - 1:
            time.sleep(backoff[attempt])
        else:
            log_error(e)
```

**Web Scraper**:
- SQS visibility timeout: 180 seconds
- Max receive count: 3
- Dead letter queue for failed items
- CloudWatch alarms for DLQ depth

### Validation

**Input Validation**:
- URL format validation
- Sitemap XML schema validation
- Content length limits
- Character encoding checks

**Output Validation**:
- Tag format validation
- Confidence score range (0-100)
- Required fields present
- JSON schema validation

---

## Monitoring & Logging

### CloudWatch Metrics

**Custom Metrics**:
- Items processed per minute
- Average confidence score
- Tag suggestion rate
- Error rate by type
- Processing duration

**Alarms**:
- High error rate (> 5%)
- Low confidence rate (> 20%)
- DLQ depth (> 10 messages)
- Lambda throttling

### Logging

**Log Levels**:
- ERROR: Processing failures
- WARN: Low confidence, retries
- INFO: Processing progress
- DEBUG: Detailed execution

**Log Format**:
```json
{
  "timestamp": "2026-01-14T12:00:00Z",
  "level": "INFO",
  "message": "Processed resource",
  "resource_id": "web_scraper_00001",
  "confidence": 88,
  "duration_ms": 15234
}
```

---

## Security

### IAM Roles

**Lambda Execution Role**:
- Bedrock: InvokeModel
- DynamoDB: PutItem, GetItem, Query
- S3: PutObject, GetObject
- SQS: SendMessage, ReceiveMessage, DeleteMessage
- CloudWatch: PutMetricData, CreateLogStream

**API Gateway Role**:
- Lambda: InvokeFunction

### Data Protection

**Encryption**:
- S3: Server-side encryption (SSE-S3)
- DynamoDB: Encryption at rest
- SQS: Encryption in transit

**Access Control**:
- S3 bucket policies (private)
- DynamoDB table policies
- API Gateway authentication (optional)

---

## Testing

### Unit Tests

```bash
# Python tests
pytest tests/

# TypeScript tests
cd web-scraper/backend
npm test
```

### Integration Tests

```bash
# Test batch processing
python process_all_resources.py --test

# Test web scraper
cd web-scraper/frontend
npm run test:integration
```

### Load Tests

```bash
# Simulate 1000 concurrent requests
artillery run load-test.yml
```

---

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment instructions.

---

## API Reference

### POST /process

Submit sitemap for processing.

**Request**:
```json
{
  "sitemapXml": "<urlset>...</urlset>"
}
```

**Response**:
```json
{
  "batchId": "batch-123",
  "urlCount": 50,
  "status": "processing"
}
```

### GET /status/{batchId}

Check processing status.

**Response**:
```json
{
  "batchId": "batch-123",
  "total": 50,
  "completed": 30,
  "failed": 2,
  "status": "processing"
}
```

### GET /results/{batchId}

Get classification results.

**Response**:
```json
{
  "batchId": "batch-123",
  "results": [
    {
      "url": "https://...",
      "title": "...",
      "refined_tags": {...},
      "confidence": 88
    }
  ]
}
```

### GET /analysis/{batchId}

Get gap analysis.

**Response**:
```json
{
  "batchId": "batch-123",
  "suggested_tags": [...],
  "tag_frequency": {...},
  "recommendations": {
    "high_priority_additions": [...]
  }
}
```

---

## Troubleshooting

See [DEPLOYMENT.md](DEPLOYMENT.md#troubleshooting) for common issues and solutions.

---

**Last Updated**: January 14, 2026  
**Version**: 1.0
