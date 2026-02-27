#!/bin/bash

# TeamBeacon API Deployment Script (CloudFormation)
# This script packages Lambda functions and deploys using CloudFormation

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="dev"
REGION="us-west-2"
PROFILE="hackathon"
STACK_NAME="team-beacon-stack"

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to display usage
usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Deploy TeamBeacon API to AWS using CloudFormation

OPTIONS:
    -e, --environment ENV    Environment to deploy (dev|staging|prod) [default: dev]
    -r, --region REGION      AWS region [default: us-west-2]
    -p, --profile PROFILE    AWS CLI profile to use
    -b, --bucket BUCKET      S3 bucket for Lambda code (optional - auto-generated if not provided)
    -h, --help              Display this help message
    --no-confirm            Skip confirmation prompts
    --validate-only         Only validate the template
    --delete                Delete the stack

EXAMPLES:
    # Deploy to dev environment (bucket auto-created)
    $0

    # Deploy with custom bucket
    $0 -b my-lambda-code-bucket

    # Deploy to production with specific profile
    $0 -e prod -p production-profile

    # Validate template only
    $0 --validate-only

    # Delete stack
    $0 --delete -e dev

EOF
    exit 1
}

# Parse command line arguments
NO_CONFIRM=false
VALIDATE_ONLY=false
DELETE_STACK=false
LAMBDA_BUCKET=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -r|--region)
            REGION="$2"
            shift 2
            ;;
        -p|--profile)
            PROFILE="$2"
            shift 2
            ;;
        -b|--bucket)
            LAMBDA_BUCKET="$2"
            shift 2
            ;;
        --no-confirm)
            NO_CONFIRM=true
            shift
            ;;
        --validate-only)
            VALIDATE_ONLY=true
            shift
            ;;
        --delete)
            DELETE_STACK=true
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            print_error "Unknown option: $1"
            usage
            ;;
    esac
done

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    print_error "Invalid environment: $ENVIRONMENT. Must be dev, staging, or prod"
    exit 1
fi

# Set stack name
STACK_NAME="teambeacon"

# Set AWS profile if provided
if [ -n "$PROFILE" ]; then
    export AWS_PROFILE="$PROFILE"
    print_info "Using AWS profile: $PROFILE"
fi

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first:"
    echo "  https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS CLI is not configured or credentials are invalid"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
print_info "AWS Account: $ACCOUNT_ID"
print_info "Region: $REGION"
print_info "Environment: $ENVIRONMENT"
print_info "Stack Name: $STACK_NAME"

# Delete stack if requested
if [ "$DELETE_STACK" = true ]; then
    print_warning "Deleting stack: $STACK_NAME"
    if [ "$NO_CONFIRM" = false ]; then
        read -p "Are you sure? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            print_info "Deletion cancelled"
            exit 0
        fi
    fi
    aws cloudformation delete-stack --stack-name "$STACK_NAME" --region "$REGION"
    print_info "Waiting for stack deletion..."
    aws cloudformation wait stack-delete-complete --stack-name "$STACK_NAME" --region "$REGION"
    print_info "Stack deleted successfully"
    exit 0
fi

# Validate template
print_info "Validating CloudFormation template..."
aws cloudformation validate-template \
    --template-body file://template.yaml \
    --region "$REGION" > /dev/null

if [ "$VALIDATE_ONLY" = true ]; then
    print_info "Template validation successful"
    exit 0
fi

# Auto-generate bucket name if not provided
if [ -z "$LAMBDA_BUCKET" ]; then
    LAMBDA_BUCKET="teambeacon-lambda-code-${ACCOUNT_ID}-${REGION}"
    print_info "No bucket specified. Using auto-generated name: $LAMBDA_BUCKET"
fi

# Check if bucket exists, create if not
if ! aws s3 ls "s3://$LAMBDA_BUCKET" 2>&1 > /dev/null; then
    print_warning "Bucket $LAMBDA_BUCKET does not exist. Creating..."
    aws s3 mb "s3://$LAMBDA_BUCKET" --region "$REGION"
    print_info "Bucket created successfully"
fi

# Package Lambda functions
print_info "Packaging Lambda functions..."

# Create temporary directory for packaging
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Package Unified Handler
print_info "Packaging unified handler..."
cd ../lambda
zip -q -r "$TEMP_DIR/unified-handler.zip" unified_handler.py
cd - > /dev/null

# Package Transcribe Function
print_info "Packaging transcribe function..."
cd ../lambda
zip -q -r "$TEMP_DIR/transcribe.zip" transcribe_voice_to_text.py
cd - > /dev/null

# Upload to S3
print_info "Uploading Lambda packages to S3..."
aws s3 cp "$TEMP_DIR/unified-handler.zip" "s3://$LAMBDA_BUCKET/lambda/unified-handler.zip" --region "$REGION"
aws s3 cp "$TEMP_DIR/transcribe.zip" "s3://$LAMBDA_BUCKET/lambda/transcribe.zip" --region "$REGION"

# Deploy CloudFormation stack
print_info "Deploying CloudFormation stack..."

PARAMETERS="ParameterKey=Environment,ParameterValue=$ENVIRONMENT"
PARAMETERS="$PARAMETERS ParameterKey=BedrockRegion,ParameterValue=$REGION"
PARAMETERS="$PARAMETERS ParameterKey=LambdaCodeBucket,ParameterValue=$LAMBDA_BUCKET"
PARAMETERS="$PARAMETERS ParameterKey=UnifiedHandlerCodeKey,ParameterValue=lambda/unified-handler.zip"
PARAMETERS="$PARAMETERS ParameterKey=TranscribeCodeKey,ParameterValue=lambda/transcribe.zip"

# Check if stack exists
if aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" &> /dev/null; then
    print_info "Stack exists. Updating..."
    CHANGESET_NAME="changeset-$(date +%s)"
    
    aws cloudformation create-change-set \
        --stack-name "$STACK_NAME" \
        --change-set-name "$CHANGESET_NAME" \
        --template-body file://template.yaml \
        --parameters $PARAMETERS \
        --capabilities CAPABILITY_NAMED_IAM \
        --region "$REGION"
    
    print_info "Waiting for change set creation..."
    aws cloudformation wait change-set-create-complete \
        --stack-name "$STACK_NAME" \
        --change-set-name "$CHANGESET_NAME" \
        --region "$REGION" 2>&1 || true
    
    # Display changes
    print_info "=== Proposed Changes ==="
    aws cloudformation describe-change-set \
        --stack-name "$STACK_NAME" \
        --change-set-name "$CHANGESET_NAME" \
        --region "$REGION" \
        --query 'Changes[*].[ResourceChange.Action,ResourceChange.LogicalResourceId,ResourceChange.ResourceType]' \
        --output table
    
    if [ "$NO_CONFIRM" = false ]; then
        read -p "Execute change set? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            print_info "Deployment cancelled"
            aws cloudformation delete-change-set \
                --stack-name "$STACK_NAME" \
                --change-set-name "$CHANGESET_NAME" \
                --region "$REGION"
            exit 0
        fi
    fi
    
    aws cloudformation execute-change-set \
        --stack-name "$STACK_NAME" \
        --change-set-name "$CHANGESET_NAME" \
        --region "$REGION"
    
    print_info "Waiting for stack update..."
    aws cloudformation wait stack-update-complete \
        --stack-name "$STACK_NAME" \
        --region "$REGION"
else
    print_info "Stack does not exist. Creating..."
    aws cloudformation create-stack \
        --stack-name "$STACK_NAME" \
        --template-body file://template.yaml \
        --parameters $PARAMETERS \
        --capabilities CAPABILITY_NAMED_IAM \
        --region "$REGION"
    
    print_info "Waiting for stack creation..."
    aws cloudformation wait stack-create-complete \
        --stack-name "$STACK_NAME" \
        --region "$REGION"
fi

# Get outputs
print_info "Deployment complete! Getting stack outputs..."

echo ""
print_info "=== API Endpoints ==="
aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`UnifiedApiEndpoint` || OutputKey==`TranscribeApiEndpoint`].[OutputKey,OutputValue]' \
    --output table

echo ""
print_info "=== Testing the APIs ==="

# Get Content API endpoint
CONTENT_API=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`UnifiedApiEndpoint`].OutputValue' \
    --output text)

# Get Transcribe API endpoint
TRANSCRIBE_API=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`TranscribeApiEndpoint`].OutputValue' \
    --output text)

if [ -n "$CONTENT_API" ]; then
    echo ""
    echo "Test Content API:"
    cat << EOF
curl -X POST "$CONTENT_API" \\
  -H "Content-Type: application/json" \\
  -d '{
    "userRole": "patient",
    "userQuery": "I am experiencing memory issues",
    "userQueryType": "Text",
    "userData": {
      "stage": "long_term_management",
      "concerns": ["memory"],
      "ageGroup": "adult"
    },
    "limit": 10
  }'
EOF
fi

if [ -n "$TRANSCRIBE_API" ]; then
    echo ""
    echo ""
    echo "Test Transcribe API:"
    echo "  cd ../test && ./create-test-audio.sh && ./test-transcribe.sh"
fi

echo ""
print_info "Deployment successful! 🚀"
