// Shared types for AWS Web Scraper

export interface TagSchema {
  personas: string[];
  types: string[];
  stages: string[];
  topics: string[];
}

export interface RefinedTagSchema {
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
}

export interface ClassifiedPage {
  url: string;
  title: string;
  summary: string;
  tags: TagSchema;
  timestamp?: string;
  processingTime?: number;
}

export interface EnhancedClassifiedPage {
  url: string;
  title: string;
  summary: string;
  refined_tags: RefinedTagSchema;
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

export interface ProcessingStatus {
  url: string;
  status: 'pending' | 'queued' | 'scraping' | 'classifying' | 'completed' | 'error';
  error?: string;
  data?: ClassifiedPage;
  retryCount?: number;
  lastUpdated?: string;
}

export enum AppState {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
}

export interface StatData {
  name: string;
  value: number;
}

// AWS-specific types
export interface SQSJobMessage {
  url: string;
  jobId: string;
  batchId: string;
}

export interface DynamoDBRecord {
  PK: string;
  SK: string;
  url: string;
  status: string;
  data?: ClassifiedPage;
  error?: string;
  createdAt: string;
  updatedAt: string;
  ttl?: number;
}

export interface BedrockClassificationRequest {
  url: string;
  content: string;
  model?: string;
}

export interface BedrockClassificationResponse {
  classification: ClassifiedPage;
  tokensUsed: number;
  modelId: string;
}
