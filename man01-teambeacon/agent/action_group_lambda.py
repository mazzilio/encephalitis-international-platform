"""
Lambda function for Agent Core action group
Handles DynamoDB content queries
"""

import json
import boto3
import os
from boto3.dynamodb.conditions import Attr
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')

def lambda_handler(event, context):
    """
    Handle action group requests from Bedrock Agent
    
    Event structure from Agent:
    {
        "messageVersion": "1.0",
        "agent": {...},
        "inputText": "user query",
        "sessionId": "session-id",
        "actionGroup": "action-group-name",
        "apiPath": "/query_content",
        "httpMethod": "POST",
        "parameters": [
            {"name": "personas", "type": "string", "value": "persona:patient"},
            {"name": "topics", "type": "string", "value": "topic:memory"}
        ]
    }
    """
    
    print(f"📥 Received event: {json.dumps(event, default=str)}")
    
    # Extract action details
    action_group = event.get('actionGroup', '')
    api_path = event.get('apiPath', '')
    
    # Route to appropriate handler
    if api_path == '/query_content':
        return handle_query_content(event)
    else:
        return {
            'messageVersion': '1.0',
            'response': {
                'actionGroup': action_group,
                'apiPath': api_path,
                'httpMethod': event.get('httpMethod', 'POST'),
                'httpStatusCode': 404,
                'responseBody': {
                    'application/json': {
                        'body': json.dumps({'error': f'Unknown API path: {api_path}'})
                    }
                }
            }
        }


def handle_query_content(event):
    """Query DynamoDB for content matching tags"""
    
    # Extract parameters from requestBody
    request_body = event.get('requestBody', {})
    content = request_body.get('content', {})
    app_json = content.get('application/json', {})
    properties = app_json.get('properties', [])
    
    # Convert properties array to dict
    param_dict = {p['name']: p['value'] for p in properties}
    
    print(f"🔍 Query parameters: {param_dict}")
    
    # Parse tags from parameters
    personas = param_dict.get('personas', '').split(',') if param_dict.get('personas') else []
    types = param_dict.get('types', '').split(',') if param_dict.get('types') else []
    stages = param_dict.get('stages', '').split(',') if param_dict.get('stages') else []
    topics = param_dict.get('topics', '').split(',') if param_dict.get('topics') else []
    limit = int(param_dict.get('limit', '10'))
    
    # Clean up empty strings
    personas = [p.strip() for p in personas if p.strip()]
    types = [t.strip() for t in types if t.strip()]
    stages = [s.strip() for s in stages if s.strip()]
    topics = [t.strip() for t in topics if t.strip()]
    
    print(f"📋 Parsed tags:")
    print(f"   Personas: {personas}")
    print(f"   Types: {types}")
    print(f"   Stages: {stages}")
    print(f"   Topics: {topics}")
    
    # Query DynamoDB
    try:
        table_name = os.environ.get('DYNAMODB_TABLE_NAME', 'dev-teambeacon-content')
        table = dynamodb.Table(table_name)
        
        # Build filter expression
        all_tags = []
        if personas:
            all_tags.extend([('personas', tag) for tag in personas])
        if types:
            all_tags.extend([('types', tag) for tag in types])
        if stages:
            all_tags.extend([('stages', tag) for tag in stages])
        if topics:
            all_tags.extend([('topics', tag) for tag in topics])
        
        if not all_tags:
            # No filters, return empty
            items = []
        else:
            # Build OR filter
            tag_filters = []
            for tag_category, tag_value in all_tags:
                filter_expr = Attr(tag_category).contains(tag_value)
                tag_filters.append(filter_expr)
            
            combined_filter = tag_filters[0]
            for expr in tag_filters[1:]:
                combined_filter = combined_filter | expr
            
            # Execute scan
            response = table.scan(FilterExpression=combined_filter)
            items = response.get('Items', [])
            
            # Convert Decimal types
            items = [convert_dynamodb_item(item) for item in items]
            
            # Score and rank
            scored_items = []
            for item in items:
                score = calculate_relevance_score(item, all_tags)
                if score > 0:
                    scored_items.append((score, item))
            
            scored_items.sort(key=lambda x: x[0], reverse=True)
            items = [item for _, item in scored_items[:limit]]
        
        print(f"✅ Found {len(items)} items")
        
        # Format response
        result = {
            'items': items,
            'count': len(items),
            'query': {
                'personas': personas,
                'types': types,
                'stages': stages,
                'topics': topics
            }
        }
        
        return {
            'messageVersion': '1.0',
            'response': {
                'actionGroup': event.get('actionGroup', ''),
                'apiPath': event.get('apiPath', ''),
                'httpMethod': event.get('httpMethod', 'POST'),
                'httpStatusCode': 200,
                'responseBody': {
                    'application/json': {
                        'body': json.dumps(result, default=str)
                    }
                }
            }
        }
        
    except Exception as e:
        print(f"❌ Error querying DynamoDB: {e}")
        import traceback
        traceback.print_exc()
        
        return {
            'messageVersion': '1.0',
            'response': {
                'actionGroup': event.get('actionGroup', ''),
                'apiPath': event.get('apiPath', ''),
                'httpMethod': event.get('httpMethod', 'POST'),
                'httpStatusCode': 500,
                'responseBody': {
                    'application/json': {
                        'body': json.dumps({'error': str(e)})
                    }
                }
            }
        }


def calculate_relevance_score(item, all_tags):
    """Calculate relevance score based on matching tags"""
    score = 0
    for tag_category, tag_value in all_tags:
        category_tags = item.get(tag_category, [])
        if isinstance(category_tags, list) and tag_value in category_tags:
            score += 1
    return score


def convert_dynamodb_item(item):
    """Convert DynamoDB types to JSON-serializable types"""
    if isinstance(item, dict):
        return {k: convert_dynamodb_item(v) for k, v in item.items()}
    elif isinstance(item, list):
        return [convert_dynamodb_item(v) for v in item]
    elif isinstance(item, Decimal):
        if item % 1 == 0:
            return int(item)
        else:
            return float(item)
    elif isinstance(item, (set, frozenset)):
        return list(item)
    else:
        return item
