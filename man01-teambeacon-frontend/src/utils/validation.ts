/**
 * Validation utility functions for journey forms
 */

import type {
  PatientJourneyData,
  CaregiverJourneyData,
  ProfessionalJourneyData,
} from '../types/journey.types';

/**
 * Validate patient journey data
 */
export function validatePatientData(data: PatientJourneyData): string[] {
  const errors: string[] = [];

  if (!data.location) {
    errors.push('Please select your location');
  }

  if (!data.stage) {
    errors.push('Please select your current stage');
  }

  if (!data.recoveryStage) {
    errors.push('Please select your recovery stage');
  }

  if (!data.encephalitisType) {
    errors.push('Please select your encephalitis type');
  }

  if (data.concerns.length === 0) {
    errors.push('Please select at least one concern');
  }

  // Age group and additional query are optional, no validation needed

  return errors;
}

/**
 * Validate caregiver journey data
 */
export function validateCaregiverData(data: CaregiverJourneyData): string[] {
  const errors: string[] = [];

  if (!data.location) {
    errors.push('Please select your location');
  }

  if (!data.diagnosisStatus) {
    errors.push('Please select the diagnosis status');
  }

  if (!data.careStage) {
    errors.push('Please select the current care situation');
  }

  if (!data.encephalitisType) {
    errors.push('Please select the encephalitis type');
  }

  if (data.challenges.length === 0) {
    errors.push('Please select at least one challenge');
  }

  if (!data.role) {
    errors.push('Please select your caregiving role');
  }

  return errors;
}

/**
 * Validate professional journey data
 */
export function validateProfessionalData(data: ProfessionalJourneyData): string[] {
  const errors: string[] = [];

  if (!data.location) {
    errors.push('Please select your location');
  }

  if (!data.professionalRole) {
    errors.push('Please select your professional role');
  }

  if (!data.focusArea) {
    errors.push('Please select your area of interest');
  }

  if (data.needs.length === 0) {
    errors.push('Please select at least one need');
  }

  return errors;
}

/**
 * Check if patient data step is complete
 */
export function isPatientStepComplete(data: PatientJourneyData, step: number): boolean {
  switch (step) {
    case 0: // Location selection
      return data.location !== null;
    case 1: // Diagnosis stage selection
      return data.stage !== null;
    case 2: // Recovery stage selection
      return data.recoveryStage !== null;
    case 3: // Encephalitis type selection
      return data.encephalitisType !== null;
    case 4: // Concerns selection (final step) - at least one concern required
      return data.concerns.length > 0;
    default:
      return false;
  }
}

/**
 * Check if caregiver data step is complete
 */
export function isCaregiverStepComplete(data: CaregiverJourneyData, step: number): boolean {
  switch (step) {
    case 0: // Location
      return data.location !== null;
    case 1: // Diagnosis status
      return data.diagnosisStatus !== null;
    case 2: // Care stage
      return data.careStage !== null;
    case 3: // Encephalitis type
      return data.encephalitisType !== null;
    case 4: // Challenges
      return data.challenges.length > 0;
    case 5: // Role
      return data.role !== null;
    default:
      return false;
  }
}

/**
 * Check if professional data step is complete
 */
export function isProfessionalStepComplete(
  data: ProfessionalJourneyData,
  step: number
): boolean {
  switch (step) {
    case 0: // Location
      return data.location !== null;
    case 1: // Professional role
      return data.professionalRole !== null;
    case 2: // Focus area
      return data.focusArea !== null;
    case 3: // Needs
      return data.needs.length > 0;
    default:
      return false;
  }
}

/**
 * Sanitize user input (prevent XSS)
 */
export function sanitizeInput(input: string): string {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: string[]): string {
  if (errors.length === 0) return '';
  if (errors.length === 1) return errors[0];
  return 'Please address the following:\n' + errors.map((e, i) => `${i + 1}. ${e}`).join('\n');
}
