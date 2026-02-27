"""
Demo script to test live monitoring with 20 resources
Simulates processing by creating checkpoint files with realistic data
"""

import json
import time
from datetime import datetime
from pathlib import Path
import random

def create_fake_result(idx, source_type='web_content'):
    """Create a realistic fake classification result"""
    
    personas = ['persona:patient', 'persona:caregiver', 'persona:professional', 'persona:parent', 'persona:bereaved']
    stages = ['stage:pre_diagnosis', 'stage:acute_hospital', 'stage:early_recovery', 'stage:long_term_management']
    topics = ['topic:diagnosis', 'topic:treatment', 'topic:research', 'topic:support', 'topic:rehabilitation', 'topic:memory', 'topic:behaviour']
    types = ['type:autoimmune', 'type:infectious', 'type:viral', 'type:bacterial']
    symptoms = ['symptom:memory', 'symptom:behaviour', 'symptom:seizures', 'symptom:fatigue']
    
    titles = [
        "Understanding Encephalitis Symptoms",
        "Treatment Options for Autoimmune Encephalitis",
        "Living with Long-term Effects",
        "Support for Caregivers",
        "Memory Problems After Encephalitis",
        "Returning to Work After Brain Injury",
        "Children and Encephalitis",
        "Research Updates and Clinical Trials",
        "Rehabilitation Strategies",
        "Emotional Support and Mental Health",
        "Seizure Management",
        "Fatigue and Energy Management",
        "Communication Difficulties",
        "Family Support Resources",
        "Professional Healthcare Guidance",
        "Diagnosis and Testing",
        "Hospital Care and Treatment",
        "Recovery Timeline",
        "Support Groups and Community",
        "Prevention and Vaccination"
    ]
    
    # Randomly fail some items (10% error rate)
    if random.random() < 0.1:
        return {
            'source_type': source_type,
            'original': {
                'title': titles[idx % len(titles)],
                'url': f'https://example.com/resource-{idx}'
            },
            'error': 'Simulated network timeout for testing',
            'processed_at': datetime.now().isoformat()
        }
    
    # Randomly suggest new tags (20% of items)
    suggested_tags = []
    if random.random() < 0.2:
        suggested_tags = [
            {
                'category': 'symptom',
                'tag': 'symptom:visual_disturbances',
                'reasoning': 'Content discusses visual symptoms not covered by existing tags',
                'confidence': random.randint(75, 95)
            }
        ]
    
    return {
        'source_type': source_type,
        'original': {
            'title': titles[idx % len(titles)],
            'url': f'https://example.com/resource-{idx}',
            'summary': f'This is a comprehensive resource about {titles[idx % len(titles)].lower()}'
        },
        'refined': {
            'refined_tags': {
                'personas': random.sample(personas, k=random.randint(1, 3)),
                'stages': random.sample(stages, k=random.randint(1, 2)),
                'topics': random.sample(topics, k=random.randint(1, 4)),
                'types': random.sample(types, k=random.randint(1, 2)),
                'symptoms': random.sample(symptoms, k=random.randint(0, 2))
            },
            'confidence_scores': {
                'overall_classification': random.randint(75, 95),
                'persona_match': random.randint(70, 95),
                'stage_match': random.randint(70, 95),
                'topic_relevance': random.randint(75, 98)
            },
            'suggested_new_tags': suggested_tags,
            'metadata': {
                'estimated_time': f'{random.randint(3, 15)} minutes',
                'complexity_level': random.choice(['basic', 'intermediate', 'advanced']),
                'emotional_tone': random.choice(['supportive', 'informative', 'clinical']),
                'priority_level': random.choice(['high', 'medium', 'low'])
            }
        },
        'processed_at': datetime.now().isoformat()
    }

def simulate_processing(total_items=20, delay=3):
    """Simulate processing with checkpoint saves"""
    
    from pathlib import Path
    checkpoint_file = Path(__file__).parent.parent / 'temp' / 'progress_checkpoint.json'
    
    print("\n" + "=" * 80)
    print("LIVE MONITORING TEST - 20 RESOURCES")
    print("=" * 80)
    print()
    print(f"📊 Simulating processing of {total_items} items")
    print(f"⏱️  Delay between items: {delay} seconds (realistic timing)")
    print(f"💾 Checkpoint file: {checkpoint_file}")
    print()
    print("🌐 Open http://localhost:5001 in your browser to see live monitoring")
    print()
    print("💡 This simulates real processing with:")
    print("   • Realistic confidence scores (75-95)")
    print("   • Adaptive classification (suggested tags)")
    print("   • Occasional errors (~10%)")
    print("   • Progress saves every 5 items")
    print()
    print("=" * 80)
    print()
    
    results = []
    
    for idx in range(1, total_items + 1):
        # Create fake result
        result = create_fake_result(idx)
        results.append(result)
        
        # Print progress
        status = "✓" if 'error' not in result else "✗"
        confidence = ""
        if 'error' not in result:
            conf_score = result['refined']['confidence_scores']['overall_classification']
            confidence = f"(confidence: {conf_score})"
        
        print(f"[{idx}/{total_items}] {result['original']['title'][:50]}... {status} {confidence}")
        
        # Save checkpoint every 5 items
        if idx % 5 == 0 or idx == total_items:
            checkpoint = {
                'timestamp': datetime.now().isoformat(),
                'metadata': {
                    'last_processed': idx,
                    'total': total_items,
                    'type': 'web_content',
                    'completed': idx == total_items
                },
                'results': results
            }
            
            with open(checkpoint_file, 'w') as f:
                json.dump(checkpoint, f, indent=2)
            
            progress_pct = (idx / total_items) * 100
            print(f"   💾 Progress saved: {idx}/{total_items} ({progress_pct:.1f}%)")
        
        # Delay to simulate processing time
        time.sleep(delay)
    
    print()
    print("=" * 80)
    print("✅ PROCESSING COMPLETE")
    print("=" * 80)
    print()
    
    # Calculate statistics
    successful = len([r for r in results if 'error' not in r])
    errors = len([r for r in results if 'error' in r])
    confidence_scores = [r['refined']['confidence_scores']['overall_classification'] 
                        for r in results if 'error' not in r]
    avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0
    items_with_gaps = len([r for r in results if 'error' not in r and r['refined']['suggested_new_tags']])
    
    print(f"📊 FINAL STATISTICS:")
    print(f"   Total processed: {len(results)}")
    print(f"   ✓ Successful: {successful} ({successful/len(results)*100:.1f}%)")
    print(f"   ✗ Errors: {errors} ({errors/len(results)*100:.1f}%)")
    print(f"   📈 Average confidence: {avg_confidence:.1f}")
    print(f"   🔍 Items with suggested tags: {items_with_gaps}")
    print()
    print("💡 Check the monitoring dashboard at http://localhost:5001")
    print("   • View real-time statistics")
    print("   • See confidence score breakdown")
    print("   • Review suggested tags")
    print()

if __name__ == '__main__':
    import sys
    
    # Check for custom parameters
    total = 20  # Default
    delay = 3   # 3 seconds between items (realistic)
    
    if '--fast' in sys.argv:
        delay = 1  # Faster for quick demo
        print("🚀 Fast mode: 1s delay")
    
    if '--slow' in sys.argv:
        delay = 5  # Slower for detailed observation
        print("🐢 Slow mode: 5s delay")
    
    try:
        simulate_processing(total_items=total, delay=delay)
    except KeyboardInterrupt:
        print("\n\n⚠️  Processing interrupted by user")
        print("💡 Checkpoint file saved - monitoring dashboard will show progress")

