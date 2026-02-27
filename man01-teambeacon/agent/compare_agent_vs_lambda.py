#!/usr/bin/env python3
"""
Compare Agent Core vs unified_handler Lambda outputs
Tests both systems with the same queries and compares results
"""

import boto3
import json
import sys
from datetime import datetime
from typing import Dict, List, Any

# Test queries to compare
TEST_QUERIES = [
    {
        "name": "Patient with memory issues",
        "query": {
            "userRole": "patient",
            "userQuery": "I'm having trouble with memory after my diagnosis",
            "userData": {
                "stage": "in_recovery",
                "recoveryStage": "early_recovery",
                "encephalitisType": "autoimmune",
                "concerns": ["memory", "behaviour"]
            }
        }
    },
    {
        "name": "Caregiver seeking support",
        "query": {
            "userRole": "caregiver",
            "userQuery": "How can I help my partner who is struggling with fatigue?",
            "userData": {
                "careStage": "recently_discharged",
                "challenges": ["emotional_stress", "physical_care"]
            }
        }
    },
    {
        "name": "Parent asking about school",
        "query": {
            "userRole": "parent",
            "userQuery": "When can my child return to school after encephalitis?",
            "userData": {
                "stage": "in_recovery",
                "concerns": ["school", "returning_work"],
                "ageGroup": "child"
            }
        }
    },
    {
        "name": "Professional seeking research",
        "query": {
            "userRole": "professional",
            "userQuery": "What are the latest research findings on NMDA encephalitis?",
            "userData": {}
        }
    }
]


def invoke_agent(session, agent_id: str, alias_id: str, query_text: str) -> Dict[str, Any]:
    """Invoke Agent Core and return response"""
    bedrock_agent_runtime = session.client('bedrock-agent-runtime', region_name='us-west-2')
    
    try:
        response = bedrock_agent_runtime.invoke_agent(
            agentId=agent_id,
            agentAliasId=alias_id,
            sessionId=f"compare-{datetime.now().timestamp()}",
            inputText=query_text,
            enableTrace=False
        )
        
        # Collect response
        result = ""
        for event in response['completion']:
            if 'chunk' in event:
                chunk = event['chunk']
                if 'bytes' in chunk:
                    result += chunk['bytes'].decode('utf-8')
        
        return {
            "success": True,
            "response": result,
            "error": None
        }
        
    except Exception as e:
        return {
            "success": False,
            "response": None,
            "error": str(e)
        }


def invoke_lambda(session, function_name: str, event: Dict[str, Any]) -> Dict[str, Any]:
    """Invoke Lambda function and return response"""
    lambda_client = session.client('lambda', region_name='us-west-2')
    
    try:
        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(event)
        )
        
        payload = json.loads(response['Payload'].read())
        
        # Parse body if it's a string
        if 'body' in payload and isinstance(payload['body'], str):
            body = json.loads(payload['body'])
        else:
            body = payload.get('body', payload)
        
        return {
            "success": payload.get('statusCode') == 200,
            "response": body,
            "error": body.get('error') if isinstance(body, dict) else None
        }
        
    except Exception as e:
        return {
            "success": False,
            "response": None,
            "error": str(e)
        }


def extract_content_ids(response: Any) -> List[str]:
    """Extract content IDs from response for comparison"""
    content_ids = []
    
    if isinstance(response, dict):
        # Lambda format
        if 'items' in response:
            for item in response['items']:
                if 'content_id' in item:
                    content_ids.append(item['content_id'])
    elif isinstance(response, str):
        # Agent format - try to parse as JSON first
        import re
        
        # Try to extract JSON from markdown code block
        json_match = re.search(r'```json\s*(\{.*?\})\s*```', response, re.DOTALL)
        if json_match:
            try:
                data = json.loads(json_match.group(1))
                if 'items' in data:
                    for item in data['items']:
                        if 'content_id' in item:
                            content_ids.append(item['content_id'])
                return content_ids
            except json.JSONDecodeError:
                pass
        
        # Fallback: extract URLs and content IDs
        urls = re.findall(r'https://www\.encephalitis\.info/[^\s\)"]+', response)
        content_ids.extend(urls)
        
        # Also look for direct content IDs in format enc-XXXXXXXX
        ids = re.findall(r'enc-[a-f0-9]{8}', response)
        content_ids.extend(ids)
    
    return content_ids


def compare_results(test_name: str, agent_result: Dict, lambda_result: Dict):
    """Compare and display results"""
    print(f"\n{'='*80}")
    print(f"TEST: {test_name}")
    print(f"{'='*80}")
    
    # Agent results
    print(f"\n🤖 AGENT CORE:")
    if agent_result['success']:
        print(f"   ✅ Success")
        response = agent_result['response']
        print(f"   Response length: {len(response)} chars")
        print(f"   Preview: {response[:200]}...")
        agent_ids = extract_content_ids(response)
        print(f"   Content IDs found: {len(agent_ids)}")
        if agent_ids:
            print(f"   IDs: {agent_ids[:5]}")
    else:
        print(f"   ❌ Failed: {agent_result['error']}")
        agent_ids = []
    
    # Lambda results
    print(f"\n🔧 LAMBDA:")
    if lambda_result['success']:
        print(f"   ✅ Success")
        response = lambda_result['response']
        if isinstance(response, dict):
            count = response.get('count', 0)
            print(f"   Items returned: {count}")
            if 'classification' in response:
                print(f"   Classification: {json.dumps(response['classification'], indent=2)}")
            lambda_ids = extract_content_ids(response)
            print(f"   Content IDs: {lambda_ids[:5] if lambda_ids else 'None'}")
        else:
            print(f"   Response: {response}")
            lambda_ids = []
    else:
        print(f"   ❌ Failed: {lambda_result['error']}")
        lambda_ids = []
    
    # Comparison
    print(f"\n📊 COMPARISON:")
    if agent_result['success'] and lambda_result['success']:
        # Compare content overlap
        agent_set = set(agent_ids)
        lambda_set = set(lambda_ids)
        
        # For lambda, also extract URLs from items for better comparison
        lambda_urls = []
        if isinstance(lambda_result['response'], dict) and 'items' in lambda_result['response']:
            for item in lambda_result['response']['items']:
                if 'url' in item:
                    lambda_urls.append(item['url'])
        
        # Check URL overlap
        agent_urls = [id for id in agent_ids if id.startswith('http')]
        
        if agent_urls and lambda_urls:
            agent_url_set = set(agent_urls)
            lambda_url_set = set(lambda_urls)
            overlap = agent_url_set & lambda_url_set
            overlap_pct = (len(overlap) / len(lambda_url_set)) * 100 if lambda_url_set else 0
            
            print(f"   Agent referenced: {len(agent_url_set)} URLs")
            print(f"   Lambda returned: {len(lambda_url_set)} URLs")
            print(f"   Overlap: {len(overlap)} URLs ({overlap_pct:.1f}%)")
            
            if overlap_pct >= 80:
                print(f"   ✅ HIGH OVERLAP - Agent matches Lambda well")
            elif overlap_pct >= 50:
                print(f"   ⚠️  MODERATE OVERLAP - Some differences")
            elif overlap_pct >= 20:
                print(f"   ⚠️  LOW OVERLAP - Significant differences")
            else:
                print(f"   ❌ VERY LOW OVERLAP - Agent and Lambda returning different content")
            
            # Show some examples
            if overlap:
                print(f"\n   Shared URLs (sample):")
                for url in list(overlap)[:3]:
                    print(f"      • {url}")
        else:
            print(f"   ⚠️  Cannot compare URLs - Agent: {len(agent_urls)}, Lambda: {len(lambda_urls)}")
    else:
        print(f"   ⚠️  Cannot compare - one or both failed")


def main():
    profile = 'hackathon'
    region = 'us-west-2'
    
    # Configuration
    agent_id = "TANBRPMHVE"
    alias_id = "TSTALIASID"
    lambda_function = "dev-teambeacon-handler"
    
    print("🧪 AGENT CORE vs LAMBDA COMPARISON TEST")
    print(f"   Profile: {profile}")
    print(f"   Region: {region}")
    print(f"   Agent: {agent_id} (alias: {alias_id})")
    print(f"   Lambda: {lambda_function}")
    
    session = boto3.Session(profile_name=profile, region_name=region)
    
    # Run tests
    for test in TEST_QUERIES:
        test_name = test['name']
        query = test['query']
        
        # Format query for agent (natural language)
        user_query = query.get('userQuery', '')
        user_role = query.get('userRole', '')
        user_data = query.get('userData', {})
        
        agent_query = f"User Role: {user_role}\nQuery: {user_query}\nUser Data: {json.dumps(user_data)}"
        
        # Invoke agent
        print(f"\n🤖 Invoking Agent Core...")
        agent_result = invoke_agent(session, agent_id, alias_id, agent_query)
        
        # Invoke lambda
        print(f"🔧 Invoking Lambda...")
        lambda_result = invoke_lambda(session, lambda_function, query)
        
        # Compare
        compare_results(test_name, agent_result, lambda_result)
    
    print(f"\n{'='*80}")
    print("✅ COMPARISON COMPLETE")
    print(f"{'='*80}\n")


if __name__ == '__main__':
    main()
