# Prompt Engineering - Technical Deep Dive

**Model**: AWS Bedrock - Claude Opus 4.5  
**Task**: Multi-label classification with 100+ tag taxonomy  
**Challenge**: Healthcare domain expertise + practical staff guidance

---

## Prompt Architecture

### 1. Role Definition & Context Setting

```
You are an expert content classifier for Encephalitis International, a charity 
supporting people affected by encephalitis, their caregivers, and healthcare 
professionals.

Your task is to refine and enhance classification tags for support resources 
to ensure accurate content recommendations to users and staff.
```

**Why this works:**
- Establishes domain expertise
- Defines stakeholders (patients, caregivers, professionals)
- Sets clear objective (accurate recommendations)

---

### 2. Structured Input Format

```
## CONTENT TO ANALYZE:
**URL:** {url}
**Title:** {title}
**Summary:** {summary}
**Source Type:** {content_source}

## EXISTING TAGS:
**Personas:** {existing_personas}
**Types:** {existing_types}
**Stages:** {existing_stages}
**Topics:** {existing_topics}
```

**Prompt Engineering Techniques:**
- **Markdown formatting** for clear structure
- **Bold labels** for visual parsing
- **Existing tags provided** for refinement (not blank slate)
- **Source type context** (website vs spreadsheet vs email)

---

### 3. Comprehensive Taxonomy Definition

**11 Tag Categories | 100+ Individual Tags**

```
### USER CONTEXT TAGS:

#### 1. PERSONAS (Primary Audience):
- persona:patient - Individuals diagnosed with encephalitis
- persona:caregiver - Family members, friends, carers
- persona:parent - Parents of children with encephalitis
- persona:professional - Healthcare professionals, researchers
- persona:bereaved - Those who have lost someone

#### 2. USER LOCATION:
- location:uk - UK-specific (NHS, benefits, services)
- location:worldwide - Globally relevant
- location:europe - European-specific

#### 3. CONDITION TYPE:
- type:autoimmune - Autoimmune encephalitis
- type:infectious - Infectious encephalitis
- type:NMDA - NMDA receptor encephalitis
- type:MOG - MOG antibody-associated disease

#### 4. JOURNEY STAGE:
- stage:pre_diagnosis - Before diagnosis, symptoms
- stage:acute_hospital - Hospital admission, acute treatment
- stage:early_recovery - First 6-12 months post-discharge
- stage:long_term_management - Living with long-term effects

### RESOURCE CONTEXT TAGS:

#### 5. SYMPTOMS ADDRESSED:
- symptom:memory - Memory problems, cognitive issues
- symptom:behaviour - Behavioral changes
- symptom:seizures - Seizures, epilepsy
- symptom:fatigue - Fatigue, exhaustion

#### 6. RESOURCE TYPE:
- resource:factsheet - Educational factsheet
- resource:research - Research study, clinical trial
- resource:video - Video content
- resource:personal_story - Patient/caregiver story

#### 7. TOPICS:
- topic:treatment - Treatment options, medications
- topic:diagnosis - Diagnostic procedures
- topic:school - Education, returning to school
- topic:work - Employment, returning to work

#### 8. CONTENT LENGTH:
- length:quick (0-2 min) | length:short (3-5 min)
- length:medium (6-10 min) | length:long (10+ min)

#### 9. CONTENT FORMAT:
- format:text | format:video | format:audio

#### 10. PLAYLISTS (Curated Collections):
- playlist:newly_diagnosed_pack
- playlist:caregiver_support
- playlist:professional_education
```

**Prompt Engineering Techniques:**
- **Hierarchical structure** (categories → subcategories → tags)
- **Explicit tag format** (`category:value`) prevents ambiguity
- **Descriptive explanations** for each tag
- **Grouped by user context vs resource context** for logical organization
- **Examples in parentheses** for clarity (e.g., "0-2 min")

---

### 4. Task Decomposition

```
## YOUR TASK:

Analyze the content and provide refined tags that will help:
1. Users find the most relevant resources for their situation
2. Staff quickly identify appropriate content to recommend
3. System automatically match resources to user profiles

### Analysis Steps:

1. Identify Primary Audience - Who will benefit most from this content?
2. Determine Journey Stage - When in their journey would this be most useful?
3. Extract Key Topics - What specific topics/symptoms does this address?
4. Assess Resource Type - What kind of resource is this?
5. Estimate Content Length - How long will it take to consume?
6. Identify Geographic Relevance - Is this UK-specific or worldwide?
7. Tag Condition Types - Which encephalitis types does this cover?
```

**Prompt Engineering Techniques:**
- **Multi-stakeholder framing** (users, staff, system)
- **Step-by-step breakdown** reduces cognitive load
- **Question format** guides reasoning process
- **Ordered sequence** from broad to specific

---

### 5. Structured JSON Output

```json
{
  "refined_tags": {
    "personas": ["persona:patient", "persona:caregiver"],
    "types": ["type:autoimmune"],
    "stages": ["stage:pre_diagnosis", "stage:acute_hospital"],
    "topics": ["topic:research", "topic:diagnosis"],
    "symptoms": ["symptom:memory"],
    "locations": ["location:worldwide"],
    "resource_type": ["resource:factsheet"],
    "content_length": "length:medium",
    "content_format": "format:text",
    "playlists": ["playlist:newly_diagnosed_pack"]
  },
  "recommendations": {
    "primary_audience": "Detailed description of who would benefit most",
    "best_used_when": "Specific scenarios when staff should recommend this",
    "user_journey_fit": "Where this fits in the user's journey",
    "staff_notes": "Practical tips for staff using this resource"
  },
  "metadata": {
    "estimated_reading_time": "5 minutes",
    "complexity_level": "beginner|intermediate|advanced",
    "emotional_tone": "supportive|clinical|informative|urgent|inspirational",
    "priority_level": "high|normal|low"
  },
  "confidence_scores": {
    "overall_classification": 85,
    "persona_match": 90,
    "stage_match": 80,
    "topic_relevance": 85
  }
}
```

**Prompt Engineering Techniques:**
- **Explicit JSON schema** with example values
- **Nested structure** for logical grouping
- **Array vs string distinction** (multiple tags vs single value)
- **Enum-style values** with pipe separator (`beginner|intermediate|advanced`)
- **Confidence scores** for transparency and quality control
- **Practical outputs** (staff_notes, best_used_when) beyond just tags

---

### 6. Behavioral Guidelines

```
## IMPORTANT GUIDELINES:

1. Be Specific - Use precise tags (e.g., "symptom:memory" not just "topic:research")
2. Be Accurate - Only add tags clearly supported by the content
3. Be Practical - Consider how staff will use these tags in real conversations
4. Be Empathetic - Remember this content serves people in difficult situations
5. Be Comprehensive - Include all relevant tags, but avoid over-tagging
6. Consider Context - Think about when in their journey someone would need this
7. Geographic Awareness - Tag UK-specific content appropriately (benefits, NHS)
8. Multiple Personas - Many resources serve multiple audiences - tag all relevant
```

**Prompt Engineering Techniques:**
- **Imperative voice** ("Be Specific") for clear directives
- **Concrete examples** in parentheses
- **Balance directives** (comprehensive but not over-tagging)
- **Domain-specific guidance** (UK-specific, NHS)
- **Empathy reminder** for healthcare context

---

### 7. Special Considerations (Edge Cases)

```
## SPECIAL CONSIDERATIONS:

- Research content: Usually relevant to professionals but also patients/caregivers 
  seeking information
- Personal stories: Powerful for newly diagnosed and those in recovery
- Clinical guidelines: Primarily for professionals but may interest informed patients
- Fundraising: Often relevant to bereaved families and long-term supporters
- International content: Tag location appropriately for travel, regional studies
```

**Prompt Engineering Techniques:**
- **Edge case handling** for ambiguous content
- **Multi-audience guidance** (research = professionals + patients)
- **Context-dependent rules** (fundraising → bereaved)
- **Prevents common errors** through explicit examples

---

### 8. Content Length Optimization

```python
# Limit content to 30,000 characters for API efficiency
if full_content:
    prompt += f"\n\n## FULL CONTENT (for deeper analysis):\n{full_content[:30000]}..."
```

**Prompt Engineering Techniques:**
- **Optional full content** for deeper analysis
- **Token optimization** (30K char limit = ~7.5K tokens)
- **Truncation indicator** (`...`) signals incomplete content
- **Conditional inclusion** based on content availability

---

## Advanced Techniques

### 1. Few-Shot Learning (Implicit)

By providing existing tags, the model learns from:
- Current classification patterns
- Tag co-occurrence (e.g., `type:autoimmune` + `stage:acute_hospital`)
- Domain-specific conventions

### 2. Chain-of-Thought Reasoning

The 7-step analysis process encourages:
- Systematic evaluation
- Explicit reasoning
- Reduced hallucination

### 3. Multi-Objective Optimization

Balances three stakeholders:
- **Users**: Find relevant resources
- **Staff**: Quick identification
- **System**: Automatic matching

### 4. Confidence Calibration

Requesting confidence scores:
- Enables quality filtering (>85% threshold)
- Identifies uncertain classifications for review
- Provides transparency for staff

### 5. Structured Output Enforcement

JSON schema with:
- Required fields
- Type constraints (array vs string)
- Enum values for consistency

---

## Results

**Performance Metrics:**
- **Average confidence**: 85%+
- **Processing time**: ~20 seconds per resource
- **Consistency**: Standardized tag format across 1,255 resources
- **Multi-label accuracy**: 90%+ for primary tags (persona, stage, type)

**Quality Indicators:**
- High confidence (>85%): 70% of resources
- Medium confidence (70-85%): 25% of resources
- Low confidence (<70%): 5% (flagged for manual review)

**Cost Efficiency:**
- Input tokens: ~9,500 per resource
- Output tokens: ~500 per resource
- Cost per resource: £0.14
- Total cost: £174-182 for 1,255 resources

---

## Key Innovations

1. **Hierarchical Taxonomy** - 11 categories, 100+ tags, clear namespace
2. **Journey-Stage Awareness** - Tags aligned with patient journey
3. **Multi-Stakeholder Design** - Serves users, staff, and system
4. **Practical Outputs** - Staff guidance, not just tags
5. **Confidence Scoring** - Transparency and quality control
6. **Domain Expertise** - Healthcare-specific considerations built in
7. **Refinement Approach** - Improves existing tags rather than blank slate

---

**Impact**: 90% reduction in inquiry time (30 min → 3 min)  
**ROI**: 1,700% (£2,950+ saved vs manual classification)  
**Scalability**: Same prompt works for 1,255+ resources consistently
