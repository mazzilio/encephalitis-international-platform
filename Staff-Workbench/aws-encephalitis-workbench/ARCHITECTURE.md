# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Browser                             │
│                    (React + Vite Frontend)                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AWS Amplify / CloudFront                    │
│                    (Static Hosting + CDN)                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ REST API
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Amazon API Gateway                          │
│                    (REST API Endpoints)                          │
└─────────┬──────────────────┬──────────────────┬─────────────────┘
          │                  │                  │
          │                  │                  │
          ▼                  ▼                  ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  Lambda Function │ │  Lambda Function │ │  Lambda Function │
│ suggestResources │ │  generateDraft   │ │ uploadKnowledge  │
└────────┬─────────┘ └────────┬─────────┘ └────────┬─────────┘
         │                    │                     │
         │                    │                     │
         ▼                    ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Amazon Bedrock                              │
│              (Claude 3.5 Sonnet / Haiku)                         │
└─────────────────────────────────────────────────────────────────┘
                                                   │
                                                   │
                                                   ▼
                                          ┌──────────────────┐
                                          │   Amazon S3      │
                                          │ Knowledge Base   │
                                          └──────────────────┘
```

## Component Details

### Frontend (React + Vite)

**Location:** `frontend/src/`

**Key Components:**
- `App.tsx` - Main application with 4-step workflow
- `components/FileUploader.tsx` - Knowledge base file upload
- `components/OutputSection.tsx` - Draft email display
- `services/aws-bedrock.ts` - API client for backend

**Features:**
- CRM search and profile selection
- Rapid triage vs detailed intake modes
- AI-powered resource suggestion
- Human-in-the-loop resource curation
- Modular email draft generation

**Hosting Options:**
1. **AWS Amplify** (Recommended)
   - Automatic CI/CD from GitHub
   - Built-in SSL/HTTPS
   - Custom domain support
   - Environment variable management

2. **S3 + CloudFront**
   - Lower cost for static hosting
   - Manual deployment process
   - Full control over caching

### Backend (AWS Lambda + API Gateway)

**Location:** `backend/src/`

**Endpoints:**

1. **POST /suggest-resources**
   - Input: User profile, optional knowledge base content
   - Process: Invokes Bedrock to generate 10-15 relevant resources
   - Output: Array of Resource objects

2. **POST /generate-draft**
   - Input: User profile, selected resources
   - Process: Invokes Bedrock to create modular email blocks
   - Output: DraftResponse object (subject, opening, resourceIntro, closing, signOff)

3. **POST /upload-knowledge-base**
   - Input: File name and content
   - Process: Stores JSON file in S3
   - Output: Success confirmation with S3 key

**Lambda Configuration:**
- Runtime: Node.js 20.x
- Memory: 512 MB
- Timeout: 60 seconds
- IAM Permissions:
  - `bedrock:InvokeModel`
  - `s3:GetObject`, `s3:PutObject`
  - `logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents`

### AI Service (Amazon Bedrock)

**Model:** Claude 3.5 Sonnet (or Claude 3 Haiku for cost optimization)

**Model ID:** `anthropic.claude-3-5-sonnet-20241022-v2:0`

**Configuration:**
- Temperature: 0.3 (resource suggestion), 0.5 (draft generation)
- Max Tokens: 4000 (resources), 2000 (draft)
- System Prompts: Embedded in Lambda functions

**Why Bedrock?**
- Fully managed service (no infrastructure)
- Pay-per-use pricing
- Multiple model options (Claude, Titan, etc.)
- Built-in security and compliance
- Regional availability

### Storage (Amazon S3)

**Bucket:** `{stack-name}-knowledge-base`

**Structure:**
```
knowledge-base/
  └── {filename}.json
```

**Purpose:**
- Store uploaded knowledge base files
- Optional: Could be extended to use Bedrock Knowledge Bases for RAG

**Configuration:**
- CORS enabled for browser uploads
- Encryption at rest (optional)
- Lifecycle policies (optional)

## Data Flow

### 1. Resource Suggestion Flow

```
User fills intake form
    ↓
Frontend calls /suggest-resources
    ↓
Lambda receives request
    ↓
Lambda constructs prompt with user profile
    ↓
Lambda invokes Bedrock (Claude)
    ↓
Claude analyzes profile and generates resources
    ↓
Lambda parses JSON response
    ↓
Frontend displays resource cards
    ↓
User selects relevant resources
```

### 2. Draft Generation Flow

```
User selects resources
    ↓
Frontend calls /generate-draft
    ↓
Lambda receives profile + selected resources
    ↓
Lambda constructs prompt
    ↓
Lambda invokes Bedrock (Claude)
    ↓
Claude generates modular email blocks
    ↓
Lambda parses JSON response
    ↓
Frontend displays editable draft
```

## Security Architecture

### Authentication & Authorization

**Current:** Open API (no authentication)

**Recommended Enhancements:**
1. **API Key** - Simple protection via API Gateway
2. **AWS Cognito** - User authentication and authorization
3. **IAM Roles** - Service-to-service authentication

### Data Protection

- **In Transit:** HTTPS/TLS for all communications
- **At Rest:** S3 encryption (optional)
- **Secrets:** No API keys in frontend (serverless backend handles Bedrock access)

### Network Security

- **API Gateway:** Rate limiting, throttling
- **Lambda:** VPC integration (optional for sensitive data)
- **WAF:** Web Application Firewall (optional)

## Scalability

### Auto-Scaling Components

- **Lambda:** Automatic scaling (up to 1000 concurrent executions by default)
- **API Gateway:** Handles 10,000 requests/second by default
- **Bedrock:** Managed service with automatic scaling
- **CloudFront/Amplify:** Global CDN with automatic scaling

### Performance Optimization

1. **Lambda Cold Starts:**
   - Use provisioned concurrency for critical functions
   - Keep deployment packages small
   - Use Lambda layers for shared dependencies

2. **API Response Times:**
   - Bedrock typically responds in 2-5 seconds
   - Consider streaming responses for better UX
   - Implement caching for common queries

3. **Frontend:**
   - Code splitting with Vite
   - Lazy loading components
   - CloudFront caching

## Cost Breakdown

### Estimated Monthly Costs (1000 users, 10 requests/user)

| Service | Usage | Cost |
|---------|-------|------|
| Bedrock (Claude 3.5 Sonnet) | 10K requests × 2K tokens avg | ~$60 |
| Lambda | 20K invocations × 3s avg | ~$0.10 |
| API Gateway | 20K requests | ~$0.04 |
| S3 | 1 GB storage + requests | ~$0.05 |
| Amplify | Hosting + builds | ~$15 |
| **Total** | | **~$75/month** |

**Cost Optimization:**
- Use Claude 3 Haiku instead: ~$15/month (75% savings on AI)
- Use S3+CloudFront instead of Amplify: ~$5/month
- Implement caching to reduce Bedrock calls

## Monitoring & Observability

### CloudWatch Metrics

- Lambda invocations, duration, errors
- API Gateway requests, latency, 4xx/5xx errors
- Bedrock token usage, throttling

### Logging

- Lambda logs: `/aws/lambda/{function-name}`
- API Gateway access logs
- CloudTrail for API calls

### Alarms

- Lambda error rate > 5%
- API Gateway latency > 5s
- Bedrock throttling events
- Cost anomaly detection

## Disaster Recovery

### Backup Strategy

- **Code:** Version controlled in Git
- **Infrastructure:** CloudFormation templates (IaC)
- **Data:** S3 versioning enabled
- **Configuration:** Environment variables in Parameter Store

### Recovery Procedures

1. **Lambda Function Failure:** Automatic retry with exponential backoff
2. **API Gateway Failure:** Multi-region deployment (optional)
3. **Bedrock Unavailable:** Fallback to cached responses or alternative model
4. **Complete Stack Failure:** Redeploy from CloudFormation template

## Future Enhancements

### Potential AWS Integrations

1. **Amazon Bedrock Knowledge Bases**
   - RAG with automatic embedding and retrieval
   - Better context for resource suggestions

2. **Amazon DynamoDB**
   - Store user profiles and interaction history
   - Enable personalization

3. **Amazon SES**
   - Send emails directly from the application
   - Track email delivery and opens

4. **Amazon EventBridge**
   - Trigger workflows based on events
   - Integration with other systems

5. **AWS Step Functions**
   - Orchestrate complex multi-step workflows
   - Better error handling and retries

6. **Amazon Cognito**
   - User authentication and authorization
   - Role-based access control

7. **Amazon CloudWatch Insights**
   - Advanced log analysis
   - Performance optimization insights
