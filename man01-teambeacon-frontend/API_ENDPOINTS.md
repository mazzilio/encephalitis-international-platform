# API Endpoint Specification

This document outlines the REST API endpoints that your backend needs to implement for the Encephalitis User Guide application.

## Base URL

```
{VITE_API_BASE_URL}/
```

Default: `http://localhost:3000/api`

---

## Endpoints

### 1. Health Check

**GET** `/health`

Check if the API is operational.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-13T10:30:00Z"
}
```

---

### 2. Submit Patient Journey

**POST** `/journey/patient`

Submit patient journey data and receive personalized guidance.

**Request Body:**
```json
{
  "userRole": "patient",
  "journeyData": {
    "location": "uk" | "outside_uk" | null,
    "stage": "recently_diagnosed" | "in_recovery" | "long_term_survivor" | "unsure",
    "recoveryStage": "in_hospital" | "early_recovery" | "ongoing_recovery" | "long_term" | null,
    "encephalitisType": "infectious" | "autoimmune" | "unknown" | "other_multiple" | null,
    "concerns": ["memory", "fatigue", "seizures", "mood", "speech_movement", "returning_work", "understanding"],
    "ageGroup": "child" | "teen" | "adult" | "older_adult" | null
  }
}
```

**Field Descriptions:**
- `location`: User's geographic location (UK or outside UK) - helps provide location-specific resources and support services
- `stage`: Whether the patient has received a diagnosis
- `recoveryStage`: Where the patient is in their recovery journey (helps tailor timeline-appropriate resources)
- `encephalitisType`: Type of encephalitis (infectious, autoimmune, unknown, or other/multiple) - helps provide type-specific information
- `concerns`: Array of up to 3 main concerns (minimum 1 required)
- `ageGroup`: Optional age group for age-appropriate resources

**Response:**
```json
{
  "success": true,
  "data": {
    "heading": "Your Personalized Encephalitis Recovery Guide",
    "subheading": "Based on your current stage and concerns",
    "sections": [
      {
        "title": "Understanding Your Stage",
        "content": "You mentioned you were recently diagnosed...",
        "type": "info"
      },
      {
        "title": "Managing Memory and Concentration",
        "content": "Memory issues are common after encephalitis...",
        "type": "tip"
      }
    ],
    "resources": [
      {
        "title": "What is Encephalitis?",
        "url": "https://www.encephalitis.info/about-encephalitis/what-is-encephalitis/",
        "description": "Comprehensive overview from Encephalitis International",
        "type": "external"
      }
    ],
    "warningSigns": [
      "Sudden worsening of symptoms",
      "New seizures or increased seizure frequency",
      "Severe headache or fever"
    ],
    "nextSteps": [
      "Contact your neurologist for follow-up",
      "Join a support group",
      "Keep a symptom diary"
    ]
  },
  "timestamp": "2026-01-13T10:30:00Z"
}
```

---

### 3. Submit Caregiver Journey

**POST** `/journey/caregiver`

Submit caregiver journey data and receive support guidance.

**Request Body:**
```json
{
  "userRole": "caregiver",
  "journeyData": {
    "location": "uk" | "outside_uk" | null,
    "diagnosisStatus": "confirmed" | "suspected" | "not_sure",
    "careStage": "in_hospital_or_discharged" | "early_recovery" | "ongoing_recovery" | "long_term",
    "encephalitisType": "infectious" | "autoimmune" | "unknown" | "other_multiple",
    "challenges": ["behavior_changes", "memory_confusion", "physical_care", "emotional_stress", "communication_doctors", "long_term_planning"],
    "role": "full_time" | "occasional",
    "additionalQuery": "string (optional)"
  }
}
```

**Response:** Same structure as patient journey response, tailored for caregivers.

---

### 4. Submit Professional Journey

**POST** `/journey/professional`

Submit professional journey data and receive relevant resources.

**Request Body:**
```json
{
  "userRole": "professional",
  "journeyData": {
    "location": "uk" | "outside_uk" | null,
    "professionalRole": "clinician" | "researcher" | "allied_health" | "student",
    "focusArea": "diagnosis" | "acute_management" | "rehabilitation" | "long_term_outcomes" | "pediatric" | "autoimmune_infectious",
    "needs": ["clinical_guidelines", "latest_research", "patient_education", "assessment_tools"]
  }
}
```

**Response:** Same structure as patient journey response, tailored for professionals.

---

### 5. Save Results (Optional)

**POST** `/journey/save-results`

Save journey results for later retrieval or sharing.

**Request Body:**
```json
{
  "resultsId": "unique-result-id",
  "email": "user@example.com" // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "shareUrl": "https://yourapp.com/results/abc123xyz"
  },
  "timestamp": "2026-01-13T10:30:00Z"
}
```

---

### 6. Get Results (Optional)

**GET** `/journey/results/:resultsId`

Retrieve previously saved results.

**Response:** Same structure as journey submission response.

---

### 7. Email Results (Optional)

**POST** `/journey/email-results`

Send results to an email address (e.g., to share with doctor).

**Request Body:**
```json
{
  "resultsId": "unique-result-id",
  "recipientEmail": "doctor@example.com",
  "recipientName": "Dr. Smith" // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true
  },
  "timestamp": "2026-01-13T10:30:00Z"
}
```

---

### 8. Analytics Event (Optional)

**POST** `/analytics/event`

Log analytics events for tracking user journeys.

**Request Body:**
```json
{
  "eventName": "journey_submitted" | "journey_completed" | "journey_error",
  "eventData": {
    "userRole": "patient" | "caregiver" | "professional",
    "timestamp": "2026-01-13T10:30:00Z"
  },
  "timestamp": "2026-01-13T10:30:00Z"
}
```

**Response:**
```json
{
  "success": true
}
```

---

## Error Response Format

All endpoints should return errors in this format:

```json
{
  "success": false,
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE",
    "status": 400,
    "details": {
      // Additional error context
    }
  },
  "timestamp": "2026-01-13T10:30:00Z"
}
```

### Common Error Codes

- `BAD_REQUEST` (400) - Invalid request data
- `UNAUTHORIZED` (401) - Authentication required
- `FORBIDDEN` (403) - Insufficient permissions
- `NOT_FOUND` (404) - Resource not found
- `RATE_LIMITED` (429) - Too many requests
- `SERVER_ERROR` (500) - Internal server error
- `NETWORK_ERROR` - Connection failed

---

### 4. Submit Voice Recording

**POST** `/journey/voice`

Submit a voice recording (up to 2 minutes) for AI-powered analysis and personalized guidance. This endpoint uses multipart/form-data to handle audio file uploads.

**Request:**
- **Content-Type**: `multipart/form-data`
- **Timeout**: 60 seconds (to accommodate audio processing)

**Form Data:**
| Field | Type | Description |
|-------|------|-------------|
| `audio` | File | Audio file (webm or mp4 format) |
| `duration` | String | Recording duration in seconds |
| `timestamp` | String | ISO 8601 timestamp of when recording was made |

**Example Request:**
```javascript
const formData = new FormData();
formData.append('audio', audioBlob, 'recording-1234567890.webm');
formData.append('duration', '85'); // 1 minute 25 seconds
formData.append('timestamp', '2026-01-14T10:30:00Z');

fetch('/journey/voice', {
  method: 'POST',
  body: formData,
});
```

**Response:**
```json
{
  "success": true,
  "data": {
    "heading": "Your Personalized Encephalitis Guide",
    "subheading": "Based on your voice recording",
    "detectedRole": "patient" | "caregiver" | "professional",
    "transcription": "I am a patient who was recently diagnosed...", 
    "sections": [
      {
        "title": "Understanding Your Situation",
        "content": "Based on what you shared, you are...",
        "type": "info"
      },
      {
        "title": "Recommended Resources",
        "content": "Here are some resources that may help...",
        "type": "resource"
      }
    ],
    "resources": [
      {
        "title": "What is Encephalitis?",
        "url": "https://www.encephalitis.info/about-encephalitis/what-is-encephalitis/",
        "description": "Comprehensive overview",
        "type": "external"
      }
    ],
    "warningSigns": [
      "Sudden worsening of symptoms",
      "New seizures or increased seizure frequency"
    ],
    "nextSteps": [
      "Schedule a follow-up with your neurologist",
      "Join a support group",
      "Keep a symptom diary"
    ]
  },
  "timestamp": "2026-01-14T10:35:00Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VOICE_PROCESSING_ERROR",
    "message": "Unable to process audio file. Please ensure the recording is clear.",
    "details": "Transcription confidence too low"
  },
  "timestamp": "2026-01-14T10:35:00Z"
}
```

**Backend Processing Requirements:**
1. **Audio Transcription**: Use speech-to-text service (e.g., AWS Transcribe, Google Speech-to-Text, OpenAI Whisper)
2. **Natural Language Processing**: Analyze transcription to:
   - Detect user role (patient/caregiver/professional)
   - Extract key concerns and needs
   - Identify emotional tone and urgency
3. **Content Generation**: Generate personalized guidance based on analysis
4. **Security**: 
   - Validate audio file format and size
   - Scan for malicious content
   - Do not store audio files long-term without consent
   - Ensure HIPAA compliance if storing PHI

**Supported Audio Formats:**
- `audio/webm` (preferred for Chrome/Edge)
- `audio/mp4` (preferred for Safari)
- Max file size: 10MB
- Max duration: 120 seconds (2 minutes)

**Rate Limiting:**
- Recommended: 5 requests per hour per IP
- Heavy processing required - implement appropriate throttling

---

## CORS Configuration

Your API should allow requests from your frontend domain:

```
Access-Control-Allow-Origin: https://your-app-domain.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Request-Time
```

---

## Testing

You can test the API integration using tools like:
- **Postman** - Import the request examples above
- **curl** - Command line testing
- **Mock API** - Use a service like json-server or mockoon for development

### Example Mock Response for Testing

Create a simple mock server or use the provided request/response examples to test the frontend before your backend is ready.

---

## Security Considerations

1. **Rate Limiting**: Implement rate limiting to prevent abuse
2. **Input Validation**: Validate all incoming data
3. **Sanitization**: Sanitize user inputs to prevent XSS
4. **HTTPS**: Always use HTTPS in production
5. **No PHI Storage**: Do not store Personal Health Information without proper HIPAA compliance
6. **Session Management**: If adding authentication, use secure session management

---

## Content Personalization Logic

Your backend should implement logic to personalize responses based on:

1. **Patient Journey**:
   - Location-specific resources and support services (UK-based vs. international)
   - Diagnosis stage-appropriate information
   - Recovery stage-specific guidance (acute care, early recovery, ongoing rehab, or long-term management)
   - Encephalitis type-specific information (infectious vs. autoimmune causes, treatments, and outcomes)
   - Concern-specific guidance
   - Age-appropriate resources

2. **Caregiver Journey**:
   - Location-specific caregiver support services and resources
   - Care stage support
   - Challenge-specific tips
   - Burnout prevention resources

3. **Professional Journey**:
   - Location-specific professional resources and guidelines
   - Role-appropriate resources
   - Focus area research
   - Need-specific tools

4. **Voice Recording Journey**:
   - Automatic role detection from speech content
   - Sentiment analysis for emotional state
   - Key phrase extraction for concerns
   - Contextual understanding of user needs
   - Natural language response generation

Integrate with Encephalitis International resources and guidelines.

### Recommended AI/ML Services for Voice Processing

- **Speech-to-Text**: AWS Transcribe, Google Cloud Speech-to-Text, Azure Speech Services, OpenAI Whisper
- **Natural Language Understanding**: AWS Comprehend Medical, Google Healthcare NLP, OpenAI GPT-4
- **Content Generation**: OpenAI GPT-4, Anthropic Claude, or custom models
- **Sentiment Analysis**: AWS Comprehend, Google Natural Language API
