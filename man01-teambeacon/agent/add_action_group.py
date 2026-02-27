#!/usr/bin/env python3
"""
Add DynamoDB action group to the Agent Core agent
"""

import boto3
import json
import argparse
import time
import zipfile
import io

# Parse arguments
parser = argparse.ArgumentParser(description='Add action group to agent')
parser.add_argument('--profile', '-p', help='AWS profile name', default=None)
parser.add_argument('--region', '-r', help='AWS region', default='us-west-2')
parser.add_argument('--agent-id', required=True, help='Agent ID')
args = parser.parse_args()

# Initialize session
if args.profile:
    session = boto3.Session(profile_name=args.profile)
    print(f"Using AWS profile: {args.profile}\n")
else:
    session = boto3.Session()

bedrock_agent = session.client('bedrock-agent', region_name=args.region)
lambda_client = session.client('lambda', region_name=args.region)
iam = session.client('iam')
sts = session.client('sts')

account_id = sts.get_caller_identity()['Account']

print("🔧 Adding Action Group to Agent\n")
print("=" * 60)

# Step 1: Create Lambda execution role
print("\n📋 Step 1: Creating Lambda execution role...")

lambda_role_name = "TeamBeaconActionGroupLambdaRole"
lambda_trust_policy = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "lambda.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}

try:
    lambda_role_response = iam.create_role(
        RoleName=lambda_role_name,
        AssumeRolePolicyDocument=json.dumps(lambda_trust_policy),
        Description="Execution role for TeamBeacon action group Lambda"
    )
    lambda_role_arn = lambda_role_response['Role']['Arn']
    print(f"✅ Created role: {lambda_role_arn}")
    time.sleep(10)
    
except iam.exceptions.EntityAlreadyExistsException:
    lambda_role_arn = f"arn:aws:iam::{account_id}:role/{lambda_role_name}"
    print(f"✅ Role already exists: {lambda_role_arn}")

# Attach policies
print("   Attaching policies...")

# Basic Lambda execution
try:
    iam.attach_role_policy(
        RoleName=lambda_role_name,
        PolicyArn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
    )
    print("   ✅ Attached Lambda basic execution policy")
except Exception as e:
    print(f"   ⚠️  {e}")

# DynamoDB access
dynamodb_policy = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:Scan",
                "dynamodb:Query",
                "dynamodb:GetItem"
            ],
            "Resource": f"arn:aws:dynamodb:{args.region}:{account_id}:table/ContentMetadata"
        }
    ]
}

try:
    iam.put_role_policy(
        RoleName=lambda_role_name,
        PolicyName="DynamoDBAccess",
        PolicyDocument=json.dumps(dynamodb_policy)
    )
    print("   ✅ Attached DynamoDB access policy")
except Exception as e:
    print(f"   ⚠️  {e}")

# Step 2: Create Lambda function
print("\n📋 Step 2: Creating Lambda function...")

# Create deployment package
print("   Creating deployment package...")
zip_buffer = io.BytesIO()
with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
    with open('action_group_lambda.py', 'r') as f:
        zip_file.writestr('lambda_function.py', f.read())

zip_buffer.seek(0)
lambda_code = zip_buffer.read()

lambda_name = "TeamBeacon-ActionGroup-QueryContent"

try:
    lambda_response = lambda_client.create_function(
        FunctionName=lambda_name,
        Runtime='python3.12',
        Role=lambda_role_arn,
        Handler='lambda_function.lambda_handler',
        Code={'ZipFile': lambda_code},
        Description='Action group for querying TeamBeacon content',
        Timeout=30,
        MemorySize=256,
        Environment={
            'Variables': {
                'DYNAMODB_TABLE_NAME': 'ContentMetadata'
            }
        }
    )
    
    lambda_arn = lambda_response['FunctionArn']
    print(f"✅ Created Lambda: {lambda_arn}")
    
except lambda_client.exceptions.ResourceConflictException:
    # Update existing function
    print("   Function exists, updating code...")
    lambda_client.update_function_code(
        FunctionName=lambda_name,
        ZipFile=lambda_code
    )
    
    lambda_arn = f"arn:aws:lambda:{args.region}:{account_id}:function:{lambda_name}"
    print(f"✅ Updated Lambda: {lambda_arn}")

# Wait for Lambda to be ready
print("   Waiting for Lambda to be ready...")
time.sleep(5)

# Step 3: Grant Bedrock permission to invoke Lambda
print("\n📋 Step 3: Granting Bedrock permission to invoke Lambda...")

statement_id = "AllowBedrockAgentInvoke"

try:
    lambda_client.add_permission(
        FunctionName=lambda_name,
        StatementId=statement_id,
        Action='lambda:InvokeFunction',
        Principal='bedrock.amazonaws.com',
        SourceArn=f"arn:aws:bedrock:{args.region}:{account_id}:agent/{args.agent_id}"
    )
    print("✅ Permission granted")
except lambda_client.exceptions.ResourceConflictException:
    print("✅ Permission already exists")

# Step 4: Define action group schema
print("\n📋 Step 4: Creating action group schema...")

action_group_schema = {
    "openapi": "3.0.0",
    "info": {
        "title": "TeamBeacon Content Query API",
        "version": "1.0.0",
        "description": "API for querying TeamBeacon content by tags"
    },
    "paths": {
        "/query_content": {
            "post": {
                "summary": "Query content by tags",
                "description": "Search for content matching specified personas, types, stages, and topics",
                "operationId": "queryContent",
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "personas": {
                                        "type": "string",
                                        "description": "Comma-separated persona tags (e.g., 'persona:patient,persona:caregiver')"
                                    },
                                    "types": {
                                        "type": "string",
                                        "description": "Comma-separated type tags (e.g., 'type:autoimmune,type:infectious')"
                                    },
                                    "stages": {
                                        "type": "string",
                                        "description": "Comma-separated stage tags (e.g., 'stage:early_recovery')"
                                    },
                                    "topics": {
                                        "type": "string",
                                        "description": "Comma-separated topic tags (e.g., 'topic:memory,topic:fatigue')"
                                    },
                                    "limit": {
                                        "type": "string",
                                        "description": "Maximum number of results to return (default: 10)"
                                    }
                                }
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Successful query",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "items": {
                                            "type": "array",
                                            "description": "Array of matching content items"
                                        },
                                        "count": {
                                            "type": "integer",
                                            "description": "Number of items returned"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

# Step 5: Create action group
print("\n📋 Step 5: Adding action group to agent...")

action_group_name = "QueryContentActionGroup"

try:
    action_group_response = bedrock_agent.create_agent_action_group(
        agentId=args.agent_id,
        agentVersion='DRAFT',
        actionGroupName=action_group_name,
        description='Query TeamBeacon content database',
        actionGroupExecutor={
            'lambda': lambda_arn
        },
        apiSchema={
            'payload': json.dumps(action_group_schema)
        },
        actionGroupState='ENABLED'
    )
    
    print(f"✅ Created action group: {action_group_name}")
    
except Exception as e:
    print(f"❌ Error creating action group: {e}")
    import traceback
    traceback.print_exc()

# Step 6: Prepare agent
print("\n📋 Step 6: Preparing agent with action group...")

try:
    prepare_response = bedrock_agent.prepare_agent(agentId=args.agent_id)
    print(f"✅ Agent status: {prepare_response['agentStatus']}")
    
    print("   Waiting for agent to be prepared...")
    time.sleep(15)
    
    agent_info = bedrock_agent.get_agent(agentId=args.agent_id)
    print(f"   Final status: {agent_info['agent']['agentStatus']}")
    
except Exception as e:
    print(f"❌ Error preparing agent: {e}")

# Summary
print("\n" + "=" * 60)
print("✅ Action Group Added Successfully!")
print("=" * 60)
print(f"\nLambda ARN: {lambda_arn}")
print(f"Action Group: {action_group_name}")
print(f"\n🧪 Test the agent with:")
print(f"   python3 test_agent.py --profile {args.profile or 'default'} --agent-id {args.agent_id} --alias-id TSTALIASID")
print(f"\n💬 Try asking: 'Find resources for patients with memory issues'")
