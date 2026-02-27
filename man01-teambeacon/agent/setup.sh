#!/bin/bash
# One-command setup for Bedrock Agent

set -e

# Parse arguments
PROFILE=""
REGION="us-west-2"

while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--profile)
            PROFILE="$2"
            shift 2
            ;;
        -r|--region)
            REGION="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: ./setup.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -p, --profile PROFILE    AWS profile name (default: none)"
            echo "  -r, --region REGION      AWS region (default: us-west-2)"
            echo "  -h, --help              Show this help message"
            echo ""
            echo "Examples:"
            echo "  ./setup.sh                          # Use default credentials"
            echo "  ./setup.sh -p hackathon             # Use 'hackathon' profile"
            echo "  ./setup.sh -p dev -r us-east-1      # Custom profile and region"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

echo "🚀 TeamBeacon Agent - Quick Setup"
echo "=================================="
echo ""

if [ -n "$PROFILE" ]; then
    echo "AWS Profile: $PROFILE"
    export AWS_PROFILE="$PROFILE"
fi
echo "AWS Region: $REGION"
echo ""

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.9+"
    exit 1
fi

if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install AWS CLI"
    exit 1
fi

# Verify AWS credentials
if [ -n "$PROFILE" ]; then
    if ! aws sts get-caller-identity --profile "$PROFILE" &> /dev/null; then
        echo "❌ AWS profile '$PROFILE' not found or invalid"
        echo "   Available profiles:"
        aws configure list-profiles 2>/dev/null || echo "   (none found)"
        exit 1
    fi
else
    if ! aws sts get-caller-identity &> /dev/null; then
        echo "❌ AWS credentials not configured"
        echo "   Please run 'aws configure' or use --profile option"
        exit 1
    fi
fi

echo "✅ Prerequisites OK"
echo ""

# Step 1: Create agent
echo "Step 1: Creating Bedrock Agent..."
echo "This will take about 30 seconds..."
echo ""

# Build python command with optional profile
PYTHON_CMD="python3 quick_start_agent.py --region $REGION"
if [ -n "$PROFILE" ]; then
    PYTHON_CMD="$PYTHON_CMD --profile $PROFILE"
fi

$PYTHON_CMD > agent_output.txt 2>&1

if [ $? -ne 0 ]; then
    echo "❌ Agent creation failed. Check agent_output.txt for details"
    cat agent_output.txt
    exit 1
fi

# Extract agent ID and alias ID from output
AGENT_ID=$(grep "Agent ID:" agent_output.txt | awk '{print $3}')
ALIAS_ID=$(grep "Alias ID:" agent_output.txt | awk '{print $3}')

if [ -z "$AGENT_ID" ] || [ -z "$ALIAS_ID" ]; then
    echo "❌ Could not extract agent IDs. Check agent_output.txt"
    cat agent_output.txt
    exit 1
fi

echo "✅ Agent created!"
echo "   Agent ID: $AGENT_ID"
echo "   Alias ID: $ALIAS_ID"
echo ""

# Step 2: Update test script
echo "Step 2: Updating test script..."
sed -i.bak "s/YOUR_AGENT_ID/$AGENT_ID/g" test_agent.py
sed -i.bak "s/YOUR_ALIAS_ID/$ALIAS_ID/g" test_agent.py
echo "✅ Test script updated"
echo ""

# Step 3: Integrate with Lambda
echo "Step 3: Integrating with Lambda..."
python3 integrate_with_lambda.py "$AGENT_ID" "$ALIAS_ID"
echo ""

# Success!
echo ""
echo "=================================="
echo "✅ SETUP COMPLETE!"
echo "=================================="
echo ""
echo "Your agent is ready to use!"
echo ""
echo "Quick test:"
if [ -n "$PROFILE" ]; then
    echo "  python3 test_agent.py --profile $PROFILE --agent-id $AGENT_ID --alias-id $ALIAS_ID"
else
    echo "  python3 test_agent.py --agent-id $AGENT_ID --alias-id $ALIAS_ID"
fi
echo ""
echo "Deploy to AWS:"
if [ -n "$PROFILE" ]; then
    echo "  cd ../infra && ./deploy.sh -p $PROFILE"
else
    echo "  cd ../infra && ./deploy.sh"
fi
echo ""
echo "Agent Details:"
echo "  Agent ID: $AGENT_ID"
echo "  Alias ID: $ALIAS_ID"
echo "  Region: $REGION"
if [ -n "$PROFILE" ]; then
    echo "  Profile: $PROFILE"
fi
echo ""
echo "Full spec (for advanced features):"
echo "  See .kiro/specs/bedrock-agent-core/"
echo ""
