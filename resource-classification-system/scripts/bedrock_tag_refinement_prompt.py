"""
AWS Bedrock Prompt Template for Refining Classification Tags
For Encephalitis International charity support resource recommendation system

Based on actual web scraper data structure from encephalitis_content_database_WIP.json
"""

import json
from typing import Dict, List, Any, Optional

class BedrockTagRefinementPrompt:
    """
    Generates prompts for AWS Bedrock to refine classification tags
    from web-scraped content and staff spreadsheet data
    """
    
    @staticmethod
    def build_tag_refinement_prompt(
        url: str,
        title: str,
        summary: str,
        existing_tags: Dict[str, List[str]],
        content_source: str = "website",
        full_content: Optional[str] = None
    ) -> str:
        """
        Build a prompt for Bedrock to refine classification tags based on actual data structure
        
        Args:
            url: The URL of the content
            title: Title of the content
            summary: Summary/description of the content
            existing_tags: Current tags dict with personas, types, stages, topics
            content_source: Source type (e.g., 'website', 'staff_spreadsheet', 'email_template')
            full_content: Optional full text content for deeper analysis
        """
        
        existing_personas = existing_tags.get('personas', [])
        existing_types = existing_tags.get('types', [])
        existing_stages = existing_tags.get('stages', [])
        existing_topics = existing_tags.get('topics', [])
        
        prompt = f"""You are an expert content classifier for Encephalitis International, a charity supporting people affected by encephalitis, their caregivers, and healthcare professionals.

Your task is to refine and enhance classification tags for support resources to ensure accurate content recommendations to users and staff.

## CONTENT TO ANALYZE:

**URL:** {url}
**Title:** {title}
**Summary:** {summary}
**Source Type:** {content_source}

## EXISTING TAGS:

**Personas:** {', '.join(existing_personas) if existing_personas else 'None'}
**Types:** {', '.join(existing_types) if existing_types else 'None'}
**Stages:** {', '.join(existing_stages) if existing_stages else 'None'}
**Topics:** {', '.join(existing_topics) if existing_topics else 'None'}

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
- **location:specific_country**: e.g., location:india, location:brazil, location:zambia

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

#### 11. PLAYLIST/GROUPING:
- **playlist:newly_diagnosed_pack**: Essential resources for newly diagnosed
- **playlist:caregiver_support**: Caregiver-focused resources
- **playlist:professional_education**: Professional development
- **playlist:research_updates**: Latest research findings
- **playlist:recovery_toolkit**: Recovery and rehabilitation resources

## YOUR TASK:

Analyze the content and provide refined tags that will help:
1. **Users** find the most relevant resources for their situation
2. **Staff** quickly identify appropriate content to recommend
3. **System** automatically match resources to user profiles

### Analysis Steps:

1. **Identify Primary Audience**: Who will benefit most from this content?
2. **Determine Journey Stage**: When in their journey would this be most useful?
3. **Extract Key Topics**: What specific topics/symptoms does this address?
4. **Assess Resource Type**: What kind of resource is this?
5. **Estimate Content Length**: How long will it take to consume?
6. **Identify Geographic Relevance**: Is this UK-specific or worldwide?
7. **Tag Condition Types**: Which encephalitis types does this cover?

## OUTPUT FORMAT:

Provide your response as a JSON object:

{{
  "refined_tags": {{
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
  }},
  "changes": {{
    "added_tags": {{
      "personas": ["persona:parent"],
      "symptoms": ["symptom:memory"],
      "resource_type": ["resource:factsheet"]
    }},
    "removed_tags": {{
      "topics": ["topic:school"]
    }},
    "reasoning": "Brief explanation of major changes"
  }},
  "recommendations": {{
    "primary_audience": "Detailed description of who would benefit most",
    "best_used_when": "Specific scenarios when staff should recommend this",
    "user_journey_fit": "Where this fits in the user's journey",
    "staff_notes": "Practical tips for staff using this resource"
  }},
  "metadata": {{
    "estimated_reading_time": "5 minutes",
    "complexity_level": "beginner|intermediate|advanced",
    "emotional_tone": "supportive|clinical|informative|urgent|inspirational",
    "actionable_content": true,
    "requires_follow_up": false,
    "priority_level": "high|normal|low"
  }},
  "confidence_scores": {{
    "overall_classification": 85,
    "persona_match": 90,
    "stage_match": 80,
    "topic_relevance": 85
  }}
}}

## IMPORTANT GUIDELINES:

1. **Be Specific**: Use precise tags (e.g., "symptom:memory" not just "topic:research")
2. **Be Accurate**: Only add tags clearly supported by the content
3. **Be Practical**: Consider how staff will use these tags in real conversations
4. **Be Empathetic**: Remember this content serves people in difficult situations
5. **Be Comprehensive**: Include all relevant tags, but avoid over-tagging
6. **Consider Context**: Think about when in their journey someone would need this
7. **Geographic Awareness**: Tag UK-specific content appropriately (benefits, NHS, etc.)
8. **Multiple Personas**: Many resources serve multiple audiences - tag all relevant ones

## SPECIAL CONSIDERATIONS:

- **Research content**: Usually relevant to professionals but also patients/caregivers seeking information
- **Personal stories**: Powerful for newly diagnosed and those in recovery
- **Clinical guidelines**: Primarily for professionals but may interest informed patients
- **Fundraising**: Often relevant to bereaved families and long-term supporters
- **International content**: Tag location appropriately for travel, regional studies, etc.

Now analyze the content and provide your refined classification."""

        if full_content:
            prompt += f"\n\n## FULL CONTENT (for deeper analysis):\n{full_content[:30000]}..."
        
        return prompt
    
    @staticmethod
    def build_batch_refinement_prompt(
        content_items: List[Dict[str, Any]],
        max_items: int = 10
    ) -> str:
        """
        Build a prompt for batch processing multiple content items from web scraper
        
        Args:
            content_items: List of dicts with 'url', 'title', 'summary', 'tags'
            max_items: Maximum number of items to process in one batch
        """
        
        items_text = ""
        for idx, item in enumerate(content_items[:max_items], 1):
            existing_tags = item.get('tags', {})
            items_text += f"""
### ITEM {idx}:
**URL:** {item.get('url', 'N/A')}
**Title:** {item.get('title', 'Untitled')}
**Summary:** {item.get('summary', 'No summary')}
**Existing Personas:** {', '.join(existing_tags.get('personas', []))}
**Existing Types:** {', '.join(existing_tags.get('types', []))}
**Existing Stages:** {', '.join(existing_tags.get('stages', []))}
**Existing Topics:** {', '.join(existing_tags.get('topics', []))}

---
"""
        
        prompt = f"""You are an expert content classifier for Encephalitis International charity.

Your task is to refine classification tags for multiple support resources in batch, ensuring consistency while respecting each item's unique characteristics.

## CONTENT ITEMS TO ANALYZE:
{items_text}

## CLASSIFICATION FRAMEWORK:

Use the same comprehensive tag taxonomy:
- **Personas**: persona:patient, persona:caregiver, persona:parent, persona:professional, persona:bereaved
- **Types**: type:autoimmune, type:infectious, type:post_infectious, type:NMDA, type:MOG, type:TBE, type:HSV
- **Stages**: stage:pre_diagnosis, stage:acute_hospital, stage:early_recovery, stage:long_term_management
- **Topics**: topic:research, topic:treatment, topic:diagnosis, topic:memory, topic:behaviour, topic:school, topic:work, topic:legal, topic:travel, etc.
- **Symptoms**: symptom:memory, symptom:behaviour, symptom:seizures, symptom:fatigue, symptom:mobility, symptom:speech, symptom:emotional
- **Locations**: location:uk, location:worldwide, location:europe, location:[country]
- **Resource Types**: resource:factsheet, resource:research, resource:event, resource:news, resource:video, resource:personal_story, resource:professional_contact, resource:fundraising
- **Content Length**: length:quick, length:short, length:medium, length:long
- **Playlists**: playlist:newly_diagnosed_pack, playlist:caregiver_support, playlist:professional_education, playlist:research_updates, playlist:recovery_toolkit

## YOUR TASK:

For each content item, provide refined tags following the comprehensive classification approach.

## OUTPUT FORMAT:

Provide a JSON array with one object per content item:

[
  {{
    "item_id": 1,
    "url": "...",
    "title": "...",
    "refined_tags": {{
      "personas": [...],
      "types": [...],
      "stages": [...],
      "topics": [...],
      "symptoms": [...],
      "locations": [...],
      "conditions": [...],
      "resource_type": [...],
      "content_length": "length:medium",
      "playlists": [...]
    }},
    "changes_summary": "Brief description of key changes made",
    "confidence_score": 85
  }},
  ...
]

Focus on:
1. **Consistency**: Similar content should have similar tags
2. **Completeness**: Don't miss important tags
3. **Accuracy**: Only add tags supported by the content
4. **Practicality**: Think about how staff will use these tags"""
        
        return prompt
    
    @staticmethod
    def build_spreadsheet_content_prompt(
        spreadsheet_row: Dict[str, Any],
        column_mapping: Dict[str, str]
    ) -> str:
        """
        Build a prompt specifically for staff spreadsheet content
        
        Args:
            spreadsheet_row: Dict representing a row from staff spreadsheet
            column_mapping: Maps spreadsheet columns to standard fields
        """
        
        # Extract relevant fields based on mapping
        title = spreadsheet_row.get(column_mapping.get('title', 'title'), 'Untitled')
        description = spreadsheet_row.get(column_mapping.get('description', 'description'), '')
        category = spreadsheet_row.get(column_mapping.get('category', 'category'), '')
        target_audience = spreadsheet_row.get(column_mapping.get('audience', 'audience'), '')
        notes = spreadsheet_row.get(column_mapping.get('notes', 'notes'), '')
        resource_url = spreadsheet_row.get(column_mapping.get('url', 'url'), '')
        
        prompt = f"""You are analyzing content from Encephalitis International staff spreadsheet used to create support resources, emails, and chat responses.

## SPREADSHEET ENTRY:

**Title:** {title}
**Description:** {description}
**Staff Category:** {category}
**Target Audience:** {target_audience}
**Resource URL:** {resource_url}
**Staff Notes:** {notes}

## CONTEXT:

This entry was created by charity staff who work directly with:
- People affected by encephalitis
- Family members and caregivers  
- Healthcare professionals

The staff have applied their own categorization, but we need to refine this into standardized tags for our recommendation system.

## CLASSIFICATION FRAMEWORK:

Apply the comprehensive tag taxonomy:

### USER CONTEXT:
- **Personas**: persona:patient, persona:caregiver, persona:parent, persona:professional, persona:bereaved
- **Locations**: location:uk, location:worldwide
- **Types**: type:autoimmune, type:infectious, type:post_infectious, type:NMDA, type:MOG, type:TBE, type:HSV
- **Conditions**: condition:nmda_receptor, condition:mog_ad, condition:bbe, condition:japanese_encephalitis, etc.
- **Stages**: stage:pre_diagnosis, stage:acute_hospital, stage:early_recovery, stage:long_term_management

### RESOURCE CONTEXT:
- **Symptoms**: symptom:memory, symptom:behaviour, symptom:seizures, symptom:fatigue, symptom:mobility, symptom:speech, symptom:emotional
- **Resource Type**: resource:factsheet, resource:research, resource:event, resource:news, resource:video, resource:personal_story, resource:professional_contact, resource:fundraising, resource:support_service
- **Topics**: topic:research, topic:treatment, topic:diagnosis, topic:memory, topic:behaviour, topic:school, topic:work, topic:legal, topic:travel, topic:rehabilitation, topic:prevention
- **Content Length**: length:quick (0-2 min), length:short (3-5 min), length:medium (6-10 min), length:long (10+ min)
- **Format**: format:text, format:video, format:audio, format:interactive, format:downloadable
- **Playlists**: playlist:newly_diagnosed_pack, playlist:caregiver_support, playlist:professional_education, playlist:research_updates, playlist:recovery_toolkit

## YOUR TASK:

1. **Interpret staff categorization** and map to standardized tags
2. **Extract implicit information** from staff notes about when/how to use this resource
3. **Add specific tags** that will help match this content to user needs
4. **Consider practical context** of how staff use this content in conversations, emails, and chats

## SPECIAL CONSIDERATIONS FOR STAFF CONTENT:

- Staff notes often contain valuable context about when to use this resource
- Staff categories may use internal terminology that needs translation to standard tags
- Content may be templates that need tags for multiple scenarios
- Consider both the explicit content and the implied use cases
- Email/chat templates should be tagged for the situations they address

## OUTPUT FORMAT:

{{
  "refined_tags": {{
    "personas": [...],
    "types": [...],
    "stages": [...],
    "topics": [...],
    "symptoms": [...],
    "locations": [...],
    "conditions": [...],
    "resource_type": [...],
    "content_length": "length:short",
    "content_format": "format:text",
    "playlists": [...]
  }},
  "staff_context": {{
    "original_category": "{category}",
    "interpreted_use_cases": [
      "When newly diagnosed patient calls helpline",
      "When caregiver asks about memory problems",
      "When professional requests research updates"
    ],
    "template_variables": [
      "If this is a template, what varies: patient name, condition type, etc."
    ],
    "communication_channel": "email|chat|phone|resource_pack|helpline",
    "staff_guidance": "Practical tips for staff on when and how to use this resource"
  }},
  "recommendations": {{
    "best_used_when": "Specific scenarios when staff should recommend this",
    "user_journey_fit": "Where this fits in the user's journey",
    "follow_up_resources": ["What resources to recommend next"],
    "sensitivity_notes": "Any sensitive topics or emotional considerations"
  }},
  "metadata": {{
    "estimated_time": "How long to read/watch/complete",
    "complexity_level": "beginner|intermediate|advanced",
    "emotional_tone": "supportive|clinical|informative|urgent|inspirational|empathetic",
    "requires_follow_up": true,
    "priority_level": "high|normal|low"
  }},
  "confidence_score": 85
}}

Analyze this staff content and provide refined classification with practical guidance for staff use."""
        
        return prompt


# Example usage functions
def example_web_content_refinement():
    """Example: Refining tags for web-scraped content from actual data"""
    
    # Real example from the web scraper data
    url = "https://www.encephalitis.info/autoimmune-encephalitis-associated-with-mog-antibodies/"
    title = "Autoimmune encephalitis associated with MOG antibodies"
    summary = "This factsheet provides a comprehensive overview of MOG antibody-associated disease (MOGAD), covering its clinical manifestations, diagnostic procedures, current treatment options, and long-term recovery outlook."
    
    existing_tags = {
        "personas": ["persona:patient", "persona:caregiver", "persona:parent", "persona:professional"],
        "types": ["type:autoimmune"],
        "stages": ["stage:pre_diagnosis", "stage:acute_hospital", "stage:early_recovery", "stage:long_term_management"],
        "topics": ["topic:memory", "topic:behaviour", "topic:research"]
    }
    
    prompt_builder = BedrockTagRefinementPrompt()
    prompt = prompt_builder.build_tag_refinement_prompt(
        url=url,
        title=title,
        summary=summary,
        existing_tags=existing_tags,
        content_source="website"
    )
    
    return prompt


def example_batch_refinement():
    """Example: Batch refining tags for multiple web-scraped items"""
    
    # Real examples from the web scraper data
    content_items = [
        {
            "url": "https://www.encephalitis.info/news/chickenpox-vaccines-for-children-start-across-uk/",
            "title": "Varicella zoster (Chickenpox) vaccines for children start across UK",
            "summary": "The UK government has introduced free chickenpox vaccinations for children on the NHS, a milestone move supported by Encephalitis International to prevent varicella-zoster virus and its life-threatening complication, encephalitis.",
            "tags": {
                "personas": ["persona:parent", "persona:caregiver", "persona:professional"],
                "types": ["type:infectious"],
                "stages": ["stage:pre_diagnosis", "stage:acute_hospital", "stage:long_term_management"],
                "topics": ["topic:research", "topic:school", "topic:behaviour"]
            }
        },
        {
            "url": "https://www.encephalitis.info/tops-uk/",
            "title": "TOPS-UK Tailored Online Problem Solving",
            "summary": "A research study by the University of Exeter offering a free web-based programme to help adolescents with acquired brain injuries, including encephalitis, manage emotions and develop problem-solving skills.",
            "tags": {
                "personas": ["persona:patient", "persona:parent", "persona:caregiver"],
                "types": [],
                "stages": ["stage:early_recovery", "stage:long_term_management"],
                "topics": ["topic:research", "topic:behaviour"]
            }
        },
        {
            "url": "https://www.encephalitis.info/treatments-for-encephalitis/",
            "title": "Treatments for Encephalitis",
            "summary": "An overview of the medical approaches to treating encephalitis, focusing on addressing the cause of the inflammation and managing symptoms and complications during the acute phase.",
            "tags": {
                "personas": ["persona:patient", "persona:caregiver", "persona:parent", "persona:professional"],
                "types": ["type:autoimmune", "type:infectious"],
                "stages": ["stage:acute_hospital"],
                "topics": ["topic:research"]
            }
        }
    ]
    
    prompt_builder = BedrockTagRefinementPrompt()
    prompt = prompt_builder.build_batch_refinement_prompt(content_items=content_items)
    
    return prompt


def example_spreadsheet_refinement():
    """Example: Refining tags for staff spreadsheet content"""
    
    spreadsheet_row = {
        "title": "New Diagnosis Support Email Template",
        "description": "Email template to send to people who have just been diagnosed with autoimmune encephalitis. Includes links to essential resources and support group information.",
        "category": "Patient Support - Initial Contact",
        "audience": "Newly diagnosed patients and their families",
        "url": "https://www.encephalitis.info/what-is-encephalitis",
        "notes": "Use within first week of diagnosis. Include links to basics factsheet and local support groups. Tone should be warm, reassuring, and not overwhelming. Mention helpline availability. Follow up in 2 weeks."
    }
    
    column_mapping = {
        "title": "title",
        "description": "description",
        "category": "category",
        "audience": "audience",
        "url": "url",
        "notes": "notes"
    }
    
    prompt_builder = BedrockTagRefinementPrompt()
    prompt = prompt_builder.build_spreadsheet_content_prompt(
        spreadsheet_row=spreadsheet_row,
        column_mapping=column_mapping
    )
    
    return prompt


def load_and_process_web_scraper_data(json_file_path: str, limit: int = 5):
    """
    Load actual web scraper data and generate prompts for refinement
    
    Args:
        json_file_path: Path to encephalitis_content_database_WIP.json
        limit: Number of items to process
    """
    with open(json_file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    prompt_builder = BedrockTagRefinementPrompt()
    prompts = []
    
    for item in data[:limit]:
        prompt = prompt_builder.build_tag_refinement_prompt(
            url=item.get('url', ''),
            title=item.get('title', ''),
            summary=item.get('summary', ''),
            existing_tags=item.get('tags', {}),
            content_source="website"
        )
        prompts.append({
            'url': item.get('url'),
            'title': item.get('title'),
            'prompt': prompt
        })
    
    return prompts


if __name__ == "__main__":
    print("=" * 80)
    print("EXAMPLE 1: WEB CONTENT REFINEMENT PROMPT")
    print("=" * 80)
    print(example_web_content_refinement())
    
    print("\n\n" + "=" * 80)
    print("EXAMPLE 2: BATCH REFINEMENT PROMPT")
    print("=" * 80)
    print(example_batch_refinement())
    
    print("\n\n" + "=" * 80)
    print("EXAMPLE 3: SPREADSHEET CONTENT REFINEMENT PROMPT")
    print("=" * 80)
    print(example_spreadsheet_refinement())
    
    print("\n\n" + "=" * 80)
    print("To process actual web scraper data, use:")
    print("=" * 80)
    print("""
prompts = load_and_process_web_scraper_data(
    '/path/to/encephalitis_content_database_WIP.json',
    limit=10
)
for item in prompts:
    print(f"Processing: {item['title']}")
    # Send item['prompt'] to AWS Bedrock
    """)
