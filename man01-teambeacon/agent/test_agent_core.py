#!/usr/bin/env python3
"""Test Agent Core with action group"""

import boto3
from datetime import datetime

session = boto3.Session(profile_name='hackathon')
bedrock_agent_runtime = session.client('bedrock-agent-runtime', region_name='us-west-2')

AGENT_ID = "TANBRPMHVE"
ALIAS_ID = "TSTALIASID"  # Test alias points to DRAFT

print("🧪 Testing Agent Core with Action Group\n")
print(f"Agent ID: {AGENT_ID}")
print(f"Alias ID: {ALIAS_ID}\n")

# Test query that should trigger the action group
query = "Find resources for patients experiencing memory issues during recovery"

print(f"Query: {query}\n")
print("Invoking agent...")
print("(This may take a moment as the agent queries DynamoDB)\n")

try:
    response = bedrock_agent_runtime.invoke_agent(
        agentId=AGENT_ID,
        agentAliasId=ALIAS_ID,
        sessionId=f"test-{datetime.now().timestamp()}",
        inputText=query,
        enableTrace=True  # Enable trace to see action group calls
    )
    
    # Collect response and traces
    result = ""
    traces = []
    
    for event in response['completion']:
        if 'chunk' in event:
            chunk = event['chunk']
            if 'bytes' in chunk:
                result += chunk['bytes'].decode('utf-8')
        
        if 'trace' in event:
            traces.append(event['trace'])
    
    print(f"✅ Response:\n{result}\n")
    
    # Show traces if available
    if traces:
        print("\n📋 Execution Trace:")
        for i, trace in enumerate(traces, 1):
            print(f"\n--- Trace {i} ---")
            print(f"{trace}")
    
except Exception as e:
    print(f"\n❌ Error: {e}\n")
    import traceback
    traceback.print_exc()
