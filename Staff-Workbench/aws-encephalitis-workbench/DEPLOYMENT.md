# Deployment Guide

## Prerequisites

1. **AWS Account Setup**
   - Active AWS account
   - AWS CLI installed and configured
   - AWS SAM CLI installed

2. **Enable Bedrock Models**
   ```bash
   # Go to AWS Console
   # Navigate to: Amazon Bedrock → Model access
   # Request access to: Claude 3.5 Sonnet or Claude 3 Haiku
   # Wait for approval (usually instant for most regions)
   ```

3. **Install Dependencies**
   ```bash
   # Install AWS SAM CLI
   brew install aws-sam-cli  # macOS
   # or follow: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html
   ```

## Backend Deployment

### Step 1: Deploy Lambda Functions and API Gateway

```bash
cd backend
npm install

# Build the SAM application
sam build

# Deploy (first time - guided)
sam deploy --guided

# Follow the prompts:
# - Stack Name: encephalitis-workbench-backend
# - AWS Region: us-east-1 (or your preferred region with Bedrock)
# - Confirm changes before deploy: Y
# - Allow SAM CLI IAM role creation: Y
# - Save arguments to configuration file: Y
```

### Step 2: Note the API Endpoint

After deployment, SAM will output:
```
Outputs:
ApiEndpoint: https://xxxxx.execute-api.us-east-1.amazonaws.com/prod
```

Save this URL - you'll need it for the frontend.

### Step 3: Test the API

```bash
# Test suggest-resources endpoint
curl -X POST https://your-api-endpoint/prod/suggest-resources \
  -H "Content-Type: application/json" \
  -d '{
    "userProfile": "John Doe, Patient. Diagnosis: Anti-NMDAR. Stage: Early Recovery. Key Concerns: Memory Loss, Fatigue",
    "databaseContent": null
  }'
```

## Frontend Deployment

### Option A: AWS Amplify (Recommended)

1. **Push code to GitHub**
   ```bash
   cd frontend
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/your-org/encephalitis-workbench.git
   git push -u origin main
   ```

2. **Connect to Amplify**
   - Go to AWS Amplify Console
   - Click "New app" → "Host web app"
   - Connect your GitHub repository
   - Select the `frontend` folder as the root directory

3. **Configure Build Settings**
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm install
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: dist
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

4. **Add Environment Variables**
   - In Amplify Console → App settings → Environment variables
   - Add: `VITE_API_ENDPOINT` = `https://your-api-endpoint/prod`

5. **Deploy**
   - Amplify will automatically build and deploy
   - You'll get a URL like: `https://main.xxxxx.amplifyapp.com`

### Option B: S3 + CloudFront

1. **Create S3 Bucket**
   ```bash
   aws s3 mb s3://encephalitis-workbench-frontend
   aws s3 website s3://encephalitis-workbench-frontend \
     --index-document index.html \
     --error-document index.html
   ```

2. **Configure Environment**
   ```bash
   cd frontend
   cp .env.example .env.local
   # Edit .env.local with your API endpoint
   ```

3. **Build and Deploy**
   ```bash
   npm install
   npm run build
   
   aws s3 sync dist/ s3://encephalitis-workbench-frontend --delete
   ```

4. **Create CloudFront Distribution** (Optional, for HTTPS and CDN)
   - Go to CloudFront Console
   - Create distribution
   - Origin: Your S3 bucket
   - Enable HTTPS
   - Set default root object: `index.html`

## Post-Deployment Configuration

### 1. Update CORS if needed

If you encounter CORS issues, update the API Gateway CORS settings:

```bash
# In template.yaml, ensure CORS is configured:
Cors:
  AllowMethods: "'GET,POST,OPTIONS'"
  AllowHeaders: "'Content-Type,X-Amz-Date,Authorization,X-Api-Key'"
  AllowOrigin: "'*'"  # Or specify your Amplify URL
```

### 2. Set up Custom Domain (Optional)

**For Amplify:**
- Go to Amplify Console → Domain management
- Add your custom domain
- Follow DNS configuration steps

**For CloudFront:**
- Request SSL certificate in ACM
- Add CNAME to CloudFront distribution
- Update DNS records

### 3. Enable Monitoring

```bash
# CloudWatch Logs are automatically enabled for Lambda
# View logs:
aws logs tail /aws/lambda/encephalitis-workbench-SuggestResourcesFunction --follow
```

## Updating the Application

### Backend Updates

```bash
cd backend
# Make your changes
sam build
sam deploy  # Uses saved configuration
```

### Frontend Updates

**Amplify:** Just push to GitHub - auto-deploys

**S3:** 
```bash
cd frontend
npm run build
aws s3 sync dist/ s3://encephalitis-workbench-frontend --delete
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

## Troubleshooting

### Lambda Function Errors

```bash
# View logs
sam logs -n SuggestResourcesFunction --tail

# Test locally
sam local invoke SuggestResourcesFunction -e events/test-event.json
```

### Bedrock Access Denied

- Ensure your Lambda execution role has `bedrock:InvokeModel` permission
- Verify model access is enabled in Bedrock console
- Check the region matches where Bedrock is available

### API Gateway 403 Errors

- Check CORS configuration
- Verify API endpoint URL is correct
- Check CloudWatch logs for Lambda errors

## Cost Optimization

1. **Use Bedrock Claude Haiku** for lower costs (change model ID in template.yaml)
2. **Enable Lambda reserved concurrency** if you have predictable traffic
3. **Set up CloudWatch alarms** for cost monitoring
4. **Use S3 lifecycle policies** for knowledge base files

## Security Best Practices

1. **Add API Key authentication** to API Gateway
2. **Implement AWS Cognito** for user authentication
3. **Enable CloudTrail** for audit logging
4. **Use AWS WAF** to protect API Gateway
5. **Encrypt S3 buckets** with KMS
6. **Set up VPC** for Lambda functions (if handling sensitive data)

## Rollback

If deployment fails:

```bash
# Delete the stack
aws cloudformation delete-stack --stack-name encephalitis-workbench-backend

# Or rollback to previous version
aws cloudformation rollback-stack --stack-name encephalitis-workbench-backend
```
