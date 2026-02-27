# Content Management for TeamBeacon

## Purpose

This directory manages the 173 real content items from encephalitis.info that power TeamBeacon's personalized content recommendations during the hackathon.

## Why We Need This

The Lambda function uses AI (Bedrock) to understand user queries and match them with relevant content based on:
- **Personas**: patient, caregiver, parent, professional, bereaved
- **Types**: autoimmune, infectious, HSV, NMDA, etc.
- **Stages**: pre_diagnosis, acute_hospital, early_recovery, long_term_management
- **Topics**: memory, behaviour, research, school, legal, travel

## Files

- **populate_content.py** - Single script to populate DynamoDB
- **processed_content.json** - Original scraped content (173 items)
- **transformed_content.json** - DynamoDB-ready format (auto-generated)

## Quick Start

```bash
# Populate DynamoDB (adds/updates items)
python3 populate_content.py

# Clear table first, then populate
python3 populate_content.py --clear

# Custom table/profile
python3 populate_content.py --table my-table --profile my-profile
```

## Options

```
--clear              Clear table before populating
--table TABLE_NAME   DynamoDB table name (default: dev-teambeacon-content)
--profile PROFILE    AWS profile (default: hackathon)
--region REGION      AWS region (default: us-west-2)
```

## What It Does

1. Reads `processed_content.json`
2. Transforms to DynamoDB schema
3. Saves to `transformed_content.json`
4. Optionally clears existing items
5. Populates DynamoDB with all 173 items
6. Verifies the count

## Verify

```bash
# Count items (should be 173)
aws dynamodb scan --table-name dev-teambeacon-content --profile hackathon --select COUNT

# View sample items
aws dynamodb scan --table-name dev-teambeacon-content --profile hackathon --limit 3
```

## Content Statistics

- **Total**: 173 items
- **Personas**: 5 types
- **Types**: 8 types  
- **Stages**: 4 types
- **Topics**: 6 types

## Troubleshooting

**Table not found**: Check table name and AWS profile
```bash
aws dynamodb list-tables --profile hackathon
```

**Access denied**: Verify AWS credentials
```bash
aws sts get-caller-identity --profile hackathon
```

**Script fails**: Check AWS CLI is installed
```bash
aws --version
```
