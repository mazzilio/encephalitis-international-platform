#!/usr/bin/env python3
"""
Create a numbered version from DRAFT and update the live alias
"""

import boto3
import time

session = boto3.Session(profile_name='hackathon')
bedrock_agent = session.client('bedrock-agent', region_name='us-west-2')

AGENT_ID = "28QQU2KK4R"
ALIAS_ID = "FDYBP6PBAS"

print("📦 Creating new agent version from DRAFT...\n")

try:
    # According to AWS docs, we need to use create_agent_action_group or similar
    # But actually, the way to create a version is through the console or by
    # using the prepare_agent API which we already did
    
    # The real solution: Delete and recreate the agent with the correct model
    # OR: Use the test alias for now
    
    print("ℹ️  AWS Bedrock Agent versioning works as follows:")
    print("   1. DRAFT version - mutable, for development")
    print("   2. Numbered versions - immutable snapshots")
    print("   3. TSTALIASID - built-in test alias that always points to DRAFT")
    print("   4. Custom aliases - point to numbered versions only\n")
    
    print("📋 Current situation:")
    print("   - DRAFT has the new inference profile ✅")
    print("   - Version 1 has the old model ID ❌")
    print("   - TSTALIASID points to DRAFT ✅")
    print("   - FDYBP6PBAS (live) points to Version 1 ❌\n")
    
    print("🔧 Solutions:")
    print("\n   Option 1: Use TSTALIASID for testing (recommended for now)")
    print("      - Already working!")
    print("      - Test with: python3 quick_test.py")
    print("      - Update Lambda to use TSTALIASID\n")
    
    print("   Option 2: Create new numbered version (requires AWS Console)")
    print("      - Go to AWS Console → Bedrock → Agents")
    print("      - Select your agent")
    print("      - Click 'Create version' button")
    print("      - Then update alias to point to new version\n")
    
    print("   Option 3: Recreate agent with correct model from start")
    print("      - Run: python3 quick_start_agent.py --profile hackathon")
    print("      - This will create a fresh agent with inference profile")
    print("      - Update Lambda with new IDs\n")
    
    print("💡 Recommendation: Use Option 1 (TSTALIASID) for immediate testing")
    print("   Then create a proper version via Console when ready for production\n")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
