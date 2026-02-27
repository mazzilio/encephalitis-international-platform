#!/bin/bash

# Build and Deploy Script for React App to S3/CloudFront
set -e

# Configuration
STACK_NAME="hack-frontend-app-stack"
REGION="${AWS_REGION:-us-west-2}"
BUILD_DIR="dist"
AWS_PROFILE="${AWS_PROFILE:-}"

# Build AWS CLI command with optional profile
aws_cmd() {
    if [ -n "$AWS_PROFILE" ]; then
        aws --profile "$AWS_PROFILE" "$@"
    else
        aws "$@"
    fi
}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Display configuration
if [ -n "$AWS_PROFILE" ]; then
    print_info "Using AWS Profile: $AWS_PROFILE"
fi
print_info "Region: $REGION"

# Check if stack exists
print_info "Checking if infrastructure stack exists..."
STACK_INFO=$(aws_cmd cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION 2>&1 || true)

if echo "$STACK_INFO" | grep -q "does not exist"; then
    print_error "Stack '$STACK_NAME' does not exist. Please run ./deploy.sh first to create the infrastructure."
    exit 1
fi

# Get bucket name from stack outputs
print_info "Getting S3 bucket name from CloudFormation stack..."
BUCKET_NAME=$(aws_cmd cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`WebsiteBucketName`].OutputValue' \
    --output text)

if [ -z "$BUCKET_NAME" ]; then
    print_error "Could not retrieve bucket name from stack outputs."
    exit 1
fi

print_info "Target bucket: $BUCKET_NAME"

# Get CloudFront distribution ID
print_info "Getting CloudFront distribution ID..."
DISTRIBUTION_ID=$(aws_cmd cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
    --output text)

print_info "CloudFront Distribution ID: $DISTRIBUTION_ID"

# Build the React app
print_step "Building React application..."
cd ..
npm run build

if [ $? -ne 0 ]; then
    print_error "Build failed!"
    exit 1
fi

if [ ! -d "$BUILD_DIR" ]; then
    print_error "Build directory '$BUILD_DIR' not found!"
    exit 1
fi

print_info "Build completed successfully!"

# Sync files to S3
print_step "Uploading files to S3..."
aws_cmd s3 sync $BUILD_DIR s3://$BUCKET_NAME/ \
    --region $REGION \
    --delete \
    --cache-control "public, max-age=31536000" \
    --exclude "index.html" \
    --exclude "*.map"

# Upload index.html with no-cache
aws_cmd s3 cp $BUILD_DIR/index.html s3://$BUCKET_NAME/index.html \
    --region $REGION \
    --cache-control "no-cache, no-store, must-revalidate" \
    --content-type "text/html"

print_info "Files uploaded successfully!"

# Invalidate CloudFront cache
print_step "Invalidating CloudFront cache..."
INVALIDATION_ID=$(aws_cmd cloudfront create-invalidation \
    --distribution-id $DISTRIBUTION_ID \
    --paths "/*" \
    --query 'Invalidation.Id' \
    --output text)

print_info "CloudFront invalidation created: $INVALIDATION_ID"
print_warning "Cache invalidation may take a few minutes to complete."

# Get URLs
print_step "Deployment complete! Your app is available at:"
echo ""
aws_cmd cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontURL`].[OutputKey,OutputValue]' \
    --output table

echo ""
print_info "CloudFront URL: https://$(aws_cmd cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontURL`].OutputValue' \
    --output text)"
