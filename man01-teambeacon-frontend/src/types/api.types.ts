/**
 * API request and response type definitions
 */

import type { 
  PatientJourneyData, 
  CaregiverJourneyData, 
  ProfessionalJourneyData 
} from './journey.types';

// API Request Types
export interface PatientJourneyRequest {
  userRole: 'patient';
  userData: PatientJourneyData;
  userQuery: string;
  userQueryType: 'Text' | 'Voice';
}

export interface CaregiverJourneyRequest {
  userRole: 'caregiver';
  userData: CaregiverJourneyData;
  userQuery: string;
  userQueryType: 'Text' | 'Voice';
}

export interface ProfessionalJourneyRequest {
  userRole: 'professional';
  userData: ProfessionalJourneyData;
  userQuery: string;
  userQueryType: 'Text' | 'Voice';
}

export type JourneyRequest = 
  | PatientJourneyRequest 
  | CaregiverJourneyRequest 
  | ProfessionalJourneyRequest;

// API Response Types
export interface ResourceLink {
  title: string;
  url: string;
  description?: string;
  type?: 'internal' | 'external';
}

export interface ContentSection {
  title: string;
  content: string;
  type?: 'info' | 'warning' | 'tip' | 'resource';
  icon?: string;
}

// DynamoDB Content Item (from backend)
export interface ContentItem {
  content_id: string;
  title: string;
  url?: string;
  summary?: string;
  personas?: string[];
  types?: string[];
  stages?: string[];
  topics?: string[];
  description?: string;
  [key: string]: any; // Allow additional fields
}

// Backend Classification Response
export interface Classification {
  personas: string[];
  types: string[];
  stages: string[];
  topics: string[];
}

// Backend API Response (from Lambda)
export interface BackendResponse {
  classification: Classification;
  items: ContentItem[];
  count: number;
  scanned_count?: number;
}

export interface ResultsResponse {
  heading: string;
  subheading?: string;
  sections: ContentSection[];
  resources: ResourceLink[];
  warningSigns?: string[];
  nextSteps?: string[];
  additionalInfo?: string;
  // Include backend data for reference
  classification?: Classification;
  rawItems?: ContentItem[];
}

// API Error Types
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: Record<string, any>;
}

// Generic API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp?: string;
}
