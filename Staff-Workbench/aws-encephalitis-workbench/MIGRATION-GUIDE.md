# Migration Guide: Google AI Studio → AWS

## Overview

This document explains the key differences between the Google AI Studio version and the AWS version of the Encephalitis Support Workbench.

## Key Changes

### 1. AI Service Migration

| Aspect | Google AI Studio | AWS |
|--------|------------------|-----|
| **Service** | Google Gemini API | Amazon Bedrock |
| **Model** | Gemini 3 Flash Preview | Claude 3.5 Sonnet / Haiku |
| **SDK** | `@google/genai` | `@aws-sdk/client-bedrock-runtime` |
| **Authentication** | API Key | IAM Roles |
| **Pricing** | Per request | Per token (input/output) |

### 2. Architecture Changes

**Google AI Studio Version:**
```
Browser → Gemini API (direct)
```

**AWS Version:**
```
Browser → API Gateway → Lambda → Bedrock
```

**Why the change?**
- Better security (no API keys in frontend)
- Scalability and monitoring
- Integration with other AWS services
- Cost optimization through caching

### 3. Code Changes

#### Frontend Service Layer

**Before (Google Gemini):**
```typescript
import { GoogleGenAI } from "@google/genai";

const getClient = () => {
    if (!process.env.API_KEY) {
        throw new Error("API Key is missing.");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        temperature: 0.3,
    }
});
```

**After (AWS Bedrock):**
```typescript
const response = await fetch(`${API_ENDPOINT}/suggest-resources`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userProfile, databaseContent })
});
```

#### Backend Lambda Function

```typescript
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const command = new InvokeModelCommand({
    modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 4000,
        temperature: 0.3,
        system: systemPrompt,
        messages: [{ role: "user", content: prompt }]
    })
});

const response = await bedrockClient.send(command);
const responseBody = JSON.parse(new TextDecoder().decode(response.body));
const text = responseBody.content[0].text;
```

### 4. Deployment Changes

**Google AI Studio:**
- Single command: `npm run dev`
- Hosted on Google's infrastructure
- API key in `.env.local`

**AWS:**
- Backend: `sam build && sam deploy`
- Frontend: Deploy to Amplify or S3+CloudFront
- No API keys needed (IAM roles)

### 5. Environment Variables

**Before:**
```env
GEMINI_API_KEY=your-api-key-here
```

**After (Frontend):**
```env
VITE_API_ENDPOINT=https://your-api-gateway-url.amazonaws.com/prod
```

**After (Backend):**
```env
BEDROCK_REGION=us-east-1
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
S3_BUCKET_NAME=your-knowledge-base-bucket
```

## Feature Parity Matrix

| Feature | Google Version | AWS Version | Status |
|---------|---------------|-------------|--------|
| CRM Search | ✅ | ✅ | ✅ Complete |
| Intake Form (Rapid) | ✅ | ✅ | ✅ Complete |
| Intake Form (Detailed) | ✅ | ✅ | ✅ Complete |
| Resource Suggestion | ✅ | ✅ | ✅ Complete |
| Resource Selection | ✅ | ✅ | ✅ Complete |
| Draft Generation | ✅ | ✅ | ✅ Complete |
| Knowledge Base Upload | ✅ | ✅ | ✅ Complete |
| Keyboard Shortcuts | ✅ | ✅ | ✅ Complete |
| Mock Profiles | ✅ | ✅ | ✅ Complete |
| Inbox Integration | ✅ | ✅ | ✅ Complete |

## Migration Steps

### Step 1: Set Up AWS Account

1. Create AWS account (if needed)
2. Enable Bedrock model access
3. Install AWS CLI and SAM CLI

### Step 2: Deploy Backend

```bash
cd aws-encephalitis-workbench/backend
npm install
sam build
sam deploy --guided
```

### Step 3: Configure Frontend

```bash
cd aws-encephalitis-workbench/frontend
npm install
cp .env.example .env.local
# Edit .env.local with your API Gateway URL
```

### Step 4: Test Locally

```bash
npm run dev
```

### Step 5: Deploy Frontend

Choose one:
- **Amplify:** Connect GitHub repo
- **S3:** `npm run build && aws s3 sync dist/ s3://your-bucket`

## Prompt Engineering Differences

### Gemini vs Claude

**Gemini Characteristics:**
- More concise responses by default
- Good at following JSON schemas
- Fast inference

**Claude Characteristics:**
- More verbose, needs explicit "be concise" instructions
- Excellent at following complex instructions
- Better at nuanced, empathetic language
- Larger context window (200K tokens)

**Prompt Adjustments:**

1. **Added explicit conciseness instructions:**
   ```
   "EXTREMELY CONCISE: The draft must be 50% SHORTER than a standard email."
   ```

2. **Clearer JSON formatting:**
   ```
   "Return only the JSON array, no other text."
   ```

3. **More structured system prompts:**
   - Separated system instruction from user prompt
   - Used Claude's message format

## Performance Comparison

| Metric | Google Gemini | AWS Bedrock (Claude) |
|--------|--------------|---------------------|
| **Latency** | 1-3 seconds | 2-5 seconds |
| **Cost per 1K tokens** | ~$0.001 | ~$0.003 (input), ~$0.015 (output) |
| **Context Window** | 32K tokens | 200K tokens |
| **JSON Mode** | Native support | Parse from text |
| **Streaming** | Yes | Yes |

## Cost Comparison

### Google AI Studio (1000 users, 10 requests each)

- Gemini API: ~$20/month
- Hosting: Included in AI Studio
- **Total: ~$20/month**

### AWS (1000 users, 10 requests each)

- Bedrock (Claude 3.5 Sonnet): ~$60/month
- Lambda: ~$0.10/month
- API Gateway: ~$0.04/month
- Amplify: ~$15/month
- **Total: ~$75/month**

**Cost Optimization:**
- Use Claude 3 Haiku: Reduces to ~$30/month total
- Use S3+CloudFront: Reduces to ~$20/month total
- Implement caching: Can reduce by 50%

## Advantages of AWS Version

### 1. Security
- No API keys in frontend code
- IAM role-based access
- VPC integration possible
- AWS WAF protection

### 2. Scalability
- Auto-scaling Lambda functions
- Global CDN with CloudFront
- No rate limits (within AWS quotas)

### 3. Integration
- Easy to add DynamoDB for user data
- SES for email sending
- EventBridge for workflows
- Step Functions for orchestration

### 4. Monitoring
- CloudWatch metrics and logs
- X-Ray tracing
- Cost Explorer
- CloudTrail audit logs

### 5. Compliance
- HIPAA eligible (with BAA)
- SOC 2 compliant
- GDPR compliant
- Regional data residency

## Disadvantages of AWS Version

### 1. Complexity
- More services to manage
- Steeper learning curve
- More configuration required

### 2. Cost
- Higher baseline cost
- More expensive AI inference
- Separate hosting costs

### 3. Development
- Slower local development (need to mock AWS services)
- More deployment steps
- Requires AWS expertise

## When to Use Each Version

### Use Google AI Studio Version When:
- Rapid prototyping
- Small scale (<100 users)
- Simple use case
- No compliance requirements
- Limited AWS expertise

### Use AWS Version When:
- Production deployment
- Enterprise scale
- Need compliance (HIPAA, SOC 2)
- Integration with existing AWS infrastructure
- Need advanced monitoring and security
- Multi-region deployment

## Troubleshooting Common Issues

### Issue: Bedrock Access Denied

**Solution:**
```bash
# Check model access in Bedrock console
# Ensure Lambda role has bedrock:InvokeModel permission
# Verify region supports Bedrock
```

### Issue: CORS Errors

**Solution:**
```yaml
# In template.yaml
Cors:
  AllowOrigin: "'*'"  # Or specific domain
  AllowHeaders: "'Content-Type'"
  AllowMethods: "'POST,OPTIONS'"
```

### Issue: Lambda Timeout

**Solution:**
```yaml
# Increase timeout in template.yaml
Timeout: 60  # seconds
```

### Issue: Different Response Format

**Solution:**
```typescript
// Claude wraps responses differently
const text = responseBody.content[0].text;
// vs Gemini
const text = response.text;
```

## Next Steps

1. Review [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions
2. Review [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
3. Test the application with sample data
4. Configure monitoring and alarms
5. Set up CI/CD pipeline
6. Implement authentication (Cognito)
7. Add database for user profiles (DynamoDB)

## Support

For issues specific to:
- **AWS Services:** AWS Support or AWS Forums
- **Bedrock:** Bedrock documentation
- **Application Logic:** GitHub Issues
