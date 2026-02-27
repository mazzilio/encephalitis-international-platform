# Quick Start Guide

Get the Encephalitis Support Workbench running on AWS in 15 minutes.

## Prerequisites Checklist

- [ ] AWS Account with admin access
- [ ] AWS CLI installed and configured
- [ ] AWS SAM CLI installed
- [ ] Node.js 18+ installed
- [ ] Git installed

## Step-by-Step Setup

### 1. Enable Bedrock Access (5 minutes)

```bash
# Open AWS Console
# Navigate to: Amazon Bedrock → Model access
# Click "Manage model access"
# Enable: Claude 3.5 Sonnet (or Claude 3 Haiku)
# Click "Save changes"
# Wait for status to show "Access granted"
```

**Supported Regions:**
- us-east-1 (N. Virginia)
- us-west-2 (Oregon)
- eu-west-1 (Ireland)
- ap-southeast-1 (Singapore)

### 2. Deploy Backend (5 minutes)

```bash
# Clone or navigate to the project
cd aws-encephalitis-workbench/backend

# Install dependencies
npm install

# Build SAM application
sam build

# Deploy with guided prompts
sam deploy --guided
```

**Deployment Prompts:**
```
Stack Name: encephalitis-workbench
AWS Region: us-east-1
Parameter BedrockRegion: us-east-1
Parameter BedrockModelId: anthropic.claude-3-5-sonnet-20241022-v2:0
Confirm changes before deploy: Y
Allow SAM CLI IAM role creation: Y
Save arguments to configuration file: Y
```

**Save the API Endpoint URL from the output!**

### 3. Configure Frontend (2 minutes)

```bash
cd ../frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Edit .env.local
# Replace with your API Gateway URL from step 2
echo "VITE_API_ENDPOINT=https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/prod" > .env.local
```

### 4. Test Locally (1 minute)

```bash
# Start development server
npm run dev

# Open browser to http://localhost:5173
```

### 5. Deploy to Production (2 minutes)

#### Option A: AWS Amplify (Recommended)

```bash
# Initialize git (if not already)
git init
git add .
git commit -m "Initial commit"

# Push to GitHub
git remote add origin https://github.com/YOUR-ORG/encephalitis-workbench.git
git push -u origin main

# Then in AWS Console:
# 1. Go to AWS Amplify
# 2. Click "New app" → "Host web app"
# 3. Connect GitHub repository
# 4. Set build settings (auto-detected)
# 5. Add environment variable: VITE_API_ENDPOINT
# 6. Deploy
```

#### Option B: S3 + CloudFront

```bash
# Build production bundle
npm run build

# Create S3 bucket
aws s3 mb s3://encephalitis-workbench-frontend

# Enable static website hosting
aws s3 website s3://encephalitis-workbench-frontend \
  --index-document index.html \
  --error-document index.html

# Deploy
aws s3 sync dist/ s3://encephalitis-workbench-frontend --delete

# Make public (optional - use CloudFront for production)
aws s3api put-bucket-policy --bucket encephalitis-workbench-frontend --policy '{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadGetObject",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::encephalitis-workbench-frontend/*"
  }]
}'
```

## Verify Installation

### Test Backend API

```bash
# Test suggest-resources endpoint
curl -X POST https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/prod/suggest-resources \
  -H "Content-Type: application/json" \
  -d '{
    "userProfile": "Test User, Patient. Diagnosis: Anti-NMDAR. Stage: Early Recovery. Key Concerns: Memory Loss",
    "databaseContent": null
  }'

# Expected: JSON array of resources
```

### Test Frontend

1. Open the application URL
2. Search for a profile or create new
3. Fill intake form
4. Click "Retrieve Resources"
5. Select resources
6. Generate draft

## Common Issues

### Issue: "Access Denied" when calling Bedrock

**Solution:**
```bash
# Check model access in Bedrock console
# Ensure you're in a supported region
# Verify Lambda execution role has bedrock:InvokeModel permission
```

### Issue: CORS errors in browser

**Solution:**
```bash
# Update template.yaml CORS settings
# Redeploy: sam build && sam deploy
```

### Issue: Lambda timeout

**Solution:**
```bash
# Increase timeout in template.yaml
# Change Timeout: 60 to Timeout: 120
# Redeploy
```

### Issue: Frontend can't connect to API

**Solution:**
```bash
# Verify VITE_API_ENDPOINT in .env.local
# Check API Gateway URL is correct
# Ensure API is deployed to 'prod' stage
```

## Cost Estimate

For 100 requests/day:

| Service | Monthly Cost |
|---------|-------------|
| Bedrock (Claude 3.5 Sonnet) | ~$6 |
| Lambda | ~$0.01 |
| API Gateway | ~$0.01 |
| S3 | ~$0.05 |
| Amplify | ~$15 |
| **Total** | **~$21/month** |

**To reduce costs:**
- Use Claude 3 Haiku: ~$2/month (vs $6)
- Use S3+CloudFront: ~$1/month (vs $15 Amplify)

## Next Steps

1. **Add Authentication**
   - Set up AWS Cognito
   - Add login/logout functionality
   - Protect API endpoints

2. **Add Database**
   - Create DynamoDB table for user profiles
   - Store interaction history
   - Enable personalization

3. **Set Up Monitoring**
   - Create CloudWatch dashboard
   - Set up alarms for errors
   - Enable X-Ray tracing

4. **Optimize Performance**
   - Enable Lambda provisioned concurrency
   - Add CloudFront caching
   - Implement response caching

5. **Enhance Security**
   - Add API key authentication
   - Enable AWS WAF
   - Set up VPC for Lambda
   - Encrypt S3 bucket

## Useful Commands

```bash
# View Lambda logs
sam logs -n SuggestResourcesFunction --tail

# Test Lambda locally
sam local invoke SuggestResourcesFunction -e events/test-event.json

# Update backend
cd backend
sam build && sam deploy

# Update frontend (Amplify)
git push  # Auto-deploys

# Update frontend (S3)
cd frontend
npm run build
aws s3 sync dist/ s3://encephalitis-workbench-frontend --delete

# Delete everything
aws cloudformation delete-stack --stack-name encephalitis-workbench
aws s3 rb s3://encephalitis-workbench-frontend --force
```

## Getting Help

- **AWS Documentation:** https://docs.aws.amazon.com/
- **Bedrock Guide:** https://docs.aws.amazon.com/bedrock/
- **SAM Guide:** https://docs.aws.amazon.com/serverless-application-model/
- **Project Issues:** GitHub Issues

## Architecture Diagram

```
User → Amplify/CloudFront → API Gateway → Lambda → Bedrock (Claude)
                                                  ↓
                                                  S3 (Knowledge Base)
```

## What You've Built

✅ Serverless AI-powered support workbench
✅ Scalable to thousands of users
✅ Pay-per-use pricing
✅ Production-ready architecture
✅ Secure and compliant
✅ Easy to maintain and update

**Congratulations! Your AWS Encephalitis Support Workbench is live! 🎉**
