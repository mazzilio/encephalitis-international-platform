# TeamBeacon Agent Core - Basic Setup

This is a minimal Agent Core deployment that provides a foundation for incremental feature additions.

## What's Included

### Current Features
- ✅ **Basic Agent Core agent** with Claude Sonnet 4.5
- ✅ **DynamoDB Action Group** - Query content by tags
- ✅ **Proper IAM roles** and permissions
- ✅ **Lambda function** for content queries

### Architecture

```
User Query
    ↓
Bedrock Agent Core
    ↓
Action Group: Query Content
    ↓
Lambda Function
    ↓
DynamoDB (ContentMetadata table)
    ↓
Results back to Agent
    ↓
Response to User
```

## Quick Start

### 1. Deploy Agent Core

```bash
cd agent
./setup_agent_core.sh --profile hackathon
```

This will:
1. Create IAM roles
2. Create the Agent Core agent
3. Deploy Lambda function
4. Add action group to agent
5. Prepare agent for use

### 2. Test the Agent

```bash
# Get agent ID from output or agent_core_output.json
python3 test_agent.py --profile hackathon --agent-id YOUR_AGENT_ID --alias-id TSTALIASID
```

Try queries like:
- "Find resources for patients with memory issues"
- "I'm a caregiver looking for support with behavior changes"
- "Show me information about autoimmune encephalitis"

### 3. Integrate with Lambda

Update `lambda/unified_handler.py` with your new agent ID:

```python
AGENT_ID = "YOUR_NEW_AGENT_ID"  # From agent_core_output.json
ALIAS_ID = "TSTALIASID"
```

Then deploy:

```bash
cd infra
./deploy.sh --profile hackathon
```

## Files

- `agent_core_basic.py` - Creates the basic agent
- `action_group_lambda.py` - Lambda function for DynamoDB queries
- `add_action_group.py` - Adds action group to agent
- `setup_agent_core.sh` - One-command setup script
- `agent_core_output.json` - Configuration (created after setup)

## How It Works

### Agent Instructions

The agent is instructed to:
1. Understand user queries about encephalitis support
2. Classify queries into categories (personas, types, stages, topics)
3. Use the `query_content` action to search DynamoDB
4. Present results in a helpful, organized way

### Action Group: Query Content

The action group provides one API endpoint:

**POST /query_content**
- Parameters: personas, types, stages, topics, limit
- Returns: Array of matching content items from DynamoDB

Example:
```json
{
  "personas": "persona:patient",
  "topics": "topic:memory,topic:fatigue",
  "limit": "10"
}
```

### Lambda Function

The Lambda function:
1. Receives parameters from the agent
2. Builds DynamoDB filter expression
3. Scans ContentMetadata table
4. Scores and ranks results by relevance
5. Returns top N items

## Next Steps - Incremental Features

Now that you have the basic setup, you can add features incrementally:

### Phase 1: Enhanced Content Access
- [ ] Add knowledge base with your documents
- [ ] Add semantic search capabilities
- [ ] Add content filtering and ranking

### Phase 2: User Profiles
- [ ] Add action group for user profile management
- [ ] Store user preferences and history
- [ ] Personalize recommendations

### Phase 3: Peer Matching
- [ ] Add action group for peer matching
- [ ] Match users with similar experiences
- [ ] Facilitate connections

### Phase 4: Proactive Features
- [ ] Add session memory
- [ ] Proactive recommendations
- [ ] Follow-up suggestions

### Phase 5: Advanced Features
- [ ] Multi-agent collaboration
- [ ] Guardrails for content safety
- [ ] Analytics and insights

## Troubleshooting

### Agent returns "I don't have access to that information"

The agent might not be using the action group. Check:
1. Action group is ENABLED
2. Agent was prepared after adding action group
3. Lambda has correct permissions

### Lambda errors

Check CloudWatch logs:
```bash
aws logs tail /aws/lambda/TeamBeacon-ActionGroup-QueryContent --follow --profile hackathon
```

### DynamoDB access denied

Verify Lambda role has DynamoDB permissions:
```bash
aws iam get-role-policy --role-name TeamBeaconActionGroupLambdaRole --policy-name DynamoDBAccess --profile hackathon
```

## Comparison: Basic Agent vs Agent Core

| Feature | Basic Agent | Agent Core |
|---------|-------------|------------|
| Classification | ✅ Yes | ✅ Yes |
| DynamoDB Access | ❌ No | ✅ Yes (via action group) |
| Custom Actions | ❌ No | ✅ Yes |
| Knowledge Base | ❌ No | ⏳ Can add |
| Memory | ❌ No | ⏳ Can add |
| Complexity | Low | Medium |
| Setup Time | 5 min | 15 min |

## Resources

- [AWS Bedrock Agent Core Documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/agents.html)
- [Action Groups Guide](https://docs.aws.amazon.com/bedrock/latest/userguide/agents-action-groups.html)
- [Knowledge Bases Guide](https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base.html)
