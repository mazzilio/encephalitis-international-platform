# Adaptive Classification System

## Problem Solved

**Challenge**: During web scraping, you may encounter content that doesn't fit into predefined classification categories. How do you ensure appropriate classifiers are included without manual intervention?

**Solution**: An adaptive classification system that:
1. Uses existing tags when appropriate
2. Suggests new tags when gaps are identified
3. Aggregates suggestions across batches
4. Provides actionable recommendations for taxonomy evolution

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Web Scraping Process                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Enhanced Content Classifier                         │
│  • Applies 100+ existing tags                                    │
│  • Identifies classification gaps                                │
│  • Suggests new tags with reasoning                              │
│  • Assigns confidence scores                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    S3 Storage                                    │
│  Each resource stored with:                                      │
│  • Applied tags                                                  │
│  • Suggested new tags                                            │
│  • Classification gaps                                           │
│  • Confidence scores                                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Tag Analyzer Lambda                             │
│  Aggregates across batch:                                        │
│  • Tag suggestion frequency                                      │
│  • Average confidence scores                                     │
│  • Common classification gaps                                    │
│  • High-priority additions                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Analysis API Endpoint                               │
│  GET /analysis/{batchId}                                         │
│  Returns actionable recommendations                              │
└─────────────────────────────────────────────────────────────────┘
```

## How It Works: Step by Step

### Step 1: Content Classification

When a URL is scraped, the classifier:

```typescript
// Classifier encounters content about visual hallucinations
const content = "Patient experiencing visual disturbances and hallucinations...";

// Applies closest existing tag
refined_tags: {
  symptoms: ["symptom:sensory"]  // Closest match
}

// But also suggests a more specific tag
suggested_new_tags: [{
  category: "symptom",
  tag: "symptom:visual_disturbances",
  reasoning: "Content specifically discusses visual symptoms not adequately covered by 'sensory'",
  confidence: 85
}]

// Documents the gap
classification_gaps: {
  missing_categories: ["No specific tag for visual symptoms"],
  needs_review: false
}
```

### Step 2: Batch Aggregation

After processing 100 URLs, the Tag Analyzer aggregates:

```json
{
  "tag_frequency": {
    "symptom:visual_disturbances": {
      "count": 12,
      "avg_confidence": 87,
      "examples": [
        {
          "url": "https://example.com/visual-hallucinations",
          "title": "Understanding Visual Disturbances",
          "reasoning": "Content discusses visual symptoms..."
        }
      ]
    }
  }
}
```

### Step 3: Recommendations

System identifies high-priority additions:

```json
{
  "recommendations": {
    "high_priority_additions": [
      "symptom:visual_disturbances",  // 12 suggestions, 87% confidence
      "condition:pediatric_encephalitis",  // 8 suggestions, 82% confidence
      "topic:cognitive_rehabilitation"  // 6 suggestions, 85% confidence
    ]
  }
}
```

### Step 4: Taxonomy Evolution

Administrator reviews and approves:

```bash
# 1. Review analysis
curl https://api.example.com/analysis/batch-123

# 2. Approve high-priority tags
# 3. Update classifier prompt
# 4. Redeploy

cd infrastructure
cdk deploy

# 5. (Optional) Reprocess low-confidence items
```

## Key Features

### 1. Graceful Degradation

**Always classifies content**, even when perfect tags don't exist:
- Uses closest available tag
- Documents the limitation
- Suggests improvement
- Continues processing

### 2. Evidence-Based Evolution

**Tags are suggested based on data**:
- Frequency across multiple resources
- Confidence scores
- Consistent reasoning
- Real content examples

### 3. No Manual Intervention Required

**System runs autonomously**:
- Scrapes content
- Classifies with existing tags
- Identifies gaps
- Suggests improvements
- Continues without blocking

### 4. Actionable Insights

**Clear recommendations for administrators**:
- High-priority additions (backed by data)
- Low-confidence items (need review)
- Coverage gaps (systematic issues)
- Example resources (for validation)

## Example Scenarios

### Scenario 1: New Symptom Type

**Content**: Article about autonomic dysfunction in encephalitis

**Classifier Response**:
```json
{
  "refined_tags": {
    "symptoms": ["symptom:fatigue"]  // Closest existing tag
  },
  "suggested_new_tags": [{
    "category": "symptom",
    "tag": "symptom:autonomic",
    "reasoning": "Content discusses autonomic nervous system dysfunction (heart rate, blood pressure, temperature regulation) which is distinct from general fatigue",
    "confidence": 88
  }]
}
```

**After 5 similar articles**: System recommends adding `symptom:autonomic`

### Scenario 2: Geographic Gap

**Content**: Article about encephalitis treatment in Canada

**Classifier Response**:
```json
{
  "refined_tags": {
    "locations": ["location:worldwide"]  // Default
  },
  "suggested_new_tags": [{
    "category": "location",
    "tag": "location:canada",
    "reasoning": "Content discusses Canadian healthcare system, provincial programs, and Canada-specific resources",
    "confidence": 92
  }]
}
```

**After 8 Canadian articles**: System recommends adding `location:canada`

### Scenario 3: Emerging Topic

**Content**: Article about long COVID and encephalitis

**Classifier Response**:
```json
{
  "refined_tags": {
    "conditions": ["condition:covid_related"],
    "topics": ["topic:research"]
  },
  "suggested_new_tags": [{
    "category": "topic",
    "tag": "topic:long_covid",
    "reasoning": "Content specifically addresses long-term COVID effects and post-viral syndrome, which is an emerging area distinct from acute COVID",
    "confidence": 85
  }]
}
```

**After 10 long COVID articles**: System recommends adding `topic:long_covid`

### Scenario 4: Ambiguous Content

**Content**: Article relevant to both pre-diagnosis and acute stages

**Classifier Response**:
```json
{
  "refined_tags": {
    "stages": ["stage:pre_diagnosis", "stage:acute_hospital"]
  },
  "classification_gaps": {
    "ambiguous_content": ["Content applies equally to pre-diagnosis and acute stages"],
    "needs_review": false
  },
  "confidence_scores": {
    "stage_match": 65  // Lower confidence due to ambiguity
  }
}
```

**System flags for review** but continues processing

## Benefits

### 1. Single-Pass Processing

✅ **No need for separate refinement step**
- Scrape → Classify → Done
- Gaps identified automatically
- Suggestions captured in real-time

### 2. Data-Driven Evolution

✅ **Taxonomy evolves based on actual content**
- Not guesswork or assumptions
- Backed by frequency and confidence
- Examples provided for validation

### 3. Continuous Improvement

✅ **System gets better over time**
- New tags added as needed
- Coverage gaps identified
- Low-confidence items flagged

### 4. No Blocking Issues

✅ **Processing never stops**
- Always uses best available tags
- Suggestions don't block workflow
- Review happens asynchronously

### 5. Audit Trail

✅ **Complete transparency**
- Why tags were suggested
- How often they appear
- Confidence in suggestions
- Example resources

## API Usage

### Get Classification Analysis

```bash
# After processing a batch
GET /analysis/{batchId}
```

**Response includes**:
- All suggested tags with frequency
- High-priority additions
- Low-confidence items needing review
- Coverage gaps
- Example resources for each suggestion

### Filter High-Priority Suggestions

```javascript
const analysis = await fetch(`/analysis/${batchId}`).then(r => r.json());

// Tags suggested by 3+ resources with 80%+ confidence
const highPriority = analysis.recommendations.high_priority_additions;

console.log('Consider adding these tags:', highPriority);
// ["symptom:visual_disturbances", "condition:pediatric_encephalitis", ...]
```

### Review Low-Confidence Items

```javascript
const analysis = await fetch(`/analysis/${batchId}`).then(r => r.json());

// Items with confidence < 70%
const needsReview = analysis.recommendations.low_confidence_items;

needsReview.forEach(item => {
  console.log(`Review: ${item.title} (${item.confidence}% confidence)`);
  console.log(`URL: ${item.url}`);
});
```

### Check Coverage Gaps

```javascript
const analysis = await fetch(`/analysis/${batchId}`).then(r => r.json());

// Systematic gaps in taxonomy
const gaps = analysis.recommendations.coverage_gaps;

console.log('Coverage gaps:', gaps);
// ["Pediatric-specific content", "Long-term cognitive effects", ...]
```

## Configuration

### Confidence Thresholds

Adjust in `tag-analyzer/index.ts`:

```typescript
// High-priority threshold
const highPriorityAdditions = Object.entries(formattedFrequency)
  .filter(([_, data]) => 
    data.count >= 3 &&        // Suggested by 3+ resources
    data.avg_confidence >= 80  // 80%+ average confidence
  );

// Low-confidence threshold
if (classification.confidence_scores?.overall_classification < 70) {
  lowConfidenceItems.push(...);
}
```

### Tag Categories

Add new categories in `content-classifier-enhanced/index.ts`:

```typescript
#### 12. NEW CATEGORY:
- **new_category:value1**: Description
- **new_category:value2**: Description
```

## Monitoring

### CloudWatch Metrics

Track key metrics:

```typescript
// Suggestion rate
const suggestionRate = (itemsWithSuggestions / totalItems) * 100;

// Average confidence
const avgConfidence = totalConfidence / totalItems;

// Review rate
const reviewRate = (itemsNeedingReview / totalItems) * 100;
```

### Alerts

Set up alerts for:
- High suggestion rate (> 30%) - may indicate taxonomy gaps
- Low average confidence (< 75%) - may indicate poor prompts
- High review rate (> 20%) - may need manual intervention

## Best Practices

### 1. Regular Review Cycles

- **Daily**: Monitor confidence scores
- **Weekly**: Review high-priority suggestions
- **Monthly**: Analyze coverage gaps
- **Quarterly**: Update taxonomy

### 2. Validation Before Adding

Before adding a suggested tag:
- ✅ Review 3+ example resources
- ✅ Confirm it's not redundant
- ✅ Verify it improves user experience
- ✅ Check with domain experts

### 3. Batch Updates

Don't add tags one at a time:
- Collect suggestions over time
- Add in batches (e.g., 5-10 tags)
- Update prompt once
- Redeploy once

### 4. Document Changes

Maintain a changelog:
```markdown
## 2026-01-20
- Added: symptom:visual_disturbances (12 suggestions, 87% confidence)
- Added: condition:pediatric_encephalitis (8 suggestions, 82% confidence)
- Reasoning: Significant gap in visual symptom coverage
```

## Future Enhancements

- [ ] Machine learning to predict tag needs
- [ ] Automated tag addition (with approval workflow)
- [ ] Tag similarity detection
- [ ] User feedback integration
- [ ] A/B testing for new tags
- [ ] Multi-language tag support

---

**Status**: ✅ Production Ready  
**Last Updated**: January 14, 2026  
**Version**: 1.0
