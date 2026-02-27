/**
 * Custom hook for journey submission
 * Integrates journey service with UserJourneyContext
 */

import { useCallback } from 'react';
import { useUserJourney } from '../contexts/UserJourneyContext';
import { submitJourney } from '../services/journeyService';
import type { ApiError } from '../types/api.types';

interface UseJourneySubmissionReturn {
  submitCurrentJourney: () => Promise<boolean>;
  isSubmitting: boolean;
  error: string | null;
}

export function useJourneySubmission(): UseJourneySubmissionReturn {
  const {
    state,
    setLoading,
    setError,
    setResults,
    getCurrentJourneyData,
  } = useUserJourney();

  const submitCurrentJourney = useCallback(async (): Promise<boolean> => {
    const { userRole } = state;

    if (!userRole) {
      setError('Please select a user role first');
      return false;
    }

    const journeyData = getCurrentJourneyData();

    if (!journeyData) {
      setError('No journey data available');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      const results = await submitJourney(userRole, journeyData);
      setResults(results);
      return true; // Success
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage =
        apiError.message ||
        'Failed to submit your journey. Please check your connection and try again.';

      setError(errorMessage);
      console.error('[Journey Submission Error]', err);
      return false; // Failure
    } finally {
      setLoading(false);
    }
  }, [state, setLoading, setError, setResults, getCurrentJourneyData]);

  return {
    submitCurrentJourney,
    isSubmitting: state.isLoading,
    error: state.error,
  };
}

export default useJourneySubmission;
