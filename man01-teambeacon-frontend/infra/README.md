# Infrastructure Deployment

This directory contains CloudFormation templates and deployment scripts for the Frontend Application.

## Prerequisites

- AWS CLI installed and configured
- AWS credentials with appropriate permissions
- Node.js and npm installed
- Bash shell

## Complete Deployment (First Time)

### Step 1: Create Infrastructure
```bash
cd infra
./deploy.sh
```

This creates:
- S3 bucket for hosting
- CloudFront distribution for CDN
- Bucket policies for public access

### Step 2: Build and Deploy App
```bash
./build-and-deploy.sh
```

This will:
1. Build your React app (`npm run build`)
2. Upload files to S3
3. Invalidate CloudFront cache
4. Display your app URL

## Quick Deployment (Updates)

After infrastructure is set up, use:

```bash
cd infra
./build-and-deploy.sh
```

Or if you've already built the app:
```bash
./deploy-only.sh
```

## Configuration

Environment variables:

- `AWS_PROFILE` - AWS CLI profile to use (optional, uses default if not set)
- `AWS_REGION` - AWS region (default: us-west-2)
- `ENVIRONMENT` - Environment: dev, staging, or prod (default: dev)

Examples:
```bash
# Using default AWS credentials
./deploy.sh

# Using a specific AWS profile
AWS_PROFILE=myprofile ./deploy.sh

# Production deployment with custom profile and region
AWS_PROFILE=prod-account ENVIRONMENT=prod AWS_REGION=us-west-2 ./deploy.sh
AWS_PROFILE=prod-account ENVIRONMENT=prod AWS_REGION=us-west-2 ./build-and-deploy.sh
```

## Scripts

- **deploy.sh** - Creates/updates CloudFormation infrastructure
- **build-and-deploy.sh** - Builds React app and deploys to S3/CloudFront
- **deploy-only.sh** - Deploys pre-built app (faster for quick updates)

## Resources Created

- **S3 Bucket** - Hosts the static website
- **CloudFront Distribution** - CDN for global content delivery
- **Bucket Policy** - Allows public read access to website content

## Cache Strategy

- Static assets (JS, CSS, images): 1 year cache
- index.html: No cache (always fresh)
- CloudFront invalidation on each deploy

## Troubleshooting

**Build fails**: Make sure you're in the project root and run `npm install`

**Stack doesn't exist**: Run `./deploy.sh` first to create infrastructure

**Changes not visible**: CloudFront invalidation takes 1-3 minutes

## Deleting Everything

```bash
# Empty the S3 bucket first
aws s3 rm s3://frontend-app-dev-website --recursive

# Delete the stack
aws cloudformation delete-stack --stack-name frontend-app-stack --region us-west-2
```
