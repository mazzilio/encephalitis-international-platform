import { SQSEvent, SQSRecord } from 'aws-lambda';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION });
const dynamoClient = new DynamoDBClient({});
const s3Client = new S3Client({});

const TABLE_NAME = process.env.TABLE_NAME!;
const BUCKET_NAME = process.env.BUCKET_NAME!;
const MODEL_ID = process.env.MODEL_ID || 'global.anthropic.claude-opus-4-5-20251101-v1:0';

interface RefinedClassification {
  url: string;
  title: string;
  summary: string;
  refined_tags: {
    personas: string[];
    types: string[];
    stages: string[];
    topics: string[];
    symptoms: string[];
    locations: string[];
    conditions: string[];
    resource_type: string[];
    content_length: string;
    content_format: string;
    playlists: string[];
  };
  suggested_new_tags?: {
    category: string;
    tag: string;
    reasoning: string;
    confidence: number;
  }[];
  changes: {
    added_tags: Record<string, string[]>;
    removed_tags: Record<string, string[]>;
    reasoning: string;
  };
  recommendations: {
    primary_audience: string;
    best_used_when: string;
    user_journey_fit: string;
    staff_notes: string;
  };
  metadata: {
    estimated_reading_time: string;
    complexity_level: string;
    emotional_tone: string;
    actionable_content: boolean;
    requires_follow_up: boolean;
    priority_level: string;
  };
  confidence_scores: {
    overall_classification: number;
    persona_match: number;
    stage_match: number;
    topic_relevance: number;
  };
  classification_gaps?: {
    missing_categories: string[];
    ambiguous_content: string[];
    needs_review: boolean;
  };
  timestamp: string;
}

export const handler = async (event: SQSEvent): Promise<void> => {
  const promises = event.Records.map(record => processRecord(record));
  await Promise.allSettled(promises);
};

async function processRecord(record: SQSRecord): Promise<void> {
  try {
    const { url, content, jobId, batchId } = JSON.parse(record.body);

    await updateStatus(batchId, url, 'classifying');

    const classification = await classifyContentEnhanced(url, content);

    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: `results/${batchId}/${encodeURIComponent(url)}.json`,
      Body: JSON.stringify(classification, null, 2),
      ContentType: 'application/json',
    }));

    await updateStatus(batchId, url, 'completed', undefined, classification);

    console.log(`Successfully classified: ${url}`);
  } catch (error) {
    console.error('Error processing record:', error);
    const { url, batchId } = JSON.parse(record.body);
    await updateStatus(batchId, url, 'error', String(error));
  }
}

async function classifyContentEnhanced(url: string, content: string): Promise<RefinedClassification> {
  const prompt = buildEnhancedClassificationPrompt(url, content);

  const payload = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 4096,
    temperature: 0.3,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  };

  const command = new InvokeModelCommand({
    modelId: MODEL_ID,
    body: JSON.stringify(payload),
  });

  const response = await bedrockClient.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));
  
  const text = responseBody.content[0].text;
  
  // Extract JSON from response
  let jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    // Try to find JSON in code blocks
    const codeBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      jsonMatch = [codeBlockMatch[1]];
    }
  }
  
  if (!jsonMatch) {
    throw new Error('Failed to extract JSON from Bedrock response');
  }

  const classification: RefinedClassification = JSON.parse(jsonMatch[0]);
  classification.timestamp = new Date().toISOString();
  classification.url = url;

  return classification;
}

function buildEnhancedClassificationPrompt(url: string, content: string): string {
  const contentPreview = content.substring(0, 30000);
  
  return `You are an expert content classifier for Encephalitis International, a charity supporting people affected by encephalitis, their caregivers, and healthcare professionals.

Your task is to provide comprehensive classification tags for support resources to ensure accurate content recommendations.

## CONTENT TO ANALYZE:

**URL:** ${url}
**Content:**
${contentPreview}

## CLASSIFICATION FRAMEWORK:

### USER CONTEXT TAGS:

#### 1. PERSONAS (Primary Audience):
- **persona:patient** / **persona:person_affected**: Individuals diagnosed with or experiencing encephalitis
- **persona:caregiver**: Family members, friends, or carers supporting someone with encephalitis
- **persona:parent**: Parents of children with encephalitis
- **persona:professional**: Healthcare professionals, researchers, clinical staff
- **persona:bereaved**: Those who have lost someone to encephalitis

#### 2. USER LOCATION:
- **location:uk**: UK-specific content (benefits, NHS, UK services)
- **location:worldwide**: Globally relevant content
- **location:europe**: European-specific content
- **location:specific_country**: e.g., location:india, location:brazil, location:zambia, location:usa, location:australia

#### 3. CONDITION TYPE:
- **type:autoimmune**: Autoimmune encephalitis
- **type:infectious**: Infectious encephalitis (viral, bacterial)
- **type:post_infectious**: Post-infectious encephalitis
- **type:NMDA**: NMDA receptor encephalitis
- **type:MOG**: MOG antibody-associated disease
- **type:TBE**: Tick-borne encephalitis
- **type:HSV**: Herpes simplex virus encephalitis

#### 4. SPECIFIC CONDITIONS:
- **condition:nmda_receptor**: NMDA receptor encephalitis
- **condition:mog_ad**: MOG antibody-associated disease
- **condition:bbe**: Bickerstaff brainstem encephalitis
- **condition:japanese_encephalitis**: Japanese encephalitis
- **condition:west_nile**: West Nile virus
- **condition:covid_related**: COVID-19 related encephalitis
- **condition:lgi1**: LGI1 antibody encephalitis
- **condition:caspr2**: CASPR2 antibody encephalitis
- **condition:gaba**: GABA receptor encephalitis

#### 5. JOURNEY STAGE:
- **stage:pre_diagnosis**: Before diagnosis, symptoms, seeking help
- **stage:acute_hospital**: Hospital admission, acute treatment phase
- **stage:early_recovery**: First 6-12 months after hospital discharge
- **stage:long_term_management**: Living with long-term effects (12+ months)

### RESOURCE CONTEXT TAGS:

#### 6. SYMPTOMS ADDRESSED:
- **symptom:memory**: Memory problems, cognitive issues
- **symptom:behaviour**: Behavioral changes, personality changes
- **symptom:seizures**: Seizures, epilepsy
- **symptom:fatigue**: Fatigue, exhaustion
- **symptom:mobility**: Movement, coordination issues
- **symptom:speech**: Speech, communication difficulties
- **symptom:emotional**: Anxiety, depression, emotional regulation
- **symptom:sleep**: Sleep disturbances
- **symptom:sensory**: Sensory issues, hallucinations
- **symptom:pain**: Headaches, pain management

#### 7. RESOURCE TYPE:
- **resource:factsheet**: Educational factsheet or guide
- **resource:research**: Research study, clinical trial, scientific paper
- **resource:event**: Conference, webinar, support group meeting
- **resource:news**: News article, blog post, update
- **resource:video**: Video content
- **resource:personal_story**: Patient or caregiver story
- **resource:professional_contact**: Healthcare professional information
- **resource:fundraising**: Fundraising campaign or event
- **resource:support_service**: Direct support service (helpline, counseling)
- **resource:policy**: Policy document, guidelines
- **resource:training**: Training material, educational course

#### 8. RESOURCE TOPIC:
- **topic:research**: Research, studies, clinical trials
- **topic:treatment**: Treatment options, medications, therapies
- **topic:diagnosis**: Diagnostic procedures, tests
- **topic:memory**: Memory-specific content
- **topic:behaviour**: Behavior and personality changes
- **topic:school**: Education, returning to school
- **topic:work**: Employment, returning to work
- **topic:legal**: Legal matters, benefits, rights
- **topic:travel**: Travel advice, vaccinations
- **topic:rehabilitation**: Rehabilitation, therapy
- **topic:prevention**: Prevention, vaccines, awareness
- **topic:fundraising**: Fundraising activities
- **topic:mental_health**: Mental health support
- **topic:relationships**: Family, relationships, social life
- **topic:financial**: Financial support, benefits, insurance

#### 9. CONTENT LENGTH:
- **length:quick** (0-2 minutes read)
- **length:short** (3-5 minutes read)
- **length:medium** (6-10 minutes read)
- **length:long** (10+ minutes read)

#### 10. CONTENT FORMAT:
- **format:text**: Written article or document
- **format:video**: Video content
- **format:audio**: Podcast or audio
- **format:interactive**: Interactive tool or quiz
- **format:downloadable**: PDF or downloadable resource
- **format:webinar**: Live or recorded webinar
- **format:infographic**: Visual infographic

#### 11. PLAYLIST/GROUPING:
- **playlist:newly_diagnosed_pack**: Essential resources for newly diagnosed
- **playlist:caregiver_support**: Caregiver-focused resources
- **playlist:professional_education**: Professional development
- **playlist:research_updates**: Latest research findings
- **playlist:recovery_toolkit**: Recovery and rehabilitation resources
- **playlist:children_resources**: Resources for children with encephalitis
- **playlist:mental_health_support**: Mental health and wellbeing

## HANDLING EDGE CASES AND NEW CATEGORIES:

### If Content Doesn't Fit Existing Tags:

1. **Use the closest available tag** from the framework above
2. **Document the gap** in the "suggested_new_tags" field
3. **Provide reasoning** for why a new tag might be needed
4. **Flag for review** if classification is uncertain

### Suggested New Tags Format:

If you encounter content that doesn't fit well into existing categories, suggest new tags:

- **New symptom not listed**: Suggest "symptom:new_symptom_name"
- **New condition type**: Suggest "condition:new_condition_name"
- **New topic area**: Suggest "topic:new_topic_name"
- **New location**: Suggest "location:country_name"
- **New resource type**: Suggest "resource:new_type_name"

### Classification Gaps:

Identify when:
- Content is ambiguous or fits multiple categories equally
- Existing tags don't adequately describe the content
- Content addresses emerging topics not in the framework
- Geographic specificity is unclear
- Target audience is unclear or very broad

## YOUR TASK:

Analyze the content and provide refined tags that will help:
1. **Users** find the most relevant resources for their situation
2. **Staff** quickly identify appropriate content to recommend
3. **System** automatically match resources to user profiles
4. **Administrators** identify gaps in the classification system

## OUTPUT FORMAT:

Provide your response as a JSON object:

{
  "title": "Extract or generate a clear title",
  "summary": "2-3 sentence summary of the content",
  "refined_tags": {
    "personas": ["persona:patient", "persona:caregiver"],
    "types": ["type:autoimmune", "type:infectious"],
    "stages": ["stage:pre_diagnosis", "stage:acute_hospital"],
    "topics": ["topic:research", "topic:diagnosis"],
    "symptoms": ["symptom:memory", "symptom:behaviour"],
    "locations": ["location:worldwide"],
    "conditions": ["condition:nmda_receptor"],
    "resource_type": ["resource:factsheet"],
    "content_length": "length:medium",
    "content_format": "format:text",
    "playlists": ["playlist:newly_diagnosed_pack"]
  },
  "suggested_new_tags": [
    {
      "category": "symptom",
      "tag": "symptom:visual_disturbances",
      "reasoning": "Content discusses visual hallucinations and vision problems not covered by existing symptom tags",
      "confidence": 85
    }
  ],
  "changes": {
    "added_tags": {
      "personas": ["persona:parent"],
      "symptoms": ["symptom:memory"]
    },
    "removed_tags": {},
    "reasoning": "Brief explanation of classification decisions"
  },
  "recommendations": {
    "primary_audience": "Detailed description of who would benefit most",
    "best_used_when": "Specific scenarios when staff should recommend this",
    "user_journey_fit": "Where this fits in the user's journey",
    "staff_notes": "Practical tips for staff using this resource"
  },
  "metadata": {
    "estimated_reading_time": "5 minutes",
    "complexity_level": "beginner",
    "emotional_tone": "supportive",
    "actionable_content": true,
    "requires_follow_up": false,
    "priority_level": "high"
  },
  "confidence_scores": {
    "overall_classification": 85,
    "persona_match": 90,
    "stage_match": 80,
    "topic_relevance": 85
  },
  "classification_gaps": {
    "missing_categories": ["No existing tag for pediatric-specific treatment protocols"],
    "ambiguous_content": ["Content could apply to both pre-diagnosis and acute stages equally"],
    "needs_review": false
  }
}

## IMPORTANT GUIDELINES:

1. **Be Specific**: Use precise tags (e.g., "symptom:memory" not just "topic:research")
2. **Be Accurate**: Only add tags clearly supported by the content
3. **Be Practical**: Consider how staff will use these tags in real conversations
4. **Be Empathetic**: Remember this content serves people in difficult situations
5. **Be Comprehensive**: Include all relevant tags, but avoid over-tagging
6. **Consider Context**: Think about when in their journey someone would need this
7. **Geographic Awareness**: Tag UK-specific content appropriately (benefits, NHS, etc.)
8. **Multiple Personas**: Many resources serve multiple audiences - tag all relevant ones
9. **Flag Gaps**: If existing tags don't fit well, suggest new ones
10. **Be Flexible**: Use closest available tags while documenting limitations

## SPECIAL CONSIDERATIONS:

- **Research content**: Usually relevant to professionals but also patients/caregivers seeking information
- **Personal stories**: Powerful for newly diagnosed and those in recovery
- **Clinical guidelines**: Primarily for professionals but may interest informed patients
- **Fundraising**: Often relevant to bereaved families and long-term supporters
- **International content**: Tag location appropriately for travel, regional studies, etc.
- **Emerging topics**: COVID-related encephalitis, long-term effects, new treatments
- **Rare conditions**: May need new condition tags
- **Cultural content**: May need location-specific tags beyond countries

Now analyze the content and provide your refined classification.`;
}

async function updateStatus(
  batchId: string,
  url: string,
  status: string,
  error?: string,
  data?: RefinedClassification
): Promise<void> {
  let updateExpression = 'SET #status = :status, updatedAt = :timestamp';
  const expressionAttributeValues: any = {
    ':status': { S: status },
    ':timestamp': { S: new Date().toISOString() },
  };
  const expressionAttributeNames: any = {
    '#status': 'status',
  };

  if (error) {
    updateExpression += ', #error = :error';
    expressionAttributeValues[':error'] = { S: error };
    expressionAttributeNames['#error'] = 'error';
  }

  if (data) {
    updateExpression += ', #data = :data';
    expressionAttributeValues[':data'] = { S: JSON.stringify(data) };
    expressionAttributeNames['#data'] = 'data';
  }

  await dynamoClient.send(new UpdateItemCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: { S: `BATCH#${batchId}` },
      SK: { S: `URL#${url}` },
    },
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
  }));
}
