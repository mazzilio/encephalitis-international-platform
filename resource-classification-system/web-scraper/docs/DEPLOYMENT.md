# Web Scraper Deployment Guide

Step-by-step guide to deploy the real-time web scraper component.

---

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured
- Node.js 20+ installed
- AWS CDK CLI installed: `npm install -g aws-cdk`
- AWS Bedrock access with Claude Opus 4.5 enabled

---

## Step 1: Install Dependencies

```bash
# Backend dependencies
cd backend
npm install

# Infrastructure dependencies
cd ../infrastructure
npm install

# Frontend dependencies
cd ../frontend
npm install
```

---

## Step 2: Configure AWS Credentials

```bash
aws configure
```

Enter your AWS Access Key ID, Secret Access Key, and preferred region (us-west-2 recommended).

---

## Step 3: Enable AWS Bedrock Models

1. Go to AWS Console → Bedrock → Model access
2. Request access to Claude Opus 4.5 model
3. Wait for approval (usually instant)

---

## Step 4: Deploy Infrastructure

```bash
cd infrastructure

# Bootstrap CDK (first time only)
cdk bootstrap

# Deploy the stack
cdk deploy
```

This creates:
- 6 Lambda functions for processing
- DynamoDB table for tracking
- S3 bucket for results
- SQS queues for job management
- API Gateway for REST API
- IAM roles and policies

**Note the API Gateway URL** from the deployment output.

---

## Step 5: Configure Frontend

```bash
cd ../frontend
cp .env.example .env
```

Edit `.env` and add your API Gateway URL:
```
VITE_API_URL=https://xxxxx.execute-api.us-west-2.amazonaws.com/prod
```

---

## Step 6: Run Frontend

### Option A: Local Development

```bash
npm run dev
```

Access at http://localhost:3001

### Option B: Deploy to S3 + CloudFront

```bash
# Build
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-frontend-bucket --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

---

## Step 7: Test the Application

1. Open the frontend URL
2. Paste a small sitemap XML (5-10 URLs)
3. Click "Run Process"
4. Monitor progress in real-time
5. Download results when complete
6. Review gap analysis

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

# View all logs
aws logs tail /aws/lambda/WebScraperStack --follow
```

### CloudWatch Metrics

Monitor:
- Lambda invocations and errors
- Processing duration
- DynamoDB read/write capacity
- SQS queue depth
- API Gateway requests

---

## Troubleshooting

### Lambda timeout errors

Increase timeout in `cdk-stack.ts`:
```typescript
timeout: cdk.Duration.seconds(300)
```

### Bedrock access denied

Ensure you've enabled model access in the Bedrock console for Claude Opus 4.5.

### CORS errors

Check API Gateway CORS configuration in `cdk-stack.ts`:
```typescript
defaultCorsPreflightOptions: {
  allowOrigins: ['*'],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization']
}
```

### Frontend can't connect to API

- Verify API URL in `.env`
- Check API Gateway is deployed
- Verify CORS settings
- Check browser console for errors

### High costs

- Reduce concurrent Lambda executions
- Implement caching for similar content
- Use shorter prompts where possible
- Process in smaller batches

---

## Cleanup

To remove all resources:

```bash
cd infrastructure
cdk destroy
```

This removes:
- All Lambda functions
- DynamoDB table
- S3 bucket (must be empty first)
- SQS queues
- API Gateway
- IAM roles

---

## Production Checklist

### Before Deployment
- [ ] AWS credentials configured
- [ ] Bedrock access enabled
- [ ] Dependencies installed
- [ ] Test deployment in dev environment
- [ ] Cost estimates reviewed

### After Deployment
- [ ] All resources created successfully
- [ ] API endpoints responding
- [ ] Frontend accessible
- [ ] Test classification working
- [ ] Monitoring configured
- [ ] Alarms set up

### Security
- [ ] IAM roles follow least privilege
- [ ] API Gateway has authentication (if needed)
- [ ] S3 buckets not publicly accessible
- [ ] CloudWatch logs enabled
- [ ] Encryption at rest enabled

---

## Updating the System

### Update Lambda Functions

```bash
cd infrastructure
git pull
npm install
cdk deploy
```

### Update Frontend

```bash
cd frontend
git pull
npm install
npm run build
# Deploy to S3 if using CloudFront
```

---

## Support

- [Main Documentation](../../docs/)
- [Adaptive Classification](ADAPTIVE_CLASSIFICATION.md)
- [Tag Discovery](TAG_DISCOVERY.md)
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)

---

**Last Updated**: January 14, 2026  
**Version**: 1.0
