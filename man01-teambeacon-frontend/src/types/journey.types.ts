/**
 * Journey and questionnaire type definitions
 */

// Patient Journey Types
export type PatientStage = 
  | 'recently_diagnosed'
  | 'in_recovery'
  | 'long_term_survivor'
  | 'unsure';

export type RecoveryStage =
  | 'in_hospital'
  | 'early_recovery'
  | 'ongoing_recovery'
  | 'long_term';

export type EncephalitisType =
  | 'infectious'
  | 'autoimmune'
  | 'unknown'
  | 'other_multiple';

export type PatientConcern =
  | 'memory'
  | 'fatigue'
  | 'seizures'
  | 'mood'
  | 'speech_movement'
  | 'returning_work'
  | 'understanding';

export type AgeGroup = 'child' | 'teen' | 'adult' | 'older_adult';

export type UserLocation = 'uk' | 'outside_uk';

export interface PatientJourneyData {
  location: UserLocation | null;
  stage: PatientStage | null;
  recoveryStage: RecoveryStage | null;
  encephalitisType: EncephalitisType | null;
  concerns: PatientConcern[];
  ageGroup: AgeGroup | null;
  additionalQuery?: string; // Optional text query from the user
}

// Caregiver Journey Types
export type DiagnosisStatus = 
  | 'confirmed'
  | 'suspected'
  | 'not_sure';

export type CareStage = 
  | 'in_hospital_or_discharged'
  | 'early_recovery'
  | 'ongoing_recovery'
  | 'long_term';

export type CaregiverChallenge =
  | 'behavior_changes'
  | 'memory_confusion'
  | 'physical_care'
  | 'emotional_stress'
  | 'communication_doctors'
  | 'long_term_planning';

export type CaregiverRole = 'full_time' | 'occasional';

export interface CaregiverJourneyData {
  location: UserLocation | null;
  diagnosisStatus: DiagnosisStatus | null;
  careStage: CareStage | null;
  encephalitisType: EncephalitisType | null;
  challenges: CaregiverChallenge[];
  role: CaregiverRole | null;
  additionalQuery?: string;
}

// Professional Journey Types
export type ProfessionalRole =
  | 'clinician'
  | 'researcher'
  | 'allied_health'
  | 'student';

export type ProfessionalFocus =
  | 'diagnosis'
  | 'acute_management'
  | 'rehabilitation'
  | 'long_term_outcomes'
  | 'pediatric'
  | 'autoimmune_infectious';

export type ProfessionalNeed =
  | 'clinical_guidelines'
  | 'latest_research'
  | 'patient_education'
  | 'assessment_tools';

export interface ProfessionalJourneyData {
  location: UserLocation | null;
  professionalRole: ProfessionalRole | null;
  focusArea: ProfessionalFocus | null;
  needs: ProfessionalNeed[];
}

// Union type for all journey data
export type JourneyData = 
  | PatientJourneyData 
  | CaregiverJourneyData 
  | ProfessionalJourneyData;

// Question configuration types
export interface QuestionOption {
  value: string;
  label: string;
  description?: string;
}

export interface Question {
  id: string;
  question: string;
  type: 'radio' | 'checkbox' | 'select';
  options: QuestionOption[];
  required: boolean;
  maxSelections?: number; // For checkboxes
  helpText?: string;
}
