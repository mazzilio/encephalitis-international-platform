#!/bin/bash

# CloudFormation Stack Deployment Script
set -e

# Configuration
STACK_NAME="hack-frontend-app-stack"
TEMPLATE_FILE="template.yaml"
REGION="${AWS_REGION:-us-west-2}"
ENVIRONMENT="${ENVIRONMENT:-dev}"
PROJECT_NAME="hack-frontend-app"
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
NC='\033[0m' # No Color

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

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if template file exists
if [ ! -f "$TEMPLATE_FILE" ]; then
    print_error "Template file '$TEMPLATE_FILE' not found!"
    exit 1
fi

# Display configuration
if [ -n "$AWS_PROFILE" ]; then
    print_info "Using AWS Profile: $AWS_PROFILE"
fi
print_info "Region: $REGION"
print_info "Environment: $ENVIRONMENT"

# Validate the template
print_info "Validating CloudFormation template..."
aws_cmd cloudformation validate-template \
    --template-body file://$TEMPLATE_FILE \
    --region $REGION > /dev/null

if [ $? -eq 0 ]; then
    print_info "Template validation successful!"
else
    print_error "Template validation failed!"
    exit 1
fi

# Check if stack exists
print_info "Checking if stack exists..."
STACK_EXISTS=$(aws_cmd cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION 2>&1 || true)

if echo "$STACK_EXISTS" | grep -q "does not exist"; then
    print_info "Stack does not exist. Creating new stack..."
    OPERATION="create-stack"
else
    print_info "Stack exists. Updating stack..."
    OPERATION="update-stack"
fi

# Deploy the stack
print_info "Deploying stack '$STACK_NAME' in region '$REGION'..."
aws_cmd cloudformation $OPERATION \
    --stack-name $STACK_NAME \
    --template-body file://$TEMPLATE_FILE \
    --parameters \
        ParameterKey=Environment,ParameterValue=$ENVIRONMENT \
        ParameterKey=ProjectName,ParameterValue=$PROJECT_NAME \
    --region $REGION \
    --capabilities CAPABILITY_IAM

if [ $? -ne 0 ]; then
    if [ "$OPERATION" = "update-stack" ]; then
        print_warning "No updates to be performed or update failed."
    else
        print_error "Stack creation failed!"
        exit 1
    fi
fi

# Wait for stack operation to complete
print_info "Waiting for stack operation to complete..."
if [ "$OPERATION" = "create-stack" ]; then
    aws_cmd cloudformation wait stack-create-complete \
        --stack-name $STACK_NAME \
        --region $REGION
else
    aws_cmd cloudformation wait stack-update-complete \
        --stack-name $STACK_NAME \
        --region $REGION 2>&1 || true
fi

# Get stack outputs
print_info "Stack operation completed! Fetching outputs..."
aws_cmd cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs' \
    --output table

print_info "Deployment complete!"
