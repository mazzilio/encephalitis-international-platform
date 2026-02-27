# Test Directory

This directory contains everything needed to test the TeamBeacon API.

## 📁 Files

| File | Purpose |
|------|---------|
| `test-api.sh` | Run automated API tests (content classification) |
| `test-transcribe.sh` | Test transcription API |
| `create-test-audio.sh` | Generate test audio file |
| `populate_dynamodb.sh` | Populate DynamoDB with sample data |
| `sample_content.json` | Sample content items (15 items) |
| `test-requests.json` | Collection of test request payloads |
| `README.md` | This file |

## 🚀 Quick Start

### 1. Populate DynamoDB

First, add sample data to your DynamoDB table:

```bash
chmod +x populate_dynamodb.sh
./populate_dynamodb.sh dev-teambeacon-content hackathon
```

### 2. Run Content API Tests

Test your deployed content classification API:

```bash
chmod +x test-api.sh
./test-api.sh
```

### 3. Test Transcription API

Create test audio and test transcription:

```bash
# Generate test audio
chmod +x create-test-audio.sh
./create-test-audio.sh

# Test transcription
chmod +x test-transcribe.sh
./test-transcribe.sh
```

## 📝 Test Scenarios

### Content Classification API

The test suite includes:

1. **Patient with Memory Issues** - Tests memory topic matching
2. **Parent - Child School Support** - Tests school + behaviour topics
3. **Caregiver - Legal Support** - Tests legal topic matching
4. **Professional - Research Query** - Tests research topic matching

### Transcription API

The transcription tests include:

1. **Auto Language Detection** - Automatically detects spoken language
2. **English Transcription** - Transcribes English audio
3. **Confidence Scoring** - Returns transcription confidence level

## 🧪 Manual Testing

### Test with curl

```bash
curl -X POST "https://YOUR_API_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{
    "userRole": "patient",
    "userQuery": "I need help with memory issues",
    "userQueryType": "Text",
    "userData": {
      "stage": "long_term_management",
      "concerns": ["memory"],
      "ageGroup": "adult"
    },
    "limit": 10
  }'
```

### Test with Postman

1. Import `test-requests.json`
2. Set endpoint URL
3. Send requests

### Test in AWS Console

1. Go to Lambda Console
2. Find `dev-teambeacon-handler`
3. Click "Test" tab
4. Create test event with payload from `test-requests.json`

## 📊 Sample Data

The `sample_content.json` file contains 15 content items covering:

- **Personas**: patient, parent, caregiver, professional
- **Types**: autoimmune, infectious, HSV, NMDA, LGI1, post_infectious
- **Stages**: pre_diagnosis, acute_hospital, early_recovery, long_term_management
- **Topics**: memory, behaviour, legal, school, travel, research

## 🔍 Verify Data

Check if data was added to DynamoDB:

```bash
aws dynamodb scan \
  --table-name dev-teambeacon-content \
  --profile hackathon \
  --limit 5
```

Count total items:

```bash
aws dynamodb scan \
  --table-name dev-teambeacon-content \
  --profile hackathon \
  --select COUNT
```

## 🛠️ Troubleshooting

### No results returned

```bash
# Check if table has data
aws dynamodb scan --table-name dev-teambeacon-content --profile hackathon --limit 1

# Re-populate if empty
./populate_dynamodb.sh dev-teambeacon-content hackathon
```

### API returns errors

```bash
# Check CloudWatch logs
sam logs -n UnifiedHandlerFunction --stack-name teambeacon-api --tail

# Or in AWS Console
# CloudWatch → Log groups → /aws/lambda/dev-teambeacon-handler
```

### Connection errors

- Verify API endpoint URL is correct
- Check AWS credentials: `aws sts get-caller-identity --profile hackathon`
- Ensure Lambda is deployed: `aws lambda get-function --function-name dev-teambeacon-handler --profile hackathon`

## 📚 Test Request Examples

See `test-requests.json` for complete examples of:

- `patient_memory` - Patient with memory concerns
- `parent_school` - Parent with school-related concerns
- `parent_seizures` - Parent with seizure concerns
- `caregiver_legal` - Caregiver seeking legal support
- `professional_research` - Professional research query
- `patient_prediagnosis` - Pre-diagnosis patient
- `patient_nmda` - NMDA-specific query
- `caregiver_support` - Caregiver support needs

## 🎯 Expected Response Format

```json
{
  "classification": {
    "personas": ["persona:patient"],
    "types": [],
    "stages": ["stage:long_term_management"],
    "topics": ["topic:memory"]
  },
  "items": [
    {
      "content_id": "enc-001",
      "title": "Memory Support Guide for Patients",
      "url": "https://www.encephalitis.info/support/memory-guide",
      "summary": "Comprehensive guide...",
      "personas": ["persona:patient", "persona:caregiver"],
      "topics": ["topic:memory"]
    }
  ],
  "count": 2,
  "scanned_count": 15
}
```

## 🔄 Update Test Data

To modify test data:

1. Edit `sample_content.json`
2. Run `./populate_dynamodb.sh` to update DynamoDB
3. Run `./test-api.sh` to verify changes

## 📞 Need Help?

- Check `../sam-deployment/TROUBLESHOOTING.md`
- View CloudWatch logs
- Verify DynamoDB table exists and has data
