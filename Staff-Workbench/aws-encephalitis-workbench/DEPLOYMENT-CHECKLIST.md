# Deployment Checklist

Use this checklist to ensure a smooth deployment of the Encephalitis Support Workbench on AWS.

## Pre-Deployment

### AWS Account Setup
- [ ] AWS account created and active
- [ ] Billing alerts configured
- [ ] IAM user created with appropriate permissions
- [ ] AWS CLI installed and configured (`aws configure`)
- [ ] AWS SAM CLI installed (`sam --version`)

### Development Environment
- [ ] Node.js 18+ installed (`node --version`)
- [ ] Git installed (`git --version`)
- [ ] Code editor installed (VS Code recommended)
- [ ] Terminal/command line access

### AWS Region Selection
- [ ] Chosen region supports Amazon Bedrock
- [ ] Verified Claude models available in region
- [ ] Noted region code (e.g., us-east-1)

**Supported Regions:**
- ✅ us-east-1 (N. Virginia)
- ✅ us-west-2 (Oregon)
- ✅ eu-west-1 (Ireland)
- ✅ ap-southeast-1 (Singapore)

## Bedrock Setup

### Model Access
- [ ] Navigated to Amazon Bedrock console
- [ ] Clicked "Model access" in left sidebar
- [ ] Requested access to Claude 3.5 Sonnet
- [ ] (Optional) Requested access to Claude 3 Haiku
- [ ] Verified status shows "Access granted"
- [ ] Noted model ID: `anthropic.claude-3-5-sonnet-20241022-v2:0`

### Test Bedrock Access
```bash
aws bedrock list-foundation-models --region us-east-1
```
- [ ] Command executed successfully
- [ ] Claude models listed in output

## Backend Deployment

### Prepare Backend
```bash
cd aws-encephalitis-workbench/backend
```
- [ ] Navigated to backend directory
- [ ] Reviewed `template.yaml` configuration
- [ ] Reviewed Lambda function code

### Install Dependencies
```bash
npm install
```
- [ ] Dependencies installed successfully
- [ ] No error messages

### Build SAM Application
```bash
sam build
```
- [ ] Build completed successfully
- [ ] `.aws-sam` directory created
- [ ] No build errors

### Deploy Backend
```bash
sam deploy --guided
```

**Deployment Configuration:**
- [ ] Stack Name: `encephalitis-workbench` (or your choice)
- [ ] AWS Region: `us-east-1` (or your choice)
- [ ] Parameter BedrockRegion: Same as AWS Region
- [ ] Parameter BedrockModelId: `anthropic.claude-3-5-sonnet-20241022-v2:0`
- [ ] Confirm changes before deploy: `Y`
- [ ] Allow SAM CLI IAM role creation: `Y`
- [ ] Disable rollback: `N`
- [ ] Save arguments to configuration file: `Y`
- [ ] SAM configuration file: `samconfig.toml`
- [ ] SAM configuration environment: `default`

### Verify Backend Deployment
- [ ] Deployment completed successfully
- [ ] CloudFormation stack created
- [ ] API Gateway endpoint URL displayed
- [ ] **SAVED API ENDPOINT URL:** `_______________________________`

### Test Backend API
```bash
curl -X POST https://YOUR-API-ID.execute-api.REGION.amazonaws.com/prod/suggest-resources \
  -H "Content-Type: application/json" \
  -d '{"userProfile":"Test User, Patient. Diagnosis: Anti-NMDAR. Stage: Early Recovery. Key Concerns: Memory Loss","databaseContent":null}'
```
- [ ] API responded successfully
- [ ] Received JSON array of resources
- [ ] No error messages

## Frontend Setup

### Prepare Frontend
```bash
cd ../frontend
```
- [ ] Navigated to frontend directory
- [ ] Reviewed `package.json`

### Install Dependencies
```bash
npm install
```
- [ ] Dependencies installed successfully
- [ ] No error messages

### Configure Environment
```bash
cp .env.example .env.local
```
- [ ] `.env.local` file created
- [ ] Edited file with API endpoint URL
- [ ] Format: `VITE_API_ENDPOINT=https://YOUR-API-ID.execute-api.REGION.amazonaws.com/prod`

### Test Locally
```bash
npm run dev
```
- [ ] Development server started
- [ ] Opened browser to `http://localhost:5173`
- [ ] Application loaded successfully
- [ ] No console errors
- [ ] Tested CRM search
- [ ] Tested intake form
- [ ] Tested resource suggestion
- [ ] Tested draft generation

## Production Deployment

### Option A: AWS Amplify

#### Initialize Git Repository
```bash
git init
git add .
git commit -m "Initial commit"
```
- [ ] Git repository initialized
- [ ] Files committed

#### Push to GitHub
```bash
git remote add origin https://github.com/YOUR-ORG/encephalitis-workbench.git
git push -u origin main
```
- [ ] Repository created on GitHub
- [ ] Code pushed successfully

#### Configure Amplify
- [ ] Opened AWS Amplify Console
- [ ] Clicked "New app" → "Host web app"
- [ ] Connected GitHub repository
- [ ] Selected repository and branch
- [ ] Reviewed build settings (auto-detected)
- [ ] Added environment variable: `VITE_API_ENDPOINT`
- [ ] Clicked "Save and deploy"

#### Verify Amplify Deployment
- [ ] Build completed successfully
- [ ] Application deployed
- [ ] **SAVED AMPLIFY URL:** `_______________________________`
- [ ] Opened Amplify URL in browser
- [ ] Application loaded successfully
- [ ] Tested all features

### Option B: S3 + CloudFront

#### Build Production Bundle
```bash
npm run build
```
- [ ] Build completed successfully
- [ ] `dist/` directory created

#### Create S3 Bucket
```bash
aws s3 mb s3://encephalitis-workbench-frontend
```
- [ ] Bucket created successfully
- [ ] **SAVED BUCKET NAME:** `_______________________________`

#### Configure Static Website Hosting
```bash
aws s3 website s3://encephalitis-workbench-frontend \
  --index-document index.html \
  --error-document index.html
```
- [ ] Website hosting enabled

#### Deploy to S3
```bash
aws s3 sync dist/ s3://encephalitis-workbench-frontend --delete
```
- [ ] Files uploaded successfully
- [ ] No errors

#### Configure Bucket Policy (for testing only)
```bash
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
- [ ] Bucket policy applied
- [ ] **Note:** For production, use CloudFront instead

#### (Optional) Create CloudFront Distribution
- [ ] Opened CloudFront Console
- [ ] Created new distribution
- [ ] Set origin to S3 bucket
- [ ] Enabled HTTPS
- [ ] Set default root object: `index.html`
- [ ] Created distribution
- [ ] **SAVED CLOUDFRONT URL:** `_______________________________`

## Post-Deployment Verification

### Functional Testing
- [ ] Opened production URL
- [ ] CRM search works
- [ ] Profile selection works
- [ ] Intake form (Rapid mode) works
- [ ] Intake form (Detailed mode) works
- [ ] Resource suggestion works (AI call)
- [ ] Resource selection works
- [ ] Draft generation works (AI call)
- [ ] Knowledge base upload works
- [ ] All UI elements render correctly
- [ ] No console errors

### Performance Testing
- [ ] Page load time < 3 seconds
- [ ] Resource suggestion < 10 seconds
- [ ] Draft generation < 10 seconds
- [ ] No timeout errors

### Cross-Browser Testing
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browser

### API Testing
- [ ] All API endpoints respond
- [ ] Error handling works
- [ ] CORS configured correctly
- [ ] Rate limiting works (if configured)

## Monitoring Setup

### CloudWatch Dashboards
- [ ] Opened CloudWatch Console
- [ ] Created dashboard: "Encephalitis-Workbench"
- [ ] Added Lambda metrics (invocations, errors, duration)
- [ ] Added API Gateway metrics (requests, latency, errors)
- [ ] Added Bedrock metrics (if available)

### CloudWatch Alarms
- [ ] Created alarm: Lambda error rate > 5%
- [ ] Created alarm: API Gateway 5xx errors > 10
- [ ] Created alarm: Lambda duration > 30 seconds
- [ ] Configured SNS topic for notifications
- [ ] Subscribed email to SNS topic
- [ ] Verified email subscription

### Cost Monitoring
- [ ] Opened AWS Cost Explorer
- [ ] Created budget: $100/month (adjust as needed)
- [ ] Configured budget alerts at 80% and 100%
- [ ] Enabled cost anomaly detection

## Security Hardening

### API Gateway
- [ ] Reviewed CORS settings
- [ ] (Optional) Enabled API key authentication
- [ ] (Optional) Enabled throttling
- [ ] (Optional) Enabled AWS WAF

### Lambda Functions
- [ ] Reviewed IAM roles
- [ ] Verified least privilege permissions
- [ ] (Optional) Enabled VPC integration
- [ ] Enabled CloudWatch Logs

### S3 Bucket
- [ ] Enabled versioning
- [ ] (Optional) Enabled encryption
- [ ] Reviewed bucket policy
- [ ] Blocked public access (if using CloudFront)

### Secrets Management
- [ ] No hardcoded secrets in code
- [ ] Environment variables properly configured
- [ ] (Optional) Migrated to AWS Secrets Manager

## Documentation

### Internal Documentation
- [ ] Documented API endpoint URLs
- [ ] Documented AWS account details
- [ ] Documented deployment process
- [ ] Created runbook for common issues
- [ ] Documented monitoring procedures

### User Documentation
- [ ] Created user guide
- [ ] Documented workflows
- [ ] Created training materials
- [ ] Set up support process

## Backup & Disaster Recovery

### Backup Strategy
- [ ] Code backed up in Git
- [ ] CloudFormation templates saved
- [ ] Environment variables documented
- [ ] S3 versioning enabled

### Disaster Recovery Plan
- [ ] Documented recovery procedures
- [ ] Tested stack deletion and recreation
- [ ] Documented RTO and RPO
- [ ] Created emergency contacts list

## Handoff

### Team Training
- [ ] Trained team on AWS console
- [ ] Trained team on deployment process
- [ ] Trained team on monitoring
- [ ] Trained team on troubleshooting

### Access Management
- [ ] Created IAM users for team members
- [ ] Configured MFA for all users
- [ ] Documented access procedures
- [ ] Set up on-call rotation

### Ongoing Maintenance
- [ ] Scheduled weekly monitoring reviews
- [ ] Scheduled monthly cost reviews
- [ ] Scheduled quarterly security audits
- [ ] Documented update procedures

## Final Checklist

- [ ] All tests passing
- [ ] All documentation complete
- [ ] All team members trained
- [ ] Monitoring configured
- [ ] Backups verified
- [ ] Disaster recovery tested
- [ ] Security hardened
- [ ] Cost monitoring enabled
- [ ] Support process established
- [ ] **READY FOR PRODUCTION! 🚀**

## Important URLs

| Resource | URL |
|----------|-----|
| **API Gateway** | `_______________________________` |
| **Frontend (Amplify)** | `_______________________________` |
| **Frontend (S3)** | `_______________________________` |
| **CloudWatch Dashboard** | `_______________________________` |
| **GitHub Repository** | `_______________________________` |
| **Documentation** | `_______________________________` |

## Emergency Contacts

| Role | Name | Contact |
|------|------|---------|
| **AWS Admin** | `_______________________________` | `_______________________________` |
| **Developer** | `_______________________________` | `_______________________________` |
| **Support** | `_______________________________` | `_______________________________` |

## Notes

```
Add any deployment-specific notes here:




```

---

**Deployment Date:** `_______________________________`

**Deployed By:** `_______________________________`

**Sign-off:** `_______________________________`
