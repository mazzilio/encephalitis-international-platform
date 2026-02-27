# AWS Web Scraper for Resource Classification

**Real-time web scraping component of the Encephalitis International Resource Classification System**

---

## Overview

This AWS-powered web scraper automatically discovers, scrapes, and classifies web content in real-time using Claude Opus 4.5. It integrates seamlessly with the batch processing pipeline to provide continuous resource discovery and classification.

### Key Features

- **Real-time classification** as content is scraped
- **Adaptive learning** identifies classification gaps
- **Serverless architecture** scales automatically
- **100+ tag taxonomy** for precise classification
- **Confidence scoring** for transparency
- **Gap analysis** for taxonomy evolution

---

## Quick Start

### Prerequisites

- AWS Account with Bedrock access
- Node.js 20+ installed
- AWS CLI configured
- AWS CDK installed: `npm install -g aws-cdk`

### Deploy Infrastructure

```bash
# 1. Install dependencies
cd infrastructure
npm install

# 2. Bootstrap CDK (first time only)
cdk bootstrap

# 3. Deploy
cdk deploy
```

### Configure Frontend

```bash
# 1. Navigate to frontend
cd ../frontend

# 2. Configure API URL
cp .env.example .env
# Edit .env with your API Gateway URL

# 3. Install and run
npm install
npm run dev
```

Access at http://localhost:3001

---

## Architecture

```
┌──────────────┐
│   Frontend   │ (React)
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────┐
│         API Gateway                  │
└──────────────────────────────────────┘
       │
       ├─────────────────────────────────┐
       │                                 │
       ▼                                 ▼
┌──────────────┐              ┌──────────────────┐
│   Sitemap    │              │     Status       │
│   Parser     │              │    Checker       │
└──────┬───────┘              └──────────────────┘
       │
       ▼
┌──────────────┐
│  SQS Queue   │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────┐
│      Content Scraper (parallel)      │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  Content Classifier (parallel)       │
│  • Claude Opus 4.5                   │
│  • 100+ tags                         │
│  • Gap detection                     │
│  • Confidence scoring                │
└──────────────┬───────────────────────┘
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
┌──────────┐    ┌──────────────┐
│    S3    │    │  DynamoDB    │
└──────────┘    └──────────────┘
       │                │
       └────────┬───────┘
                │
                ▼
┌──────────────────────────────────────┐
│         Tag Analyzer                 │
│  • Aggregate suggestions             │
│  • Identify high-priority tags       │
│  • Generate recommendations          │
└──────────────────────────────────────┘
```

---

## Components

### Lambda Functions

1. **sitemap-parser** - Parse sitemap XML, extract URLs, queue for processing
2. **content-scraper** - Scrape web content, clean HTML, extract text
3. **content-classifier-enhanced** - Classify with Claude Opus 4.5, detect gaps
4. **status-checker** - Check processing status, calculate progress
5. **results-exporter** - Export results as JSON
6. **tag-analyzer** - Analyze classification gaps, suggest improvements

### Frontend

React application for:
- Submitting sitemaps for processing
- Monitoring real-time progress
- Viewing classification results
- Downloading results as JSON
- Visualizing statistics

### Infrastructure

AWS CDK code defining:
- Lambda functions with proper IAM roles
- DynamoDB table for tracking
- S3 bucket for results
- SQS queues for reliable processing
- API Gateway for REST API

---

## Features

### 1. Real-Time Classification

Content is classified as it's scraped using Claude Opus 4.5 with the same 100+ tag taxonomy as the batch processing pipeline.

### 2. Adaptive Learning

The system identifies when content doesn't fit existing categories and suggests new tags:

```json
{
  "refined_tags": {
    "symptoms": ["symptom:sensory"]
  },
  "suggested_new_tags": [{
    "category": "symptom",
    "tag": "symptom:visual_disturbances",
    "reasoning": "Content discusses visual symptoms not covered by existing tags",
    "confidence": 85
  }]
}
```

### 3. Gap Analysis

After processing a batch, the tag analyzer aggregates suggestions:

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

### 4. Confidence Scoring

Every classification includes confidence scores:
- Overall classification confidence
- Persona match confidence
- Stage match confidence
- Topic relevance confidence

---

## API Endpoints

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
  "results": [...]
}
```

### GET /analysis/{batchId}

Get gap analysis and tag suggestions.

**Response**:
```json
{
  "batchId": "batch-123",
  "suggested_tags": [...],
  "recommendations": {
    "high_priority_additions": [...]
  }
}
```

---

## Cost Estimation

**Per 1,000 URLs**:
- Lambda invocations: ~$0.20
- Bedrock (Claude Opus 4.5): ~$8-12
- DynamoDB: ~$0.10
- S3 storage: ~$0.02
- SQS: ~$0.01

**Total: ~$8-12 per 1,000 URLs**

---

## Monitoring

### CloudWatch Logs

```bash
# View classifier logs
aws logs tail /aws/lambda/WebScraperStack-ContentClassifier --follow

# View scraper logs
aws logs tail /aws/lambda/WebScraperStack-ContentScraper --follow
```

### CloudWatch Metrics

Monitor:
- Lambda invocations and errors
- Processing duration
- Confidence score distribution
- Tag suggestion rate

---

## Documentation

- **[Deployment Guide](docs/DEPLOYMENT.md)** - Detailed deployment instructions
- **[Adaptive Classification](docs/ADAPTIVE_CLASSIFICATION.md)** - How the system learns
- **[Tag Discovery](docs/TAG_DISCOVERY.md)** - Gap analysis and taxonomy evolution
- **[Integration Guide](docs/INTEGRATION.md)** - Integration with main system

---

## Cleanup

To remove all resources:

```bash
cd infrastructure
cdk destroy
```

---

## Support

For questions or issues:
- Check documentation in `/docs`
- Review CloudWatch logs
- See main project [README](../README.md)

---

**Status**: ✅ Production Ready  
**Model**: Claude Opus 4.5 (Global)  
**Region**: us-west-2 (Oregon)  
**Last Updated**: January 14, 2026
