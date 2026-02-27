# 🚀 Quick Start: Get Agent Running in 5 Minutes

Want to test Bedrock Agent Core **right now** without the full implementation? Here's how:

## One Command Setup

```bash
cd agent

# Use default AWS credentials
./setup.sh

# OR use a specific AWS profile (recommended)
./setup.sh --profile hackathon

# OR use custom profile and region
./setup.sh --profile dev --region us-east-1
```

**Options:**
- `-p, --profile PROFILE` - AWS profile name
- `-r, --region REGION` - AWS region (default: us-west-2)
- `-h, --help` - Show help

That's it! This will:
1. ✅ Create a Bedrock Agent Core agent
2. ✅ Configure it for classification
3. ✅ Integrate it with your Lambda
4. ✅ Set up test scripts

**Time: ~2 minutes**

## Test It

```bash
# The setup script provides the exact command to run
# It will look something like:
python3 test_agent.py --profile hackathon --agent-id YOUR_ID --alias-id YOUR_ALIAS
```

This runs 5 test queries and shows you the classifications.

## Deploy It

```bash
cd ../infra
./deploy.sh -p hackathon
```

Your Lambda now uses the agent for classification!

## What You Get

**Immediate:**
- ✅ Agent-based classification (replaces direct Bedrock calls)
- ✅ Automatic fallback if agent fails
- ✅ Easy to test and iterate
- ✅ Foundation for adding more features

**Not Included (yet):**
- ⬜ Peer matching
- ⬜ Proactive recommendations  
- ⬜ User profile tracking

## Next Steps

### Option 1: Keep It Simple
If basic classification works for you:
- Improve the agent's prompts
- Add more classification rules
- You're done! 🎉

### Option 2: Add Advanced Features
If you want peer matching and recommendations:
- See `.kiro/specs/bedrock-agent-core/` for full design
- Follow `tasks.md` for implementation
- Get user profiles, matching, and proactive recommendations

## Manual Setup (if script fails)

```bash
# 1. Create agent (with optional profile)
python3 quick_start_agent.py --profile hackathon

# 2. Copy the Agent ID and Alias ID from output

# 3. Test (update IDs in command or in file)
python3 test_agent.py --profile hackathon --agent-id YOUR_ID --alias-id YOUR_ALIAS

# 4. Integrate with Lambda
python3 integrate_with_lambda.py <agent_id> <alias_id>

# 5. Deploy
cd ../infra && ./deploy.sh -p hackathon
```

## Troubleshooting

**"Access denied":**
- Go to AWS Bedrock Console (us-west-2)
- Request access to Claude models
- Wait for approval (usually instant)

**"Role not found":**
- Wait 10-15 seconds after running setup
- IAM roles take time to propagate

**"Agent not responding":**
- Check CloudWatch logs
- Verify agent is in PREPARED state
- Try re-running setup.sh

## Cost

**For 1,000 queries:**
- Bedrock Agent: ~$0.50
- Lambda: ~$0.01
- **Total: ~$0.51**

Very cheap to validate!

## Comparison

| Approach | Time | Features | Best For |
|----------|------|----------|----------|
| **Quick Start** | 5 min | Classification only | Testing concept |
| **Full Spec** | 2-3 days | Classification + Matching + Recommendations | Production use |

## Questions?

- **Why use an agent vs direct Bedrock?** Better orchestration, tool integration, conversation management
- **Can I add features later?** Yes! Start simple, add tools as needed
- **Is this production-ready?** It's a proof-of-concept. For production, add error handling, monitoring, etc.

---

**Choose your path:**
- 🏃 **Fast:** Run `./setup.sh` and test in 5 minutes
- 🏗️ **Complete:** Follow `.kiro/specs/bedrock-agent-core/tasks.md` for full implementation
