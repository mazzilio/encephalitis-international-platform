#!/bin/bash
# Setup script for basic Agent Core deployment

set -e

PROFILE=""
REGION="us-west-2"

# Parse arguments
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
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [-p|--profile PROFILE] [-r|--region REGION]"
            exit 1
            ;;
    esac
done

echo "🚀 TeamBeacon Agent Core Setup"
echo "================================"
echo ""

# Build profile args
PROFILE_ARG=""
if [ -n "$PROFILE" ]; then
    PROFILE_ARG="--profile $PROFILE"
    echo "Using AWS profile: $PROFILE"
fi
echo "Using region: $REGION"
echo ""

# Step 1: Create basic agent
echo "📋 Step 1: Creating basic Agent Core agent..."
python3 agent_core_basic.py $PROFILE_ARG --region $REGION

if [ ! -f "agent_core_output.json" ]; then
    echo "❌ Failed to create agent"
    exit 1
fi

# Extract agent ID
AGENT_ID=$(python3 -c "import json; print(json.load(open('agent_core_output.json'))['agent_id'])")
echo "✅ Agent created: $AGENT_ID"
echo ""

# Step 2: Add action group
echo "📋 Step 2: Adding DynamoDB action group..."
python3 add_action_group.py $PROFILE_ARG --region $REGION --agent-id $AGENT_ID

echo ""
echo "================================"
echo "✅ Setup Complete!"
echo "================================"
echo ""
echo "Agent ID: $AGENT_ID"
echo "Test Alias: TSTALIASID"
echo ""
echo "🧪 Test the agent:"
echo "   python3 test_agent.py $PROFILE_ARG --agent-id $AGENT_ID --alias-id TSTALIASID"
echo ""
echo "📝 Configuration saved to: agent_core_output.json"
