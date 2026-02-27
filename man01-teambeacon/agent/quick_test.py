#!/usr/bin/env python3
"""Quick test of the agent"""

import boto3
from datetime import datetime

session = boto3.Session(profile_name='hackathon')
bedrock_agent_runtime = session.client('bedrock-agent-runtime', region_name='us-west-2')

AGENT_ID = "28QQU2KK4R"
ALIAS_ID = "TSTALIASID"  # Test alias points to DRAFT

print("🧪 Quick Agent Test\n")
print(f"Agent ID: {AGENT_ID}")
print(f"Alias ID: {ALIAS_ID}\n")

query = "I'm a patient experiencing memory issues after recovery"

print(f"Query: {query}\n")
print("Invoking agent...")

try:
    response = bedrock_agent_runtime.invoke_agent(
        agentId=AGENT_ID,
        agentAliasId=ALIAS_ID,
        sessionId=f"test-{datetime.now().timestamp()}",
        inputText=query
    )
    
    # Collect response
    result = ""
    for event in response['completion']:
        if 'chunk' in event:
            chunk = event['chunk']
            if 'bytes' in chunk:
                result += chunk['bytes'].decode('utf-8')
    
    print(f"\n✅ Response:\n{result}\n")
    
except Exception as e:
    print(f"\n❌ Error: {e}\n")
