import boto3
import json
import os
from boto3.dynamodb.conditions import Attr
from botocore.exceptions import ClientError
from decimal import Decimal

# Initialize AWS clients
bedrock_client = boto3.client("bedrock-runtime", region_name=os.environ.get('BEDROCK_REGION', 'us-west-2'))
bedrock_agent_runtime = boto3.client("bedrock-agent-runtime", region_name=os.environ.get('BEDROCK_REGION', 'us-west-2'))
dynamodb = boto3.resource('dynamodb')

# Agent configuration
AGENT_ID = "28QQU2KK4R"
ALIAS_ID = "TSTALIASID"  # Test alias points to DRAFT with inference profile
USE_AGENT = os.environ.get('USE_AGENT', 'true').lower() == 'true'

# Mapping userRole to persona tags
USER_ROLE_TO_PERSONA = {
    "patient": "persona:patient",
    "caregiver": "persona:caregiver",
    "parent": "persona:parent",
    "professional": "persona:professional"
}

# Flexible concerns-to-topics mapping (frontend concerns -> backend topics)
CONCERNS_TO_TOPICS_MAPPING = {
    "mood": ["topic:behaviour"],
    "behaviour": ["topic:behaviour"],
    "seizures": ["topic:seizures"],
    "fatigue": ["topic:fatigue"],
    "memory": ["topic:memory"],
    "speech_movement": ["topic:speech", "topic:movement"],
    "returning_work": ["topic:school", "topic:work"],
    "understanding": ["topic:education"],
    "legal": ["topic:legal"],
    "school": ["topic:school"],
    "travel": ["topic:travel"],
    "research": ["topic:research"],
    # Caregiver challenges mapping
    "behavior_changes": ["topic:behaviour"],
    "memory_confusion": ["topic:memory"],
    "physical_care": ["topic:physical_care"],
    "emotional_stress": ["topic:emotional_support"],
    "communication_doctors": ["topic:healthcare_communication"],
    "long_term_planning": ["topic:planning"]
}

# Mapping frontend stages to backend stage tags
STAGE_MAPPING = {
    # Patient stages
    "recently_diagnosed": "stage:pre_diagnosis",
    "in_recovery": "stage:early_recovery",
    "long_term_survivor": "stage:long_term_management",
    "unsure": "stage:pre_diagnosis",
    # Patient recovery stages
    "in_hospital": "stage:acute_hospital",
    "early_recovery": "stage:early_recovery",
    "ongoing_recovery": "stage:early_recovery",
    "long_term": "stage:long_term_management",
    # Caregiver stages
    "hospitalized": "stage:acute_hospital",
    "recently_discharged": "stage:early_recovery",
    "long_term_home": "stage:long_term_management"
}

# Mapping encephalitis types to backend type tags
TYPE_MAPPING = {
    "infectious": "type:infectious",
    "autoimmune": "type:autoimmune",
    "unknown": None,
    "other_multiple": None
}

def lambda_handler(event, context):
    """
    Unified Lambda handler that:
    1. Classifies user input using AWS Bedrock
    2. Queries DynamoDB for relevant content
    3. Returns matched resources
    """
    print("🚀 [UNIFIED_LAMBDA] Handler invoked")
    print(f"   Event: {json.dumps(event, default=str)}")
    
    # Parse body if it's a string (API Gateway format)
    if 'body' in event and isinstance(event['body'], str):
        print("   Event has 'body' field (string), parsing...")
        try:
            event = json.loads(event['body'])
            print(f"   Parsed body: {json.dumps(event, default=str)}")
        except json.JSONDecodeError as e:
            print(f"   Failed to parse body: {str(e)}")
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Invalid JSON in body: {str(e)}'})
            }
    
    try:
        # ============================================
        # STEP 1: CLASSIFY USER INPUT WITH BEDROCK
        # ============================================
        print("\n🔍 [STEP 1] Classifying user input with Bedrock...")
        # Use agent if enabled, otherwise use direct Bedrock
        if USE_AGENT:
            classification = classify_with_agent(event)
        else:
            classification = classify_user_input(event)
        print(f"✅ [STEP 1] Classification complete: {json.dumps(classification, default=str)}")
        
        # ============================================
        # STEP 2: QUERY DYNAMODB FOR CONTENT
        # ============================================
        print("\n🔍 [STEP 2] Querying DynamoDB for relevant content...")
        limit = event.get('limit', 20)
        content_results = query_dynamodb(classification, limit)
        print(f"✅ [STEP 2] Found {content_results['count']} items")
        
        # ============================================
        # STEP 3: RETURN COMBINED RESULTS
        # ============================================
        result = {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'classification': classification,
                'items': content_results['items'],
                'count': content_results['count'],
                'scanned_count': content_results['scanned_count']
            })
        }
        
        print(f"\n✅ [UNIFIED_LAMBDA] Success! Returning {content_results['count']} items")
        return result
        
    except Exception as e:
        print(f"❌ [UNIFIED_LAMBDA] Error: {str(e)}")
        import traceback
        print(f"   Traceback: {traceback.format_exc()}")
        
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Processing failed: {str(e)}'})
        }



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



def classify_user_input(event):
    """
    Classify user input using AWS Bedrock (Claude).
    
    Args:
        event: Input event with userRole, userQuery, userData
    
    Returns:
        dict: Classification with personas, types, stages, topics
    """
    model_id = "us.anthropic.claude-sonnet-4-5-20250929-v1:0"
    
    # Extract input
    user_role = event.get('userRole', '')
    user_data = event.get('userData', {})
    user_query = event.get('userQuery', '')
    user_query_type = event.get('userQueryType', 'Text')
    
    # Extract patient-specific fields
    user_stage = user_data.get('stage', '') if isinstance(user_data, dict) else ''
    recovery_stage = user_data.get('recoveryStage', '') if isinstance(user_data, dict) else ''
    encephalitis_type = user_data.get('encephalitisType', '') if isinstance(user_data, dict) else ''
    user_concerns = user_data.get('concerns', []) if isinstance(user_data, dict) else []
    user_age_group = user_data.get('ageGroup', '') if isinstance(user_data, dict) else ''
    
    # Extract caregiver-specific fields
    care_stage = user_data.get('careStage', '') if isinstance(user_data, dict) else ''
    challenges = user_data.get('challenges', []) if isinstance(user_data, dict) else []
    
    # Map userRole to persona
    persona_tag = USER_ROLE_TO_PERSONA.get(user_role.lower(), '') if user_role else ''
    
    # Map stages to backend stage tags
    mapped_stages = []
    if user_stage and user_stage in STAGE_MAPPING:
        stage_tag = STAGE_MAPPING[user_stage]
        if stage_tag:
            mapped_stages.append(stage_tag)
    if recovery_stage and recovery_stage in STAGE_MAPPING:
        stage_tag = STAGE_MAPPING[recovery_stage]
        if stage_tag and stage_tag not in mapped_stages:
            mapped_stages.append(stage_tag)
    if care_stage and care_stage in STAGE_MAPPING:
        stage_tag = STAGE_MAPPING[care_stage]
        if stage_tag and stage_tag not in mapped_stages:
            mapped_stages.append(stage_tag)
    
    # Map encephalitis type to backend type tags
    mapped_types = []
    if encephalitis_type and encephalitis_type in TYPE_MAPPING:
        type_tag = TYPE_MAPPING[encephalitis_type]
        if type_tag:
            mapped_types.append(type_tag)
    
    # Map concerns/challenges to topics
    mapped_topics = []
    all_concerns = user_concerns + challenges
    if all_concerns:
        for concern in all_concerns:
            concern_lower = concern.lower()
            if concern_lower in CONCERNS_TO_TOPICS_MAPPING:
                for topic in CONCERNS_TO_TOPICS_MAPPING[concern_lower]:
                    if topic not in mapped_topics:
                        mapped_topics.append(topic)
    
    print(f"📥 [CLASSIFY] Input:")
    print(f"   userRole: {user_role} → {persona_tag}")
    print(f"   userQuery: {user_query}")
    print(f"   userData.stage: {user_stage} → {mapped_stages}")
    print(f"   userData.recoveryStage: {recovery_stage}")
    print(f"   userData.encephalitisType: {encephalitis_type} → {mapped_types}")
    print(f"   userData.concerns: {user_concerns}")
    print(f"   userData.challenges: {challenges}")
    print(f"   Mapped topics: {mapped_topics}")
    print(f"   userData.ageGroup: {user_age_group}")
    
    # Build classification prompt
    all_concerns_text = ", ".join(all_concerns) if all_concerns else "None specified"
    prompt = f"""You are a content classification system. Analyze the user input below and classify it into relevant tags.

User Information:
- User Role: {user_role}
- User Query: {user_query}
- User Stage: {user_stage if user_stage else "Not specified"}
- Recovery Stage: {recovery_stage if recovery_stage else "Not specified"}
- Care Stage: {care_stage if care_stage else "Not specified"}
- Encephalitis Type: {encephalitis_type if encephalitis_type else "Not specified"}
- User Concerns/Challenges: {all_concerns_text}
- Age Group: {user_age_group if user_age_group else "Not specified"}

Available tags:

Personas (select all that apply):
- persona:patient
- persona:caregiver
- persona:parent
- persona:professional

Types (select all that apply):
- type:infectious
- type:autoimmune
- type:post_infectious
- type:HSV
- type:NMDA
- type:LGI1

Stages (select all that apply):
- stage:pre_diagnosis
- stage:acute_hospital
- stage:early_recovery
- stage:long_term_management

Topics (select all that apply):
- topic:memory
- topic:behaviour
- topic:legal
- topic:school
- topic:travel
- topic:research

IMPORTANT: You MUST return a valid JSON object with this EXACT structure. Do not include any text before or after the JSON:
{{
  "personas": ["persona:parent"],
  "types": ["type:autoimmune"],
  "stages": ["stage:long_term_management"],
  "topics": ["topic:school"]
}}

Select ALL relevant tags based on the user information provided above.

Guidelines:
- User Role "{user_role}" should map to the corresponding persona tag
- User Stage, Recovery Stage, and Care Stage should help determine the appropriate stage tags
- Encephalitis Type should help determine the appropriate type tags
- User Concerns/Challenges ({all_concerns_text}) should help identify relevant topic tags
- Age Group "{user_age_group}" may help determine if this is a parent querying for a child
- Analyze the User Query carefully to extract types, stages, and topics
- Be thorough and select all applicable tags based on the complete context"""
    
    conversation = [{"role": "user", "content": [{"text": prompt}]}]
    
    try:
        print(f"🤖 [CLASSIFY] Calling Bedrock model: {model_id}")
        response = bedrock_client.converse(
            modelId=model_id,
            messages=conversation,
            inferenceConfig={"maxTokens": 512}
        )
        
        response_text = response["output"]["message"]["content"][0]["text"]
        print(f"📦 [CLASSIFY] Bedrock response (first 500 chars): {response_text[:500]}...")
        
        # Extract JSON from response
        start = response_text.find('{')
        end = response_text.rfind('}') + 1
        
        if start != -1 and end > start:
            json_str = response_text[start:end]
            classification = json.loads(json_str)
        else:
            classification = json.loads(response_text)
        
        # Validate structure
        if not isinstance(classification, dict):
            classification = {"personas": [], "types": [], "stages": [], "topics": []}
        
        # Merge initial mappings with Bedrock classification
        final_personas = classification.get("personas", [])
        final_types = classification.get("types", [])
        final_stages = classification.get("stages", [])
        final_topics = classification.get("topics", [])
        
        # Add mapped persona
        if persona_tag and persona_tag not in final_personas:
            final_personas.append(persona_tag)
        
        # Add mapped types
        for type_tag in mapped_types:
            if type_tag not in final_types:
                final_types.append(type_tag)
        
        # Add mapped stages
        for stage_tag in mapped_stages:
            if stage_tag not in final_stages:
                final_stages.append(stage_tag)
        
        # Add mapped topics
        for topic in mapped_topics:
            if topic not in final_topics:
                final_topics.append(topic)
        
        classification = {
            "personas": final_personas,
            "types": final_types,
            "stages": final_stages,
            "topics": final_topics
        }
        
        print(f"🏷️  [CLASSIFY] Final classification: {json.dumps(classification, default=str)}")
        return classification
        
    except (ClientError, json.JSONDecodeError) as e:
        print(f"❌ [CLASSIFY] Error: {str(e)}")
        # Return empty classification on error
        return {"personas": [], "types": [], "stages": [], "topics": []}


def query_dynamodb(classification, limit=20):
    """
    Query DynamoDB for content matching the classification tags.
    
    Args:
        classification: dict with personas, types, stages, topics
        limit: Maximum number of results to return
    
    Returns:
        dict: items, count, scanned_count
    """
    table_name = os.environ.get('DYNAMODB_TABLE_NAME', 'ContentMetadata')
    print(f"📋 [DYNAMODB] Table: {table_name}")
    
    table = dynamodb.Table(table_name)
    
    # Collect all tags
    all_tags = []
    personas = classification.get('personas', [])
    types = classification.get('types', [])
    stages = classification.get('stages', [])
    topics = classification.get('topics', [])
    
    if personas:
        all_tags.extend([('personas', tag) for tag in personas])
    if types:
        all_tags.extend([('types', tag) for tag in types])
    if stages:
        all_tags.extend([('stages', tag) for tag in stages])
    if topics:
        all_tags.extend([('topics', tag) for tag in topics])
    
    print(f"🏷️  [DYNAMODB] Searching for {len(all_tags)} tags")
    
    # Build filter expression (OR logic - match ANY tag)
    scan_kwargs = {}
    
    if all_tags:
        tag_filters = []
        for tag_category, tag_value in all_tags:
            filter_expr = Attr(tag_category).contains(tag_value)
            tag_filters.append(filter_expr)
        
        # Combine with OR logic
        tag_or_filter = tag_filters[0]
        for expr in tag_filters[1:]:
            tag_or_filter = tag_or_filter | expr
        
        scan_kwargs['FilterExpression'] = tag_or_filter
    
    # Execute scan
    print(f"🔍 [DYNAMODB] Executing scan...")
    response = table.scan(**scan_kwargs)
    items = response.get('Items', [])
    scanned_count = response.get('ScannedCount', 0)
    
    print(f"📊 [DYNAMODB] Scan results: {len(items)} items found, {scanned_count} scanned")
    
    # Convert DynamoDB types
    items = [convert_dynamodb_item(item) for item in items]
    
    # Score and rank by relevance
    if all_tags:
        scored_items = []
        for item in items:
            score = calculate_relevance_score(item, all_tags)
            if score > 0:
                scored_items.append((score, item))
        
        # Sort by score (descending) and take top N
        scored_items.sort(key=lambda x: x[0], reverse=True)
        items = [item for _, item in scored_items[:limit]]
        print(f"📦 [DYNAMODB] Returning top {len(items)} items (limit={limit})")
    else:
        items = items[:limit]
    
    return {
        'items': items,
        'count': len(items),
        'scanned_count': scanned_count
    }


def calculate_relevance_score(item, all_tags):
    """Calculate relevance score based on number of matching tags."""
    score = 0
    for tag_category, tag_value in all_tags:
        category_tags = item.get(tag_category, [])
        if isinstance(category_tags, list) and tag_value in category_tags:
            score += 1
    return score


def convert_dynamodb_item(item):
    """Convert DynamoDB item to native Python types for JSON serialization."""
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
