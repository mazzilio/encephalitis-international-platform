#!/usr/bin/env python3
"""
Create a basic Bedrock Agent Core agent with DynamoDB action group
This is a minimal starting point - we'll add more features incrementally
"""

import boto3
import json
import argparse
import time

# Parse arguments
parser = argparse.ArgumentParser(description='Create basic Agent Core agent')
parser.add_argument('--profile', '-p', help='AWS profile name', default=None)
parser.add_argument('--region', '-r', help='AWS region', default='us-west-2')
args = parser.parse_args()

# Initialize session
if args.profile:
    session = boto3.Session(profile_name=args.profile)
    print(f"Using AWS profile: {args.profile}\n")
else:
    session = boto3.Session()

bedrock_agent = session.client('bedrock-agent', region_name=args.region)
iam = session.client('iam')
sts = session.client('sts')

# Get account ID
account_id = sts.get_caller_identity()['Account']

print("🚀 Creating Basic Agent Core Setup\n")
print("=" * 60)

# Step 1: Create IAM role for the agent
print("\n📋 Step 1: Creating IAM role for agent...")

role_name = "TeamBeaconAgentCoreRole"
trust_policy = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "bedrock.amazonaws.com"
            },
            "Action": "sts:AssumeRole",
            "Condition": {
                "StringEquals": {
                    "aws:SourceAccount": account_id
                },
                "ArnLike": {
                    "aws:SourceArn": f"arn:aws:bedrock:{args.region}:{account_id}:agent/*"
                }
            }
        }
    ]
}

try:
    role_response = iam.create_role(
        RoleName=role_name,
        AssumeRolePolicyDocument=json.dumps(trust_policy),
        Description="Role for TeamBeacon Agent Core"
    )
    role_arn = role_response['Role']['Arn']
    print(f"✅ Created role: {role_arn}")
    
    # Wait for role to propagate
    print("   Waiting for role to propagate...")
    time.sleep(10)
    
except iam.exceptions.EntityAlreadyExistsException:
    role_arn = f"arn:aws:iam::{account_id}:role/{role_name}"
    print(f"✅ Role already exists: {role_arn}")

# Step 2: Attach policies to role
print("\n📋 Step 2: Attaching policies to role...")

# Policy for invoking foundation models
model_policy = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "bedrock:InvokeModel"
            ],
            "Resource": [
                f"arn:aws:bedrock:{args.region}::foundation-model/*"
            ]
        }
    ]
}

try:
    iam.put_role_policy(
        RoleName=role_name,
        PolicyName="BedrockModelInvoke",
        PolicyDocument=json.dumps(model_policy)
    )
    print("✅ Attached Bedrock model invoke policy")
except Exception as e:
    print(f"⚠️  Policy attachment: {e}")

# Step 3: Create the agent
print("\n📋 Step 3: Creating Agent Core agent...")

agent_name = "TeamBeacon-AgentCore-Basic"
agent_instruction = """You are a helpful assistant for TeamBeacon, a charity supporting people affected by encephalitis.

Your role is to:
1. Understand user queries about encephalitis support, resources, and information
2. Classify queries into relevant categories (personas, types, stages, topics)
3. Query the content database to find relevant resources
4. Provide helpful, empathetic responses

When a user asks a question:
- First understand their role (patient, caregiver, parent, professional)
- Identify relevant topics from their query
- Use the query_content action to search for relevant resources
- Present the results in a helpful, organized way

Be compassionate, clear, and supportive in all interactions."""

try:
    agent_response = bedrock_agent.create_agent(
        agentName=agent_name,
        foundationModel="us.anthropic.claude-sonnet-4-5-20250929-v1:0",
        instruction=agent_instruction,
        agentResourceRoleArn=role_arn,
        description="Basic Agent Core for TeamBeacon content classification and retrieval"
    )
    
    agent_id = agent_response['agent']['agentId']
    print(f"✅ Created agent: {agent_id}")
    print(f"   Name: {agent_name}")
    
except Exception as e:
    print(f"❌ Error creating agent: {e}")
    exit(1)

# Step 4: Create Lambda for action group
print("\n📋 Step 4: Creating Lambda function for DynamoDB queries...")
print("   (This will be created in the next step)")
print("   For now, we'll prepare the agent without action groups")

# Step 5: Prepare the agent
print("\n📋 Step 5: Preparing agent...")

try:
    prepare_response = bedrock_agent.prepare_agent(agentId=agent_id)
    print(f"✅ Agent status: {prepare_response['agentStatus']}")
    
    # Wait for preparation
    print("   Waiting for agent to be prepared...")
    time.sleep(15)
    
    # Check status
    agent_info = bedrock_agent.get_agent(agentId=agent_id)
    print(f"   Final status: {agent_info['agent']['agentStatus']}")
    
except Exception as e:
    print(f"❌ Error preparing agent: {e}")

# Step 6: Create alias
print("\n📋 Step 6: Creating agent alias...")

try:
    alias_response = bedrock_agent.create_agent_alias(
        agentId=agent_id,
        agentAliasName="live",
        description="Live alias for production use"
    )
    
    alias_id = alias_response['agentAlias']['agentAliasId']
    print(f"✅ Created alias: {alias_id}")
    
    # Wait for alias to be ready
    print("   Waiting for alias to be ready...")
    time.sleep(10)
    
except Exception as e:
    print(f"❌ Error creating alias: {e}")
    alias_id = "TSTALIASID"
    print(f"   Using test alias: {alias_id}")

# Summary
print("\n" + "=" * 60)
print("✅ Basic Agent Core Setup Complete!")
print("=" * 60)
print(f"\nAgent ID: {agent_id}")
print(f"Alias ID: {alias_id}")
print(f"Role ARN: {role_arn}")
print(f"\n📝 Save these values - you'll need them!")

# Save to file
output = {
    "agent_id": agent_id,
    "alias_id": alias_id,
    "role_arn": role_arn,
    "agent_name": agent_name,
    "region": args.region
}

with open('agent_core_output.json', 'w') as f:
    json.dump(output, f, indent=2)

print(f"\n💾 Configuration saved to: agent_core_output.json")

print("\n🧪 Test the agent:")
print(f"   python3 test_agent.py --profile {args.profile or 'default'} --agent-id {agent_id} --alias-id {alias_id}")

print("\n📋 Next Steps:")
print("   1. Test the basic agent")
print("   2. Create Lambda function for DynamoDB queries")
print("   3. Add action group to agent")
print("   4. Add more features incrementally")
