#!/usr/bin/env python3
"""
Populate DynamoDB with content from processed_content.json
Usage: python3 populate_content.py [--clear] [--table TABLE_NAME] [--profile PROFILE]
"""
import json
import hashlib
import subprocess
import sys
import argparse

def generate_content_id(url):
    """Generate unique content_id from URL"""
    return f"enc-{hashlib.md5(url.encode()).hexdigest()[:8]}"

def transform_content(input_file='processed_content.json'):
    """Transform processed content to DynamoDB format"""
    with open(input_file, 'r', encoding='utf-8') as f:
        processed_data = json.load(f)
    
    transformed_data = []
    for item in processed_data:
        tags = item.get('tags', {})
        transformed_item = {
            'content_id': generate_content_id(item['url']),
            'title': item['title'],
            'url': item['url'],
            'summary': item['summary'],
            'personas': [p.replace('personas:', 'persona:') for p in tags.get('personas', [])],
            'types': [t.replace('types:', 'type:') for t in tags.get('types', [])],
            'stages': tags.get('stages', []),
            'topics': [t.replace('topics:', 'topic:') for t in tags.get('topics', [])]
        }
        transformed_data.append(transformed_item)
    
    # Save transformed data
    with open('transformed_content.json', 'w', encoding='utf-8') as f:
        json.dump(transformed_data, f, indent=2, ensure_ascii=False)
    
    return transformed_data

def clear_table(table_name, profile, region):
    """Clear all items from DynamoDB table"""
    print(f"🗑️  Clearing table {table_name}...")
    
    # Get all content_ids
    result = subprocess.run([
        'aws', 'dynamodb', 'scan',
        '--table-name', table_name,
        '--profile', profile,
        '--region', region,
        '--attributes-to-get', 'content_id',
        '--output', 'json'
    ], capture_output=True, text=True)
    
    if result.returncode != 0:
        print(f"❌ Error scanning table: {result.stderr}")
        return False
    
    items = json.loads(result.stdout).get('Items', [])
    
    for item in items:
        content_id = item['content_id']['S']
        subprocess.run([
            'aws', 'dynamodb', 'delete-item',
            '--table-name', table_name,
            '--profile', profile,
            '--region', region,
            '--key', json.dumps({'content_id': {'S': content_id}})
        ], capture_output=True)
        print(f"  Deleted: {content_id}")
    
    print(f"✅ Cleared {len(items)} items\n")
    return True

def populate_dynamodb(data, table_name, profile, region):
    """Populate DynamoDB with transformed data"""
    print(f"📤 Populating {table_name} with {len(data)} items...\n")
    
    success_count = 0
    error_count = 0
    
    for idx, item in enumerate(data, 1):
        # Convert to DynamoDB format
        dynamo_item = {
            'content_id': {'S': item['content_id']},
            'title': {'S': item['title']},
            'url': {'S': item['url']},
            'summary': {'S': item['summary']},
            'personas': {'L': [{'S': p} for p in item['personas']]},
            'types': {'L': [{'S': t} for t in item['types']]},
            'stages': {'L': [{'S': s} for s in item['stages']]},
            'topics': {'L': [{'S': t} for t in item['topics']]}
        }
        
        result = subprocess.run([
            'aws', 'dynamodb', 'put-item',
            '--table-name', table_name,
            '--profile', profile,
            '--region', region,
            '--item', json.dumps(dynamo_item)
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            success_count += 1
            print(f"✅ [{idx}/{len(data)}] {item['content_id']}: {item['title'][:50]}...")
        else:
            error_count += 1
            print(f"❌ [{idx}/{len(data)}] Failed: {item['content_id']}")
    
    return success_count, error_count

def verify_table(table_name, profile, region):
    """Verify item count in table"""
    result = subprocess.run([
        'aws', 'dynamodb', 'scan',
        '--table-name', table_name,
        '--profile', profile,
        '--region', region,
        '--select', 'COUNT',
        '--output', 'json'
    ], capture_output=True, text=True)
    
    if result.returncode == 0:
        count = json.loads(result.stdout).get('Count', 0)
        return count
    return None

def main():
    parser = argparse.ArgumentParser(description='Populate DynamoDB with encephalitis content')
    parser.add_argument('--clear', action='store_true', help='Clear table before populating')
    parser.add_argument('--table', default='dev-teambeacon-content', help='DynamoDB table name')
    parser.add_argument('--profile', default='hackathon', help='AWS profile')
    parser.add_argument('--region', default='us-west-2', help='AWS region')
    
    args = parser.parse_args()
    
    print("🚀 TeamBeacon Content Populator")
    print("=" * 60)
    print(f"Table: {args.table}")
    print(f"Profile: {args.profile}")
    print(f"Region: {args.region}")
    print(f"Clear first: {args.clear}")
    print()
    
    # Step 1: Transform content
    print("📝 Step 1: Transforming content...")
    try:
        data = transform_content()
        print(f"✅ Transformed {len(data)} items\n")
    except Exception as e:
        print(f"❌ Error transforming content: {e}")
        sys.exit(1)
    
    # Step 2: Clear table if requested
    if args.clear:
        if not clear_table(args.table, args.profile, args.region):
            sys.exit(1)
    
    # Step 3: Populate DynamoDB
    success, errors = populate_dynamodb(data, args.table, args.profile, args.region)
    
    print()
    print("=" * 60)
    print(f"✅ Successfully added: {success} items")
    if errors > 0:
        print(f"❌ Failed: {errors} items")
    
    # Step 4: Verify
    print("\n🔍 Verifying...")
    count = verify_table(args.table, args.profile, args.region)
    if count is not None:
        print(f"Items in table: {count}")
        if count == len(data):
            print("🎉 Success! All items populated.")
        else:
            print(f"⚠️  Warning: Expected {len(data)} items, found {count}")
    
    print("\nNext steps:")
    print(f"  aws dynamodb scan --table-name {args.table} --profile {args.profile} --limit 3")

if __name__ == '__main__':
    main()
