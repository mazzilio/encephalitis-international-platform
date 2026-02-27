"""
Upload classified resources to DynamoDB
"""

import boto3
import json
from decimal import Decimal
from typing import Any, Dict


def convert_floats_to_decimal(obj: Any) -> Any:
    """Convert floats to Decimal for DynamoDB"""
    if isinstance(obj, float):
        return Decimal(str(obj))
    elif isinstance(obj, dict):
        return {k: convert_floats_to_decimal(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_floats_to_decimal(item) for item in obj]
    return obj


def create_table_if_not_exists(dynamodb, table_name: str):
    """Create DynamoDB table if it doesn't exist"""
    try:
        # Check if table exists
        table = dynamodb.Table(table_name)
        table.load()
        print(f"✓ Table '{table_name}' already exists")
        return table
    except dynamodb.meta.client.exceptions.ResourceNotFoundException:
        # Create table
        print(f"Creating table '{table_name}'...")
        table = dynamodb.create_table(
            TableName=table_name,
            KeySchema=[
                {'AttributeName': 'resource_id', 'KeyType': 'HASH'},  # Partition key
                {'AttributeName': 'resource_type', 'KeyType': 'RANGE'}  # Sort key
            ],
            AttributeDefinitions=[
                {'AttributeName': 'resource_id', 'AttributeType': 'S'},
                {'AttributeName': 'resource_type', 'AttributeType': 'S'}
            ],
            BillingMode='PAY_PER_REQUEST'  # On-demand pricing
        )
        
        # Wait for table to be created
        table.wait_until_exists()
        print(f"✓ Table '{table_name}' created successfully")
        return table


def upload_to_dynamodb(
    json_file: str = 'output/dynamodb_resources.json',
    table_name: str = 'EncephalitisResources',
    region_name: str = 'us-east-1'
):
    """
    Upload resources to DynamoDB
    
    Args:
        json_file: Path to DynamoDB JSON file
        table_name: DynamoDB table name
        region_name: AWS region
    """
    
    print("=" * 80)
    print("UPLOADING TO DYNAMODB")
    print("=" * 80)
    
    # Initialize DynamoDB
    dynamodb = boto3.resource('dynamodb', region_name=region_name)
    
    # Create table if needed
    table = create_table_if_not_exists(dynamodb, table_name)
    
    # Load data
    print(f"\nLoading data from {json_file}...")
    with open(json_file, 'r', encoding='utf-8') as f:
        items = json.load(f)
    
    print(f"Found {len(items)} items to upload")
    
    # Convert floats to Decimal (DynamoDB requirement)
    items = [convert_floats_to_decimal(item) for item in items]
    
    # Batch upload
    print("\nUploading items...")
    uploaded = 0
    failed = 0
    
    with table.batch_writer() as batch:
        for idx, item in enumerate(items, 1):
            try:
                batch.put_item(Item=item)
                uploaded += 1
                if idx % 100 == 0:
                    print(f"  Uploaded {idx}/{len(items)} items...")
            except Exception as e:
                print(f"  ✗ Failed to upload item {idx}: {e}")
                failed += 1
    
    print("\n" + "=" * 80)
    print("UPLOAD COMPLETE")
    print("=" * 80)
    print(f"\nSuccessfully uploaded: {uploaded} items")
    print(f"Failed: {failed} items")
    print(f"Table: {table_name}")
    print(f"Region: {region_name}")
    
    # Verify upload
    print("\nVerifying upload...")
    response = table.scan(Select='COUNT')
    item_count = response['Count']
    print(f"✓ Table contains {item_count} items")
    
    return {
        'uploaded': uploaded,
        'failed': failed,
        'table_name': table_name,
        'total_in_table': item_count
    }


def query_examples(table_name: str = 'EncephalitisResources', region_name: str = 'us-east-1'):
    """
    Example queries for the DynamoDB table
    """
    
    print("\n" + "=" * 80)
    print("EXAMPLE QUERIES")
    print("=" * 80)
    
    dynamodb = boto3.resource('dynamodb', region_name=region_name)
    table = dynamodb.Table(table_name)
    
    # Example 1: Get a specific resource
    print("\n1. Get specific resource:")
    print("   table.get_item(Key={'resource_id': 'web_scraper_00001', 'resource_type': 'web_scraper'})")
    
    # Example 2: Query by resource type
    print("\n2. Query by resource type:")
    print("   table.query(KeyConditionExpression=Key('resource_type').eq('web_scraper'))")
    
    # Example 3: Scan with filter
    print("\n3. Scan with filter (e.g., high priority items):")
    print("   table.scan(FilterExpression=Attr('metadata.priority_level').eq('high'))")
    
    # Example 4: Get items for a specific persona
    print("\n4. Get items for specific persona:")
    print("   table.scan(FilterExpression=Attr('personas').contains('persona:patient'))")
    
    # Example 5: Get items by stage
    print("\n5. Get items by journey stage:")
    print("   table.scan(FilterExpression=Attr('stages').contains('stage:newly_diagnosed'))")


if __name__ == "__main__":
    import sys
    
    # Check for dry-run mode
    dry_run = '--dry-run' in sys.argv
    
    if dry_run:
        print("\n🧪 DRY RUN MODE: No actual upload will occur")
        print("\nWould upload from: output/dynamodb_resources.json")
        print("Would create/use table: EncephalitisResources")
        print("Would use region: us-east-1")
        print("\nTo actually upload, run without --dry-run flag")
    else:
        # Upload to DynamoDB
        result = upload_to_dynamodb(
            json_file='output/dynamodb_resources.json',
            table_name='EncephalitisResources',
            region_name='us-east-1'
        )
        
        # Show example queries
        query_examples()
        
        print("\n✅ All done!")
        print("\nNext steps:")
        print("1. Test queries in AWS Console")
        print("2. Integrate with web app")
        print("3. Set up indexes if needed")
