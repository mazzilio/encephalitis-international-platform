# Tag Discovery & Classification Gap Analysis

## Overview

The enhanced classifier includes a **Tag Discovery System** that identifies when content doesn't fit existing classification categories and suggests new tags for the taxonomy.

## How It Works

### 1. During Classification

When the classifier encounters content that doesn't fit well into existing categories, it:

1. **Uses the closest available tag** from the existing framework
2. **Documents the gap** in `suggested_new_tags` field
3. **Provides reasoning** for why a new tag might be needed
4. **Assigns confidence score** to the suggestion
5. **Flags for review** if classification is uncertain

### 2. Example Classification with Suggested Tags

```json
{
  "url": "https://example.com/visual-hallucinations",
  "title": "Understanding Visual Disturbances in Encephalitis",
  "refined_tags": {
    "symptoms": ["symptom:sensory"],
    "personas": ["persona:patient", "persona:caregiver"]
  },
  "suggested_new_tags": [
    {
      "category": "symptom",
      "tag": "symptom:visual_disturbances",
      "reasoning": "Content specifically discusses visual hallucinations and vision problems not adequately covered by existing 'symptom:sensory' tag",
      "confidence": 85
    }
  ],
  "classification_gaps": {
    "missing_categories": ["No specific tag for visual symptoms"],
    "ambiguous_content": [],
    "needs_review": false
  }
}
```

### 3. Batch Analysis

After processing a batch of URLs, use the **Tag Analyzer** endpoint to get aggregated insights:

```bash
GET /analysis/{batchId}
```

**Response:**

```json
{
  "suggested_tags": [
    {
      "category": "symptom",
      "tag": "symptom:visual_disturbances",
      "reasoning": "...",
      "confidence": 85,
      "url": "https://...",
      "title": "..."
    }
  ],
  "tag_frequency": {
    "symptom:visual_disturbances": {
      "count": 12,
      "avg_confidence": 87,
      "examples": [
        {
          "url": "https://...",
          "title": "...",
          "reasoning": "..."
        }
      ]
    },
    "condition:pediatric_encephalitis": {
      "count": 8,
      "avg_confidence": 82,
      "examples": [...]
    }
  },
  "classification_gaps": {
    "missing_categories": [
      "No existing tag for pediatric-specific treatment protocols",
      "No tag for long-term cognitive rehabilitation"
    ],
    "ambiguous_content": [
      "Content could apply to both pre-diagnosis and acute stages equally"
    ],
    "needs_review_count": 5
  },
  "recommendations": {
    "high_priority_additions": [
      "symptom:visual_disturbances",
      "condition:pediatric_encephalitis",
      "topic:cognitive_rehabilitation"
    ],
    "low_confidence_items": [
      {
        "url": "https://...",
        "title": "...",
        "confidence": 62
      }
    ],
    "coverage_gaps": [
      "Pediatric-specific content",
      "Long-term cognitive effects"
    ]
  }
}
```

## Tag Suggestion Criteria

### High Priority Additions

Tags are recommended for addition when:
- **Frequency**: Suggested by 3+ different resources
- **Confidence**: Average confidence ≥ 80%
- **Consistency**: Similar reasoning across multiple suggestions

### Review Required

Items flagged for manual review when:
- **Low confidence**: Overall classification < 70%
- **Ambiguous content**: Fits multiple categories equally
- **Missing categories**: No appropriate existing tags
- **Edge cases**: Unusual or emerging topics

## Workflow for Tag System Evolution

### 1. Process Batch

```bash
POST /process
{
  "sitemapXml": "..."
}
```

### 2. Monitor Classification

```bash
GET /status/{batchId}
```

### 3. Analyze Gaps

```bash
GET /analysis/{batchId}
```

### 4. Review Suggestions

Review the `high_priority_additions` list:

```json
{
  "high_priority_additions": [
    "symptom:visual_disturbances",
    "condition:pediatric_encephalitis",
    "topic:cognitive_rehabilitation",
    "location:canada",
    "resource:mobile_app"
  ]
}
```

### 5. Update Classification System

If tags are approved, update the prompt in:
- `backend/lambdas/content-classifier-enhanced/index.ts`
- `resource-classification-system/scripts/bedrock_tag_refinement_prompt.py`

### 6. Reprocess Low Confidence Items

For items with confidence < 70%, consider:
- Manual review and correction
- Reprocessing with updated taxonomy
- Flagging for staff review

## Common Suggested Tag Categories

### Symptoms
- `symptom:visual_disturbances` - Visual hallucinations, vision problems
- `symptom:sleep` - Sleep disturbances, insomnia
- `symptom:sensory` - Sensory issues, hallucinations
- `symptom:pain` - Headaches, pain management
- `symptom:autonomic` - Autonomic dysfunction

### Conditions
- `condition:pediatric_encephalitis` - Pediatric-specific cases
- `condition:lgi1` - LGI1 antibody encephalitis
- `condition:caspr2` - CASPR2 antibody encephalitis
- `condition:gaba` - GABA receptor encephalitis
- `condition:rasmussen` - Rasmussen's encephalitis

### Topics
- `topic:cognitive_rehabilitation` - Cognitive therapy, brain training
- `topic:mental_health` - Mental health support
- `topic:relationships` - Family, relationships, social life
- `topic:financial` - Financial support, benefits, insurance
- `topic:nutrition` - Diet, nutrition for recovery

### Locations
- `location:canada` - Canada-specific content
- `location:australia` - Australia-specific content
- `location:usa` - USA-specific content
- `location:asia` - Asia-specific content

### Resource Types
- `resource:mobile_app` - Mobile applications
- `resource:policy` - Policy documents, guidelines
- `resource:training` - Training materials, courses
- `resource:webinar` - Live or recorded webinars

## API Endpoints

### Get Tag Analysis

```
GET /analysis/{batchId}
```

Returns comprehensive analysis of suggested tags and classification gaps.

### Get Low Confidence Items

Filter the analysis response for items needing review:

```javascript
const analysis = await fetch(`/analysis/${batchId}`);
const lowConfidence = analysis.recommendations.low_confidence_items;
```

### Get High Priority Additions

```javascript
const analysis = await fetch(`/analysis/${batchId}`);
const newTags = analysis.recommendations.high_priority_additions;
```

## Best Practices

### 1. Regular Review Cycles

- **Weekly**: Review high-priority tag suggestions
- **Monthly**: Analyze coverage gaps
- **Quarterly**: Update classification framework

### 2. Confidence Thresholds

- **≥ 85%**: High confidence, likely accurate
- **70-84%**: Medium confidence, spot check
- **< 70%**: Low confidence, manual review required

### 3. Tag Addition Criteria

Add new tags when:
- Suggested by 3+ resources with avg confidence ≥ 80%
- Addresses clear gap in existing taxonomy
- Improves user experience or staff workflow
- Supported by charity domain experts

### 4. Avoid Tag Proliferation

Don't add tags for:
- One-off edge cases
- Overly specific subcategories
- Temporary or trending topics
- Redundant with existing tags

## Monitoring & Metrics

### Key Metrics to Track

1. **Suggestion Rate**: % of resources suggesting new tags
2. **Confidence Distribution**: Histogram of confidence scores
3. **Gap Frequency**: Most common missing categories
4. **Tag Adoption**: New tags added per review cycle
5. **Reprocessing Rate**: % of items needing reclassification

### CloudWatch Metrics

```javascript
// Suggested tags per batch
PUT /aws/webscraper/suggested_tags_count

// Average confidence score
PUT /aws/webscraper/avg_confidence_score

// Items needing review
PUT /aws/webscraper/needs_review_count
```

## Example: Adding a New Tag

### 1. Identify Need

Analysis shows 15 resources suggest `symptom:visual_disturbances` with 87% avg confidence.

### 2. Validate

Review examples to confirm:
- Content genuinely addresses visual symptoms
- Not adequately covered by `symptom:sensory`
- Would improve user search/filtering

### 3. Update Prompt

Add to classifier prompt:

```typescript
#### 6. SYMPTOMS ADDRESSED:
- **symptom:memory**: Memory problems, cognitive issues
- **symptom:behaviour**: Behavioral changes, personality changes
- **symptom:visual_disturbances**: Visual hallucinations, vision problems, sight issues
// ... rest of symptoms
```

### 4. Update Types

Add to TypeScript types:

```typescript
export interface RefinedTagSchema {
  // ... existing fields
  symptoms: string[]; // Now includes symptom:visual_disturbances
}
```

### 5. Redeploy

```bash
cd infrastructure
cdk deploy
```

### 6. Reprocess (Optional)

Reprocess resources that suggested this tag to apply it retroactively.

## Future Enhancements

- [ ] Machine learning to predict tag suggestions
- [ ] Automated A/B testing of new tags
- [ ] User feedback loop for tag relevance
- [ ] Similarity detection for duplicate suggestions
- [ ] Tag hierarchy and relationships
- [ ] Multi-language tag support
- [ ] Tag deprecation workflow

---

**Status**: ✅ Production Ready  
**Last Updated**: January 14, 2026  
**Version**: 1.0
