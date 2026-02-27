#!/usr/bin/env python3
"""
Quick Start: Bedrock Agent Core for TeamBeacon
Creates a minimal agent to test classification capabilities
"""

import boto3
import json
import time
import sys
import argparse
from datetime import datetime

def get_boto3_session(profile_name=None):
    """Create boto3 session with optional profile"""
    if profile_name:
        return boto3.Session(profile_name=profile_name)
    return boto3.Session()

# Parse arguments
parser = argparse.ArgumentParser(description='Create Bedrock Agent for TeamBeacon')
parser.add_argument('--profile', '-p', help='AWS profile name', default=None)
parser.add_argument('--region', '-r', help='AWS region', default='us-west-2')
args = parser.parse_args()

# Initialize session and clients
session = get_boto3_session(args.profile)
bedrock_agent = session.client('bedrock-agent', region_name=args.region)
bedrock_agent_runtime = session.client('bedrock-agent-runtime', region_name=args.region)
iam = session.client('iam')
lambda_client = session.client('lambda')

# Print profile info
if args.profile:
    print(f"Using AWS profile: {args.profile}")
    print(f"Region: {args.region}\n")

AGENT_NAME = "TeamBeaconQuickStartAgent"
FOUNDATION_MODEL = "anthropic.claude-sonnet-4-5-20250929-v1:0"

def create_agent_role():
    """Create IAM role for the agent"""
    role_name = f"{AGENT_NAME}Role"
    
    trust_policy = {
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "bedrock.amazonaws.com"},
            "Action": "sts:AssumeRole"
        }]
    }
    
    try:
        response = iam.create_role(
            RoleName=role_name,
            AssumeRolePolicyDocument=json.dumps(trust_policy),
            Description="Role for TeamBeacon Bedrock Agent"
        )
        role_arn = response['Role']['Arn']
        print(f"✅ Created IAM role: {role_arn}")
        
        # Attach basic Bedrock policy
        iam.attach_role_policy(
            RoleName=role_name,
            PolicyArn='arn:aws:iam::aws:policy/AmazonBedrockFullAccess'
        )
        
        # Wait for role to propagate
        time.sleep(10)
        return role_arn
        
    except iam.exceptions.EntityAlreadyExistsException:
        response = iam.get_role(RoleName=role_name)
        print(f"✅ Using existing IAM role: {response['Role']['Arn']}")
        return response['Role']['Arn']


def create_classification_lambda():
    """Create a simple Lambda function for classification"""
    function_name = f"{AGENT_NAME}ClassifyFunction"
    
    # Simple classification logic
    lambda_code = '''
import json

def lambda_handler(event, context):
    """Simple classification function"""
    
    # Extract parameters from agent
    parameters = event.get('parameters', [])
    user_query = next((p['value'] for p in parameters if p['name'] == 'userQuery'), '')
    user_role = next((p['value'] for p in parameters if p['name'] == 'userRole'), '')
    
    # Simple rule-based classification
    classification = {
        "personas": [f"persona:{user_role}"] if user_role else [],
        "types": [],
        "stages": [],
        "topics": []
    }
    
    # Detect topics from query
    query_lower = user_query.lower()
    if 'memory' in query_lower:
        classification['topics'].append('topic:memory')
    if 'school' in query_lower:
        classification['topics'].append('topic:school')
    if 'legal' in query_lower:
        classification['topics'].append('topic:legal')
    if 'travel' in query_lower:
        classification['topics'].append('topic:travel')
    
    # Detect stages
    if 'hospital' in query_lower or 'acute' in query_lower:
        classification['stages'].append('stage:acute_hospital')
    elif 'recovery' in query_lower:
        classification['stages'].append('stage:early_recovery')
    elif 'long term' in query_lower or 'ongoing' in query_lower:
        classification['stages'].append('stage:long_term_management')
    
    return {
        'statusCode': 200,
        'body': json.dumps(classification)
    }
'''
    
    # Create Lambda function
    try:
        # Create deployment package
        import zipfile
        import io
        
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            zip_file.writestr('lambda_function.py', lambda_code)
        
        zip_buffer.seek(0)
        
        # Create or update function
        try:
            response = lambda_client.create_function(
                FunctionName=function_name,
                Runtime='python3.11',
                Role='arn:aws:iam::YOUR_ACCOUNT:role/lambda-execution-role',  # You'll need to update this
                Handler='lambda_function.lambda_handler',
                Code={'ZipFile': zip_buffer.read()},
                Timeout=30,
                MemorySize=256
            )
            function_arn = response['FunctionArn']
            print(f"✅ Created Lambda function: {function_arn}")
            
        except lambda_client.exceptions.ResourceConflictException:
            response = lambda_client.get_function(FunctionName=function_name)
            function_arn = response['Configuration']['FunctionArn']
            print(f"✅ Using existing Lambda function: {function_arn}")
        
        return function_arn
        
    except Exception as e:
        print(f"⚠️  Lambda creation skipped: {e}")
        print("   You can add Lambda tools later")
        return None


def create_agent(role_arn):
    """Create the Bedrock Agent"""
    
    instruction = """You are an AI agent for TeamBeacon, a support platform for encephalitis patients, 
caregivers, parents, and professionals. 

Your role is to classify user queries into relevant tags:
- Personas: patient, caregiver, parent, professional
- Types: infectious, autoimmune, HSV, NMDA, LGI1
- Stages: pre_diagnosis, acute_hospital, early_recovery, long_term_management
- Topics: memory, behaviour, legal, school, travel, research

Analyze the user's query and profile data to assign all relevant tags."""
    
    try:
        response = bedrock_agent.create_agent(
            agentName=AGENT_NAME,
            foundationModel=FOUNDATION_MODEL,
            instruction=instruction,
            agentResourceRoleArn=role_arn,
            idleSessionTTLInSeconds=600
        )
        
        agent_id = response['agent']['agentId']
        print(f"✅ Created agent: {agent_id}")
        return agent_id
        
    except bedrock_agent.exceptions.ConflictException:
        # Agent already exists, get it
        response = bedrock_agent.list_agents()
        for agent in response['agentSummaries']:
            if agent['agentName'] == AGENT_NAME:
                agent_id = agent['agentId']
                print(f"✅ Using existing agent: {agent_id}")
                return agent_id
        raise


def prepare_agent(agent_id):
    """Prepare the agent for use"""
    print("🔄 Preparing agent...")
    
    response = bedrock_agent.prepare_agent(agentId=agent_id)
    
    # Wait for preparation
    while True:
        status_response = bedrock_agent.get_agent(agentId=agent_id)
        status = status_response['agent']['agentStatus']
        
        if status == 'PREPARED':
            print("✅ Agent prepared and ready!")
            break
        elif status == 'FAILED':
            print("❌ Agent preparation failed")
            return False
        
        print(f"   Status: {status}...")
        time.sleep(5)
    
    return True


def create_agent_alias(agent_id):
    """Create an alias for the agent"""
    alias_name = "live"
    
    try:
        response = bedrock_agent.create_agent_alias(
            agentId=agent_id,
            agentAliasName=alias_name
        )
        alias_id = response['agentAlias']['agentAliasId']
        print(f"✅ Created agent alias: {alias_id}")
        return alias_id
        
    except bedrock_agent.exceptions.ConflictException:
        response = bedrock_agent.list_agent_aliases(agentId=agent_id)
        for alias in response['agentAliasSummaries']:
            if alias['agentAliasName'] == alias_name:
                alias_id = alias['agentAliasId']
                print(f"✅ Using existing alias: {alias_id}")
                return alias_id
        raise


def test_agent(agent_id, alias_id):
    """Test the agent with a sample query"""
    print("\n🧪 Testing agent with sample query...")
    
    test_query = "I'm a patient experiencing memory issues during my recovery"
    
    try:
        response = bedrock_agent_runtime.invoke_agent(
            agentId=agent_id,
            agentAliasId=alias_id,
            sessionId=f"test-{datetime.now().timestamp()}",
            inputText=test_query
        )
        
        # Collect response
        result = ""
        for event in response['completion']:
            if 'chunk' in event:
                chunk = event['chunk']
                if 'bytes' in chunk:
                    result += chunk['bytes'].decode('utf-8')
        
        print(f"\n📥 Query: {test_query}")
        print(f"📤 Response: {result}")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False


def main():
    """Main setup function"""
    print("🚀 TeamBeacon Agent Quick Start\n")
    
    # Verify AWS credentials
    try:
        sts = session.client('sts')
        identity = sts.get_caller_identity()
        print(f"✅ AWS Account: {identity['Account']}")
        print(f"   User/Role: {identity['Arn']}\n")
    except Exception as e:
        print(f"❌ AWS credentials error: {e}")
        print("   Please configure AWS credentials or specify a profile with --profile")
        return
    
    try:
        # Step 1: Create IAM role
        print("Step 1: Creating IAM role...")
        role_arn = create_agent_role()
        
        # Step 2: Create agent
        print("\nStep 2: Creating Bedrock Agent...")
        agent_id = create_agent(role_arn)
        
        # Step 3: Prepare agent
        print("\nStep 3: Preparing agent...")
        if not prepare_agent(agent_id):
            return
        
        # Step 4: Create alias
        print("\nStep 4: Creating agent alias...")
        alias_id = create_agent_alias(agent_id)
        
        # Step 5: Test agent
        print("\nStep 5: Testing agent...")
        test_agent(agent_id, alias_id)
        
        # Success!
        print("\n" + "="*60)
        print("✅ AGENT READY!")
        print("="*60)
        print(f"\nAgent ID: {agent_id}")
        print(f"Alias ID: {alias_id}")
        print(f"Region: {args.region}")
        if args.profile:
            print(f"Profile: {args.profile}")
        print(f"\nYou can now invoke this agent from your Lambda function!")
        print(f"\nNext steps:")
        print(f"1. Update lambda/unified_handler.py to use agent_id: {agent_id}")
        print(f"2. Test with: python agent/test_agent.py --profile {args.profile or 'default'}")
        print(f"3. See full spec in .kiro/specs/bedrock-agent-core/ for advanced features")
        
    except Exception as e:
        print(f"\n❌ Setup failed: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
