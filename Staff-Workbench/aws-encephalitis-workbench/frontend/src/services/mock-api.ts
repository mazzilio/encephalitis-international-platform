import { Resource, DraftResponse } from '../types';

// Mock API for local development without AWS backend
export const mockSuggestResources = async (
    userProfile: string,
    databaseContent: string | null
): Promise<Resource[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    return [
        {
            id: "1",
            title: "Understanding Memory Problems After Encephalitis",
            excerpt: "A comprehensive guide to memory challenges during recovery, including practical strategies and coping mechanisms.",
            type: "PDF",
            timeToRead: "15 min",
            matchReason: "Directly addresses memory loss concerns",
            url: "https://encephalitis.info/memory-guide"
        },
        {
            id: "2",
            title: "Managing Fatigue in Recovery",
            excerpt: "Practical strategies for dealing with post-encephalitis fatigue and energy management.",
            type: "Article",
            timeToRead: "10 min",
            matchReason: "Specific to fatigue management",
            url: "https://encephalitis.info/fatigue-management"
        },
        {
            id: "3",
            title: "Return to Work: A Step-by-Step Guide",
            excerpt: "How to navigate returning to employment after encephalitis, including workplace adjustments.",
            type: "Video",
            timeToRead: "20 min",
            matchReason: "Addresses return to work concerns",
            url: "https://encephalitis.info/return-to-work"
        },
        {
            id: "4",
            title: "Cognitive Rehabilitation Techniques",
            excerpt: "Evidence-based exercises and techniques to improve cognitive function after brain injury.",
            type: "Article",
            timeToRead: "12 min",
            matchReason: "Supports cognitive recovery",
            url: "https://encephalitis.info/cognitive-rehab"
        },
        {
            id: "5",
            title: "Sleep and Recovery",
            excerpt: "Understanding the role of sleep in brain healing and strategies for better sleep quality.",
            type: "PDF",
            timeToRead: "8 min",
            matchReason: "Important for overall recovery",
            url: "https://encephalitis.info/sleep-guide"
        },
        {
            id: "6",
            title: "Emotional Wellbeing After Encephalitis",
            excerpt: "Addressing the psychological impact of encephalitis and finding emotional support.",
            type: "Article",
            timeToRead: "10 min",
            matchReason: "Holistic recovery approach",
            url: "https://encephalitis.info/emotional-wellbeing"
        },
        {
            id: "7",
            title: "Anti-NMDAR Encephalitis: Patient Stories",
            excerpt: "Real experiences from patients who have recovered from Anti-NMDAR encephalitis.",
            type: "Video",
            timeToRead: "25 min",
            matchReason: "Specific to Anti-NMDAR diagnosis",
            url: "https://encephalitis.info/patient-stories"
        },
        {
            id: "8",
            title: "Nutrition for Brain Health",
            excerpt: "Dietary recommendations to support brain recovery and overall health.",
            type: "PDF",
            timeToRead: "10 min",
            matchReason: "Supports physical recovery",
            url: "https://encephalitis.info/nutrition"
        },
        {
            id: "9",
            title: "Exercise and Physical Activity Guidelines",
            excerpt: "Safe ways to reintroduce physical activity during recovery from encephalitis.",
            type: "Article",
            timeToRead: "8 min",
            matchReason: "Helps manage fatigue",
            url: "https://encephalitis.info/exercise"
        },
        {
            id: "10",
            title: "Support Groups and Community Resources",
            excerpt: "Connect with others who understand your journey through peer support groups.",
            type: "Webpage",
            timeToRead: "5 min",
            matchReason: "Emotional and social support",
            url: "https://encephalitis.info/support-groups"
        },
        {
            id: "11",
            title: "Workplace Accommodations Guide",
            excerpt: "How to request and implement reasonable adjustments when returning to work.",
            type: "PDF",
            timeToRead: "12 min",
            matchReason: "Practical return to work support",
            url: "https://encephalitis.info/workplace-accommodations"
        },
        {
            id: "12",
            title: "Long-term Recovery: What to Expect",
            excerpt: "Understanding the timeline and milestones of recovery from encephalitis.",
            type: "Article",
            timeToRead: "15 min",
            matchReason: "Sets realistic expectations",
            url: "https://encephalitis.info/long-term-recovery"
        }
    ];
};

export const mockGenerateDraft = async (
    userProfile: string,
    selectedResources: Resource[]
): Promise<DraftResponse> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
        subject: "Resources to Support Your Recovery Journey",
        opening: "Thank you for reaching out to us. We understand that recovering from Anti-NMDAR encephalitis can be challenging, especially when dealing with memory difficulties and fatigue while thinking about returning to work.",
        resourceIntro: "Based on your current situation, we've selected some resources that may be helpful:",
        closing: "Please don't hesitate to contact us if you need any further support or have questions about these resources.",
        signOff: "Warmly,\nThe Encephalitis Support Team"
    };
};
