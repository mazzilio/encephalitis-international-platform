# TeamBeacon CloudFormation Deployment

This directory contains pure CloudFormation templates and deployment scripts for the TeamBeacon API, converted from the original SAM deployment.

## Key Differences from SAM

- **No SAM CLI required**: Uses AWS CLI and CloudFormation directly
- **Manual Lambda packaging**: Lambda functions are zipped and uploaded to S3
- **Explicit API Gateway resources**: All API Gateway resources, methods, and integrations are defined explicitly
- **IAM roles defined**: Lambda execution roles are explicitly created with necessary permissions

## Prerequisites

1. AWS CLI installed and configured
2. An S3 bucket for Lambda deployment packages
3. Appropriate AWS credentials with permissions to create CloudFormation stacks

## Quick Start

```bash
# Deploy to dev environment (bucket auto-created)
./deploy.sh

# Or specify your own bucket
./deploy.sh -b your-lambda-code-bucket

# Deploy to production
./deploy.sh -e prod -r us-west-2

# Validate template only
./deploy.sh --validate-only

# Delete stack
./deploy.sh --delete -e dev
```

## Deployment Script Options

- `-e, --environment`: Environment (dev|staging|prod) [default: dev]
- `-r, --region`: AWS region [default: us-west-2]
- `-p, --profile`: AWS CLI profile to use
- `-b, --bucket`: S3 bucket for Lambda code (optional - auto-generated if not provided)
- `--no-confirm`: Skip confirmation prompts
- `--validate-only`: Only validate the template
- `--delete`: Delete the stack

## What the Script Does

1. Validates the CloudFormation template
2. Creates S3 bucket if it doesn't exist
3. Packages Lambda functions into zip files
4. Uploads zip files to S3
5. Creates or updates CloudFormation stack
6. Displays API endpoints and test commands

## Stack Resources

The CloudFormation stack creates:

- **API Gateway**: REST API with /api and /transcribe endpoints
- **Lambda Functions**: Unified handler and transcribe functions
- **IAM Roles**: Execution roles with appropriate permissions
- **S3 Bucket**: For audio file storage
- **DynamoDB Table**: For content storage
- **CloudWatch Log Groups**: For Lambda function logs

## Parameters

The template accepts these parameters:

- `Environment`: dev, staging, or prod
- `BedrockRegion`: AWS region for Bedrock service
- `LambdaCodeBucket`: S3 bucket containing Lambda packages
- `UnifiedHandlerCodeKey`: S3 key for unified handler code
- `TranscribeCodeKey`: S3 key for transcribe function code

## Outputs

After deployment, the stack outputs:

- API Gateway endpoint URLs
- Lambda function ARNs
- S3 bucket name
- DynamoDB table name
- API Gateway ID

## Updating Lambda Code

To update Lambda function code without redeploying the entire stack:

```bash
# Package and upload new code
cd ../lambda_function
zip -r /tmp/unified-handler.zip unified_handler.py
aws s3 cp /tmp/unified-handler.zip s3://your-bucket/lambda/unified-handler.zip

# Update Lambda function
aws lambda update-function-code \
  --function-name dev-teambeacon-handler \
  --s3-bucket your-bucket \
  --s3-key lambda/unified-handler.zip
```

## Troubleshooting

### Stack creation fails
- Check CloudWatch Logs for Lambda execution errors
- Verify IAM permissions
- Ensure S3 bucket exists and is accessible

### API Gateway returns 500 errors
- Check Lambda function logs in CloudWatch
- Verify environment variables are set correctly
- Test Lambda functions directly using AWS Console

### Lambda permission errors
- Verify IAM roles have necessary permissions
- Check resource policies on DynamoDB and S3

## Migration from SAM

If you're migrating from the SAM deployment:

1. Note your current stack outputs (API endpoints, table names, etc.)
2. Delete the SAM stack or deploy CloudFormation with a different stack name
3. Update any hardcoded references to stack names or resources
4. Test thoroughly before switching production traffic
