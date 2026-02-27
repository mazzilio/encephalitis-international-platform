#!/bin/bash

# Deploy pre-built app to S3/CloudFront (without rebuilding)
set -e

# Configuration
STACK_NAME="frontend-app-stack"
REGION="${AWS_REGION:-us-west-2}"
BUILD_DIR="../dist"
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
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Display configuration
if [ -n "$AWS_PROFILE" ]; then
    print_info "Using AWS Profile: $AWS_PROFILE"
fi
print_info "Region: $REGION"

# Check if build directory exists
if [ ! -d "$BUILD_DIR" ]; then
    print_error "Build directory '$BUILD_DIR' not found! Run 'npm run build' first."
    exit 1
fi

# Get bucket name
print_info "Getting S3 bucket name..."
BUCKET_NAME=$(aws_cmd cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`WebsiteBucketName`].OutputValue' \
    --output text)

# Get CloudFront distribution ID
DISTRIBUTION_ID=$(aws_cmd cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
    --output text)

# Upload to S3
print_info "Uploading to S3..."
aws_cmd s3 sync $BUILD_DIR s3://$BUCKET_NAME/ \
    --region $REGION \
    --delete \
    --cache-control "public, max-age=31536000" \
    --exclude "index.html"

aws_cmd s3 cp $BUILD_DIR/index.html s3://$BUCKET_NAME/index.html \
    --region $REGION \
    --cache-control "no-cache, no-store, must-revalidate" \
    --content-type "text/html"

# Invalidate CloudFront
print_info "Invalidating CloudFront cache..."
aws_cmd cloudfront create-invalidation \
    --distribution-id $DISTRIBUTION_ID \
    --paths "/*" > /dev/null

print_info "Deployment complete!"
