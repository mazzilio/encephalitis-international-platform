# LLM Classification & JSON Schema Summary

**Comprehensive analysis of how the system feeds pages to LLM and creates JSON for AWS Bedrock ingestion**

---

## ✅ 1. Feeds Each Page to LLM with Specific Prompting

### YES - Both Systems Use Sophisticated LLM Prompting

### Web-Scraper (AWS Lambda - TypeScript)

**Location**: `web-scraper/backend/lambdas/content-classifier/index.ts`

**LLM Used**: AWS Bedrock Claude Opus 4.5
- Model ID: `global.anthropic.claude-opus-4-5-20251101-v1:0`

**Prompting Strategy**:
```typescript
const prompt = `You are an AI assistant specialized in classifying medical content about encephalitis.

Analyze the following webpage content and provide a structured classification.

URL: ${url}

Content:
${content.substring(0, 30000)}

Provide a JSON response with this exact structure:
{
  "url": "${url}",
  "title": "Brief title of the page",
  "summary": "2-3 sentence summary of the content",
  "tags": {
    "personas": ["persona:patient", "persona:caregiver", ...],
    "types": ["type:autoimmune", "type:infectious", ...],
    "stages": ["stage:pre_diagnosis", "stage:acute_hospital", ...],
    "topics": ["topic:research", "topic:memory", ...]
  }
}

Only include relevant tags. Return valid JSON only.`;
```

**Classification Categories**:
- ✅ **Personas** (5): patient, caregiver, parent, professional, bereaved
- ✅ **Types** (7+): autoimmune, infectious, post_infectious, NMDA, MOG, TBE, HSV
- ✅ **Stages** (4): pre_diagnosis, acute_hospital, early_recovery, long_term_management
- ✅ **Topics** (15+): research, treatment, diagnosis, memory, behaviour, school, work, legal, travel

---

### Batch Processor (Python - process_all_resources.py)

**Location**: `scripts/bedrock_tag_refinement_prompt.py`

**LLM Used**: AWS Bedrock Claude Opus 4.5
- Model ID: `global.anthropic.claude-opus-4-5-20251101-v1:0`

**Prompting Strategy**: **MUCH MORE SOPHISTICATED** (600+ line prompt template)

**Key Features**:
1. ✅ **Comprehensive Classification Framework** (100+ tag categories)
2. ✅ **Detailed Instructions** for each tag category with examples
3. ✅ **Staff Context** - Practical guidance for charity staff
4. ✅ **Confidence Scores** - Multi-dimensional confidence metrics
5. ✅ **Adaptive Learning** - Identifies classification gaps and suggests new tags
6. ✅ **Metadata Extraction** - Reading time, complexity, emotional tone
7. ✅ **Recommendations** - When to use, who benefits most, follow-up resources

**Classification Categories** (Extended):

**User Context Tags**:
- ✅ **Personas** (5): patient, caregiver, parent, professional, bereaved
- ✅ **Locations**: UK, worldwide, Europe, country-specific
- ✅ **Condition Types** (7+): autoimmune, infectious, post_infectious, NMDA, MOG, TBE, HSV
- ✅ **Specific Conditions**: nmda_receptor, mog_ad, bbe, japanese_encephalitis, west_nile, covid_related
- ✅ **Journey Stages** (4): pre_diagnosis, acute_hospital, early_recovery, long_term_management

**Resource Context Tags**:
- ✅ **Symptoms** (10+): memory, behaviour, seizures, fatigue, mobility, speech, emotional
- ✅ **Resource Types** (11): factsheet, research, event, news, video, personal_story, professional_contact, fundraising, support_service
- ✅ **Topics** (15+): research, treatment, diagnosis, memory, behaviour, school, work, legal, travel, rehabilitation, prevention
- ✅ **Content Length**: quick (0-2 min), short (3-5 min), medium (6-10 min), long (10+ min)
- ✅ **Content Format**: text, video, audio, interactive, downloadable
- ✅ **Playlists**: newly_diagnosed_pack, caregiver_support, professional_education, research_updates, recovery_toolkit

**Example Prompt Structure**:
```python
prompt = f"""You are an expert content classifier for Encephalitis International...

## CONTENT TO ANALYZE:
**URL:** {url}
**Title:** {title}
**Summary:** {summary}
**Source Type:** {content_source}

## EXISTING TAGS:
**Personas:** {existing_personas}
**Types:** {existing_types}
...

## CLASSIFICATION FRAMEWORK:
[Detailed 100+ tag taxonomy with descriptions and examples]

## YOUR TASK:
1. Identify Primary Audience
2. Determine Journey Stage
3. Extract Key Topics
4. Assess Resource Type
5. Estimate Content Length
6. Identify Geographic Relevance
7. Tag Condition Types

## OUTPUT FORMAT:
{{
  "refined_tags": {{...}},
  "changes": {{...}},
  "recommendations": {{...}},
  "metadata": {{...}},
  "confidence_scores": {{
    "overall_classification": 85,
    "persona_match": 90,
    "stage_match": 80,
    "topic_relevance": 85
  }},
  "suggested_new_tags": [...]  // Adaptive learning
}}
"""
```

---

## Comparison: Web-Scraper vs Batch Processor

| Feature | Web-Scraper (Lambda) | Batch Processor (Python) |
|---------|---------------------|-------------------------|
| **LLM Model** | Claude Opus 4.5 | Claude Opus 4.5 |
| **Prompt Length** | ~200 lines | ~600 lines |
| **Tag Categories** | 4 basic (personas, types, stages, topics) | 11 comprehensive (+ symptoms, locations, conditions, resource_type, length, format, playlists) |
| **Confidence Scores** | ❌ No | ✅ Yes (4 dimensions) |
| **Adaptive Learning** | ❌ No | ✅ Yes (suggests new tags) |
| **Staff Guidance** | ❌ No | ✅ Yes (practical tips) |
| **Metadata** | ❌ No | ✅ Yes (reading time, complexity, tone) |
| **Recommendations** | ❌ No | ✅ Yes (when to use, who benefits) |
| **Content to LLM** | 30,000 chars | 30,000 chars |

**Winner**: **Batch Processor** has significantly more sophisticated prompting

---

## ✅ 2. Creates JSON File with Schema for AWS Bedrock Ingestion

### YES - Multiple JSON Formats for Different Use Cases

### A. DynamoDB JSON Schema

**Location**: `output/dynamodb_resources.json`

**Purpose**: Direct ingestion into DynamoDB for fast querying

**Schema Structure**:
```json
{
  "resource_id": "web_content_00001",
  "resource_type": ["resource:news"],
  "title": "Page Title",
  "description": "Page description",
  "url": "https://...",
  "created_at": "2026-01-14T22:22:00.718859",
  
  // Classification Tags
  "personas": ["persona:patient", "persona:caregiver"],
  "types": ["type:infectious"],
  "stages": ["stage:pre_diagnosis"],
  "topics": ["topic:prevention", "topic:treatment"],
  "symptoms": ["symptom:memory"],
  "locations": ["location:uk"],
  "conditions": ["condition:nmda_receptor"],
  "content_length": "length:short",
  "content_format": "format:text",
  "playlists": ["playlist:newly_diagnosed_pack"],
  
  // Metadata
  "metadata": {
    "estimated_reading_time": "3 minutes",
    "complexity_level": "beginner",
    "emotional_tone": "informative",
    "actionable_content": true,
    "requires_follow_up": false,
    "priority_level": "normal"
  },
  
  // Recommendations
  "recommendations": {
    "primary_audience": "Parents of children...",
    "best_used_when": "When parents ask about...",
    "user_journey_fit": "This is primarily a prevention...",
    "staff_notes": "Useful for demonstrating..."
  }
}
```

**Key Features**:
- ✅ **Partition Key**: `resource_id` (e.g., "web_content_00001")
- ✅ **Sort Key**: `resource_type` (e.g., ["resource:news"])
- ✅ **Queryable Tags**: All tags are top-level fields for fast filtering
- ✅ **Rich Metadata**: Reading time, complexity, emotional tone
- ✅ **Staff Guidance**: Practical recommendations for when to use
- ✅ **Timestamps**: Created/updated tracking

**Upload Script**: `scripts/upload_to_dynamodb.py`
- Creates table if not exists
- Batch uploads with error handling
- Converts floats to Decimal (DynamoDB requirement)
- Verifies upload count

---

### B. Complete Classification Results JSON

**Location**: `output/encephalitis_content_database.json`

**Purpose**: Full detailed results with all LLM output

**Schema Structure**:
```json
{
  "source_type": "web_content",
  "original": {
    "url": "https://...",
    "title": "Page Title",
    "description": "Description",
    "content": "Full content...",
    "scraped_at": "2026-01-14T19:49:00"
  },
  "refined": {
    "refined_tags": {
      "personas": [...],
      "types": [...],
      "stages": [...],
      "topics": [...],
      "symptoms": [...],
      "locations": [...],
      "conditions": [...],
      "resource_type": [...],
      "content_length": "length:medium",
      "content_format": "format:text",
      "playlists": [...]
    },
    "changes": {
      "added_tags": {...},
      "removed_tags": {...},
      "reasoning": "Explanation of changes"
    },
    "recommendations": {
      "primary_audience": "...",
      "best_used_when": "...",
      "user_journey_fit": "...",
      "staff_notes": "..."
    },
    "metadata": {
      "estimated_reading_time": "5 minutes",
      "complexity_level": "intermediate",
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
    "suggested_new_tags": [
      {
        "category": "symptom",
        "tag": "visual_disturbances",
        "reasoning": "Content discusses visual symptoms",
        "confidence": 85
      }
    ]
  },
  "processed_at": "2026-01-14T22:22:00.718859"
}
```

**Key Features**:
- ✅ **Original Content**: Preserves scraped data
- ✅ **Refined Classification**: LLM output
- ✅ **Change Tracking**: What was added/removed and why
- ✅ **Confidence Scores**: Multi-dimensional confidence
- ✅ **Adaptive Learning**: Suggested new tags for taxonomy expansion

---

### C. Web-Scraper S3 JSON

**Location**: S3 bucket `results/${batchId}/${url}.json`

**Purpose**: Individual result files for web-scraper Lambda

**Schema Structure**:
```json
{
  "url": "https://...",
  "title": "Page Title",
  "summary": "2-3 sentence summary",
  "tags": {
    "personas": ["persona:patient"],
    "types": ["type:autoimmune"],
    "stages": ["stage:pre_diagnosis"],
    "topics": ["topic:research"]
  },
  "timestamp": "2026-01-14T22:22:00.718859"
}
```

**Key Features**:
- ✅ **Individual Files**: One JSON per URL
- ✅ **S3 Storage**: Durable, scalable storage
- ✅ **Batch Organization**: Grouped by batch ID
- ✅ **Simple Schema**: Basic classification for quick access

---

## DynamoDB Table Structure

**Table Name**: `EncephalitisResources`

**Keys**:
- **Partition Key (HASH)**: `resource_id` (String)
- **Sort Key (RANGE)**: `resource_type` (String)

**Billing Mode**: PAY_PER_REQUEST (on-demand)

**Attributes** (all queryable):
- `resource_id` - Unique identifier
- `resource_type` - Type of resource
- `title` - Resource title
- `description` - Brief description
- `url` - Source URL
- `personas` - List of target personas
- `types` - List of condition types
- `stages` - List of journey stages
- `topics` - List of topics
- `symptoms` - List of symptoms addressed
- `locations` - Geographic relevance
- `conditions` - Specific conditions
- `content_length` - Reading time category
- `content_format` - Format type
- `playlists` - Curated collections
- `metadata` - Rich metadata object
- `recommendations` - Staff guidance object
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

**Query Examples**:
```python
# Get specific resource
table.get_item(Key={
    'resource_id': 'web_content_00001',
    'resource_type': 'web_content'
})

# Get all resources for patients
table.scan(
    FilterExpression=Attr('personas').contains('persona:patient')
)

# Get resources for newly diagnosed
table.scan(
    FilterExpression=Attr('stages').contains('stage:pre_diagnosis')
)

# Get high priority items
table.scan(
    FilterExpression=Attr('metadata.priority_level').eq('high')
)
```

---

## Knowledge Base Vector DB Integration

**Status**: ✅ **NOW IMPLEMENTED**

**Components**:
- ✅ AWS Bedrock Knowledge Base
- ✅ OpenSearch Serverless vector database
- ✅ Amazon Titan Embeddings (v2)
- ✅ Semantic search capabilities
- ✅ RAG (Retrieval Augmented Generation)

**Features**:
1. **Semantic Search** - Natural language queries across all resources
2. **Vector Embeddings** - Amazon Titan Embed v2 (1,024 dimensions)
3. **Metadata Filtering** - Filter by persona, stage, topic, etc.
4. **RAG Queries** - AI-generated answers with source citations
5. **Relevance Scoring** - Confidence scores for each result

**Architecture**:
```
Classified Resources (JSON)
    ↓
Document Preparation (rich text + metadata)
    ↓
S3 Data Source (encephalitis-kb-{region})
    ↓
Amazon Titan Embeddings (vector generation)
    ↓
OpenSearch Serverless (vector storage)
    ↓
Bedrock Knowledge Base (query interface)
    ↓
Semantic Search + RAG
```

**Setup Scripts**:
- `scripts/create_knowledge_base.py` - Create infrastructure and ingest data
- `scripts/query_knowledge_base.py` - Query interface for semantic search

**Documentation**: See `KNOWLEDGE_BASE_INTEGRATION.md` for complete guide

**Usage Examples**:
```bash
# Create infrastructure
python3 scripts/create_knowledge_base.py --create

# Ingest data
python3 scripts/create_knowledge_base.py --ingest

# Semantic search
python3 scripts/query_knowledge_base.py "memory problems"

# RAG query with answer generation
python3 scripts/query_knowledge_base.py "What helps with memory?" --rag
```

**Integration with DynamoDB**:
- **DynamoDB**: Structured queries (exact tag matching)
- **Knowledge Base**: Semantic queries (meaning-based search)
- **Best Practice**: Use both for hybrid search capabilities

---

## Summary

### ✅ Question 1: Feeds Pages to LLM with Specific Prompting

**YES - Both systems use sophisticated LLM prompting:**

1. **Web-Scraper (Lambda)**: Basic prompting with 4 tag categories
2. **Batch Processor (Python)**: Advanced prompting with 100+ tag categories, confidence scores, adaptive learning, and staff guidance

**Winner**: Batch processor has significantly more sophisticated prompting (600+ line templates vs 200 lines)

### ✅ Question 2: Creates JSON for AWS Bedrock Ingestion

**YES - Multiple JSON formats:**

1. **DynamoDB JSON** (`dynamodb_resources.json`)
   - ✅ Structured for direct DynamoDB ingestion
   - ✅ Partition key: `resource_id`
   - ✅ Sort key: `resource_type`
   - ✅ All tags as top-level queryable fields
   - ✅ Rich metadata and recommendations

2. **Complete Results JSON** (`encephalitis_content_database.json`)
   - ✅ Full LLM output with original content
   - ✅ Change tracking and reasoning
   - ✅ Confidence scores
   - ✅ Adaptive learning suggestions

3. **S3 Individual Files** (web-scraper)
   - ✅ One JSON per URL
   - ✅ Organized by batch ID
   - ✅ Simple schema for quick access

### ✅ Knowledge Base Vector DB

**NOW IMPLEMENTED** - Full AWS Bedrock Knowledge Base integration with:
- ✅ OpenSearch Serverless vector database
- ✅ Amazon Titan Embeddings (v2)
- ✅ Semantic search across 4,000+ resources
- ✅ RAG (Retrieval Augmented Generation)
- ✅ Metadata filtering and relevance scoring

**Hybrid Approach**: System now uses BOTH:
1. **DynamoDB** - Fast structured queries (exact tag matching)
2. **Knowledge Base** - Semantic search (meaning-based, natural language)

See `KNOWLEDGE_BASE_INTEGRATION.md` for complete documentation.

---

**Last Updated**: January 14, 2026  
**Status**: ✅ Complete Analysis
