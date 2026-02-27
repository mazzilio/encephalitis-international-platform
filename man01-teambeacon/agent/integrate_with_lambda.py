#!/usr/bin/env python3
"""
Automatically integrate the agent with your existing Lambda function
"""

import sys
import os

def update_lambda_handler(agent_id, alias_id):
    """Update unified_handler.py to use the agent"""
    
    # Get the script directory and project root
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    lambda_file = os.path.join(project_root, "lambda", "unified_handler.py")
    
    # Check if file exists
    if not os.path.exists(lambda_file):
        print(f"❌ Lambda file not found: {lambda_file}")
        print(f"   Make sure you're running this from the agent/ directory")
        print(f"   and that lambda/unified_handler.py exists")
        return False
    
    # Read current file
    with open(lambda_file, 'r') as f:
        content = f.read()
    
    # Check if already integrated
    if 'bedrock_agent_runtime' in content:
        print("⚠️  Lambda already has agent integration")
        print(f"   File: {lambda_file}")
        return True
    
    # Add agent client initialization after bedrock_client
    agent_init = f'''
# Bedrock Agent Runtime client for agent-based classification
bedrock_agent_runtime = boto3.client("bedrock-agent-runtime", region_name=os.environ.get('BEDROCK_REGION', 'us-west-2'))

# Agent configuration
AGENT_ID = "{agent_id}"
ALIAS_ID = "{alias_id}"
USE_AGENT = os.environ.get('USE_AGENT', 'true').lower() == 'true'
'''
    
    content = content.replace(
        'bedrock_client = boto3.client("bedrock-runtime"',
        'bedrock_client = boto3.client("bedrock-runtime"' + agent_init
    )
    
    # Add agent classification function before classify_user_input
    agent_function = '''
def classify_with_agent(event):
    """
    Classify user input using Bedrock Agent Core.
    Falls back to direct Bedrock call if agent fails.
    """
    from datetime import datetime
    
    user_query = event.get('userQuery', '')
    user_role = event.get('userRole', '')
    user_data = event.get('userData', {})
    
    # Build context for agent
    context = f"""User Role: {user_role}
User Query: {user_query}
User Data: {json.dumps(user_data)}

Classify this query into relevant tags."""
    
    try:
        print(f"🤖 [AGENT] Invoking agent {AGENT_ID}")
        
        response = bedrock_agent_runtime.invoke_agent(
            agentId=AGENT_ID,
            agentAliasId=ALIAS_ID,
            sessionId=f"session-{datetime.now().timestamp()}",
            inputText=context
        )
        
        # Collect response
        result = ""
        for event_item in response['completion']:
            if 'chunk' in event_item:
                chunk = event_item['chunk']
                if 'bytes' in chunk:
                    result += chunk['bytes'].decode('utf-8')
        
        print(f"📦 [AGENT] Response: {result[:200]}...")
        
        # Try to parse as JSON
        try:
            classification = json.loads(result)
            
            # Validate structure
            if not isinstance(classification, dict):
                raise ValueError("Classification is not a dict")
            
            # Ensure all required keys exist
            classification.setdefault('personas', [])
            classification.setdefault('types', [])
            classification.setdefault('stages', [])
            classification.setdefault('topics', [])
            
            print(f"✅ [AGENT] Classification successful")
            return classification
            
        except (json.JSONDecodeError, ValueError) as e:
            print(f"⚠️  [AGENT] Failed to parse response: {e}")
            print(f"   Falling back to direct Bedrock classification")
            return classify_user_input(event)
        
    except Exception as e:
        print(f"❌ [AGENT] Error: {str(e)}")
        print(f"   Falling back to direct Bedrock classification")
        return classify_user_input(event)


'''
    
    content = content.replace(
        'def classify_user_input(event):',
        agent_function + '\ndef classify_user_input(event):'
    )
    
    # Update lambda_handler to use agent
    old_classify_call = 'classification = classify_user_input(event)'
    new_classify_call = '''# Use agent if enabled, otherwise use direct Bedrock
        if USE_AGENT:
            classification = classify_with_agent(event)
        else:
            classification = classify_user_input(event)'''
    
    content = content.replace(old_classify_call, new_classify_call)
    
    # Write updated file
    with open(lambda_file, 'w') as f:
        f.write(content)
    
    print(f"✅ Updated {lambda_file}")
    print(f"\nAgent integration complete!")
    print(f"\nTo enable/disable agent:")
    print(f"  Set environment variable USE_AGENT=true (enabled)")
    print(f"  Set environment variable USE_AGENT=false (disabled)")
    
    return True


def main():
    if len(sys.argv) != 3:
        print("Usage: python integrate_with_lambda.py <agent_id> <alias_id>")
        print("\nGet these values by running: python quick_start_agent.py")
        sys.exit(1)
    
    agent_id = sys.argv[1]
    alias_id = sys.argv[2]
    
    print(f"🔧 Integrating agent into Lambda...")
    print(f"   Agent ID: {agent_id}")
    print(f"   Alias ID: {alias_id}")
    print()
    
    success = update_lambda_handler(agent_id, alias_id)
    
    if not success:
        print("\n❌ Integration failed")
        sys.exit(1)
    
    print("\n" + "="*60)
    print("✅ INTEGRATION COMPLETE!")
    print("="*60)
    print("\nNext steps:")
    print("1. Deploy your Lambda: cd infra && ./deploy.sh -p hackathon")
    print("2. Test the API: cd test/categorise && ./test-api.sh")
    print("3. Check logs to see agent in action")
    print("\nTo disable agent and use original logic:")
    print("  Set USE_AGENT=false in Lambda environment variables")


if __name__ == "__main__":
    main()
