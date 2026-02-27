# Quick Start: Bedrock Agent Core

Get a working agent in **5 minutes** to validate the concept before committing to the full implementation.

## What This Does

Creates a minimal Bedrock Agent Core agent that:
- ✅ Classifies user queries (personas, types, stages, topics)
- ✅ Can be invoked from your existing Lambda
- ✅ Lets you test the concept immediately

## Prerequisites

- AWS CLI configured with credentials
- Python 3.9+
- AWS account with Bedrock enabled in us-west-2
- IAM permissions to create agents, roles, and Lambda functions

## Quick Start

### 1. Create the Agent (2 minutes)

```bash
cd agent

# Use default AWS credentials
./setup.sh

# OR use a specific AWS profile
./setup.sh --profile hackathon

# OR use custom profile and region
./setup.sh --profile dev --region us-east-1
```

**Options:**
- `-p, --profile PROFILE` - AWS profile name (default: none)
- `-r, --region REGION` - AWS region (default: us-west-2)
- `-h, --help` - Show help message

This will:
- Create an IAM role for the agent
- Create a Bedrock Agent Core agent
- Prepare and deploy the agent
- Test it with a sample query
- Output your Agent ID and Alias ID

**Expected output:**
```
✅ AGENT READY!
Agent ID: ABCD1234
Alias ID: XYZ5678
```

### 2. Test the Agent (1 minute)

The setup script automatically updates `test_agent.py` with your Agent ID and Alias ID.

Run the tests:

```bash
# Use default credentials
python3 test_agent.py --agent-id YOUR_ID --alias-id YOUR_ALIAS

# OR use a specific profile
python3 test_agent.py --profile hackathon --agent-id YOUR_ID --alias-id YOUR_ALIAS
```

**Options:**
- `-p, --profile PROFILE` - AWS profile name
- `-r, --region REGION` - AWS region (default: us-west-2)
- `--agent-id ID` - Agent ID (or update in file)
- `--alias-id ID` - Alias ID (or update in file)

This will test the agent with 5 different queries and show you the classifications.

### 3. Integrate with Lambda (2 minutes)

Update `lambda/unified_handler.py` to use the agent:

```python
# Add at top
bedrock_agent_runtime = boto3.client('bedrock-agent-runtime', region_name='us-west-2')

AGENT_ID = "ABCD1234"  # Your agent ID
ALIAS_ID = "XYZ5678"   # Your alias ID

def classify_with_agent(event):
    """Use Bedrock Agent for classification"""
    user_query = event.get('userQuery', '')
    user_role = event.get('userRole', '')
    
    try:
        response = bedrock_agent_runtime.invoke_agent(
            agentId=AGENT_ID,
            agentAliasId=ALIAS_ID,
            sessionId=f"session-{datetime.now().timestamp()}",
            inputText=f"User role: {user_role}. Query: {user_query}"
        )
        
        # Collect response
        result = ""
        for event in response['completion']:
            if 'chunk' in event:
                chunk = event['chunk']
                if 'bytes' in chunk:
                    result += chunk['bytes'].decode('utf-8')
        
        # Parse classification
        classification = json.loads(result)
        return classification
        
    except Exception as e:
        print(f"Agent failed, using fallback: {e}")
        return classify_user_input(event)  # Fallback to existing logic
```

Then in `lambda_handler`, replace the classification call:

```python
# OLD:
classification = classify_user_input(event)

# NEW:
classification = classify_with_agent(event)
```

## What You Get

**Immediate Benefits:**
- ✅ Agent-based classification (more flexible than direct Bedrock calls)
- ✅ Easy to test and iterate
- ✅ Fallback to existing logic if agent fails
- ✅ Foundation for adding more tools later

**What's NOT Included (yet):**
- ⬜ Peer matching
- ⬜ Proactive recommendations
- ⬜ User profile tracking
- ⬜ Advanced error handling

## Next Steps

### Option 1: Keep It Simple
If the basic agent works well, you can:
- Add more sophisticated prompts
- Improve classification accuracy
- Add simple Lambda tools

### Option 2: Full Implementation
If you want the advanced features (peer matching, recommendations), follow the full spec:
- See `.kiro/specs/bedrock-agent-core/` for complete design
- Follow `tasks.md` for step-by-step implementation
- Get user profiles, matching, and proactive recommendations

## Troubleshooting

**"Access denied" errors:**
```bash
# Check Bedrock access
aws bedrock list-foundation-models --region us-west-2

# Request model access in console if needed
```

**"Agent not found":**
```bash
# List your agents
aws bedrock-agent list-agents --region us-west-2
```

**"Role not found":**
- Wait 10-15 seconds after role creation
- IAM roles take time to propagate

## Cost

**For 1,000 test queries:**
- Bedrock Agent: ~$0.50
- Lambda: ~$0.01
- Total: **~$0.51**

Very cheap to validate the concept!

## Clean Up

To delete the agent:

```bash
# Delete agent
aws bedrock-agent delete-agent --agent-id YOUR_AGENT_ID --region us-west-2

# Delete IAM role
aws iam delete-role --role-name TeamBeaconQuickStartAgentRole
```

## Questions?

- **How is this different from direct Bedrock calls?** Agents provide better orchestration, tool integration, and conversation management
- **Can I add more tools?** Yes! Once you validate the concept, add Lambda tools for matching and recommendations
- **Is this production-ready?** This is a proof-of-concept. For production, follow the full spec with error handling, monitoring, etc.

---

**Time to value: 5 minutes** ⚡
