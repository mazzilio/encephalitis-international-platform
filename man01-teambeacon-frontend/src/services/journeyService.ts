/**
 * Journey API Service
 * Handles submission of patient, caregiver, and professional journey data
 */

import apiClient, { retryRequest } from './api';
import type {
  PatientJourneyRequest,
  CaregiverJourneyRequest,
  ProfessionalJourneyRequest,
  ResultsResponse,
  ApiResponse,
  BackendResponse,
  ContentItem,
  ResourceLink,
  ContentSection,
} from '../types/api.types';
import type {
  PatientJourneyData,
  CaregiverJourneyData,
  ProfessionalJourneyData,
} from '../types/journey.types';

/**
 * Transform backend response to frontend ResultsResponse format
 */
function transformBackendResponse(
  backendData: BackendResponse,
  userRole: 'patient' | 'caregiver' | 'professional'
): ResultsResponse {
  const { classification, items, count } = backendData;

  // Generate heading based on user role and results
  let heading = 'Your Personalized Resources';
  let subheading = `We found ${count} resource${count !== 1 ? 's' : ''} tailored to your needs`;

  if (userRole === 'patient') {
    heading = 'Resources for Your Journey';
    subheading = `Personalized information to support your recovery and wellbeing`;
  } else if (userRole === 'caregiver') {
    heading = 'Caregiver Support Resources';
    subheading = `Information and guidance to help you in your caregiving role`;
  } else if (userRole === 'professional') {
    heading = 'Professional Resources';
    subheading = `Clinical information and research for healthcare professionals`;
  }

  // Transform items into resources
  const resources: ResourceLink[] = items.map((item: ContentItem) => ({
    title: item.title || 'Untitled Resource',
    url: item.url || '#',
    description: item.summary || item.description || '',
    type: item.url?.startsWith('http') ? 'external' : 'internal',
  }));

  // Create content sections based on classification
  const sections: ContentSection[] = [];

  // Add overview section
  if (count > 0) {
    sections.push({
      title: 'Overview',
      content: `Based on your responses, we've identified ${count} relevant resource${count !== 1 ? 's' : ''} to support you. These resources have been carefully selected to match your specific situation and needs.`,
      type: 'info',
    });
  } else {
    sections.push({
      title: 'No Specific Matches',
      content: 'We couldn\'t find resources that exactly match your criteria, but we recommend exploring our general resources or contacting our support team for personalized assistance.',
      type: 'info',
    });
  }

  // Add classification insights
  if (classification.topics.length > 0) {
    const topicLabels = classification.topics.map(t => t.replace('topic:', '').replace(/_/g, ' '));
    sections.push({
      title: 'Focus Areas',
      content: `Your resources focus on: ${topicLabels.join(', ')}. These areas were identified based on your concerns and current situation.`,
      type: 'tip',
    });
  }

  // Add stage-specific guidance
  if (classification.stages.length > 0) {
    const stageLabel = classification.stages[0].replace('stage:', '').replace(/_/g, ' ');
    let stageContent = '';
    
    if (classification.stages.includes('stage:acute_hospital')) {
      stageContent = 'You\'re in the acute phase. Focus on understanding your diagnosis, treatment options, and what to expect during hospitalization.';
    } else if (classification.stages.includes('stage:early_recovery')) {
      stageContent = 'You\'re in early recovery. This is a critical time for rehabilitation and adjustment. Be patient with yourself and follow your healthcare team\'s guidance.';
    } else if (classification.stages.includes('stage:long_term_management')) {
      stageContent = 'You\'re managing long-term effects. Focus on strategies for daily living, ongoing support, and maintaining quality of life.';
    } else {
      stageContent = `Resources tailored for the ${stageLabel} phase of your journey.`;
    }
    
    sections.push({
      title: 'Your Current Stage',
      content: stageContent,
      type: 'info',
    });
  }

  // Next steps based on role
  const nextSteps: string[] = [];
  if (userRole === 'patient') {
    nextSteps.push('Review the resources below that match your situation');
    nextSteps.push('Keep a journal of your symptoms and progress');
    nextSteps.push('Stay connected with your healthcare team');
    nextSteps.push('Consider joining a support group');
  } else if (userRole === 'caregiver') {
    nextSteps.push('Explore the caregiver resources below');
    nextSteps.push('Remember to take care of your own wellbeing');
    nextSteps.push('Connect with other caregivers for support');
    nextSteps.push('Keep communication open with healthcare providers');
  }

  // Warning signs (general)
  const warningSigns: string[] = [
    'Sudden worsening of symptoms',
    'New or severe headaches',
    'Confusion or changes in consciousness',
    'Seizures or convulsions',
    'Difficulty breathing',
    'High fever that doesn\'t respond to medication',
  ];

  const transformedResponse: ResultsResponse = {
    heading,
    subheading,
    sections,
    resources,
    nextSteps,
    warningSigns,
    classification,
    rawItems: items,
  };
  
  return transformedResponse;
}

/**
 * Submit patient journey data
 */
export async function submitPatientJourney(
  data: PatientJourneyData
): Promise<ResultsResponse> {
  const request: PatientJourneyRequest = {
    userRole: 'patient',
    userData: data,
    userQuery: data.additionalQuery || '',
    userQueryType: 'Text',
  };

  const response = await retryRequest(
    () => apiClient.post<BackendResponse>('/', request),
    3,
    1000
  );

  const backendData = response.data;
  return transformBackendResponse(backendData, 'patient');
}

/**
 * Submit caregiver journey data
 */
export async function submitCaregiverJourney(
  data: CaregiverJourneyData
): Promise<ResultsResponse> {
  const request: CaregiverJourneyRequest = {
    userRole: 'caregiver',
    userData: data,
    userQuery: '',
    userQueryType: 'Text',
  };

  const response = await retryRequest(
    () => apiClient.post<BackendResponse>('/', request),
    3,
    1000
  );

  const backendData = response.data;
  return transformBackendResponse(backendData, 'caregiver');
}

/**
 * Submit professional journey data
 */
export async function submitProfessionalJourney(
  data: ProfessionalJourneyData
): Promise<ResultsResponse> {
  const request: ProfessionalJourneyRequest = {
    userRole: 'professional',
    userData: data,
    userQuery: '',
    userQueryType: 'Text',
  };

  const response = await retryRequest(
    () => apiClient.post<BackendResponse>('/', request),
    3,
    1000
  );

  const backendData = response.data;
  return transformBackendResponse(backendData, 'professional');
}

/**
 * Generic journey submission that routes to appropriate endpoint
 */
export async function submitJourney(
  userRole: 'patient' | 'caregiver' | 'professional',
  data: PatientJourneyData | CaregiverJourneyData | ProfessionalJourneyData
): Promise<ResultsResponse> {
  switch (userRole) {
    case 'patient':
      return submitPatientJourney(data as PatientJourneyData);
    case 'caregiver':
      return submitCaregiverJourney(data as CaregiverJourneyData);
    case 'professional':
      return submitProfessionalJourney(data as ProfessionalJourneyData);
    default:
      throw new Error(`Invalid user role: ${userRole}`);
  }
}

/**
 * Save journey results for later access (optional feature)
 * Could be used to generate a shareable link or save to user account
 */
export async function saveResults(
  resultsId: string,
  email?: string
): Promise<{ shareUrl: string }> {
  const response = await apiClient.post<ApiResponse<{ shareUrl: string }>>(
    '/journey/save-results',
    {
      resultsId,
      email,
    }
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to save results');
  }

  return response.data.data;
}

/**
 * Retrieve saved results by ID
 */
export async function getResults(resultsId: string): Promise<ResultsResponse> {
  const response = await apiClient.get<ApiResponse<ResultsResponse>>(
    `/journey/results/${resultsId}`
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to retrieve results');
  }

  return response.data.data;
}

/**
 * Send results via email
 */
export async function emailResults(
  resultsId: string,
  recipientEmail: string,
  recipientName?: string
): Promise<{ success: boolean }> {
  const response = await apiClient.post<ApiResponse<{ success: boolean }>>(
    '/journey/email-results',
    {
      resultsId,
      recipientEmail,
      recipientName,
    }
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to email results');
  }

  return response.data.data;
}

/**
 * Log analytics event (optional - for tracking user journey completion)
 * Currently disabled - endpoint not implemented on backend
 */
/*
export async function logAnalyticsEvent(
  eventName: string,
  eventData: Record<string, any>
): Promise<void> {
  try {
    await apiClient.post('/analytics/event', {
      eventName,
      eventData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Don't throw on analytics failures - just log
    console.warn('[Analytics] Failed to log event:', eventName, error);
  }
}
*/

/**
 * Submit transcribed text from voice recording to backend for processing
 * @param transcribedText - The transcribed text from voice recording
 * @param userRole - The user's role (patient, caregiver, or professional)
 * @returns API response with personalized guidance
 */
export async function submitVoiceRecording(
  transcribedText: string,
  userRole: 'patient' | 'caregiver' | 'professional' = 'patient'
): Promise<ResultsResponse> {
  try {
    // Prepare request payload with transcribed text
    const request = {
      userRole: userRole,
      userData: {},
      userQuery: transcribedText,
      userQueryType: 'Text' as const,
    };

    const response = await retryRequest(
      () => apiClient.post<BackendResponse>('/', request),
      3,
      1000
    );

    const backendData = response.data;
    return transformBackendResponse(backendData, userRole);
  } catch (error) {
    console.error('Error submitting voice recording:', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Failed to process voice recording. Please try again or use the manual journey option.'
    );
  }
}

export default {
  submitPatientJourney,
  submitCaregiverJourney,
  submitProfessionalJourney,
  submitJourney,
  saveResults,
  getResults,
  emailResults,
  submitVoiceRecording,
};
