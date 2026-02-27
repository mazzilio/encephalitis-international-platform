/**
 * UserJourneyContext - Global state management for user journey
 * Manages user role, answers, navigation, and API interactions
 */

import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import type { UserRole } from '../types/user.types';
import type { 
  PatientJourneyData, 
  CaregiverJourneyData, 
  ProfessionalJourneyData 
} from '../types/journey.types';
import type { ResultsResponse } from '../types/api.types';

// State interface
interface UserJourneyState {
  userRole: UserRole;
  currentStep: number;
  totalSteps: number;
  patientData: PatientJourneyData;
  caregiverData: CaregiverJourneyData;
  professionalData: ProfessionalJourneyData;
  results: ResultsResponse | null;
  isLoading: boolean;
  error: string | null;
}

// Action types
type UserJourneyAction =
  | { type: 'SET_USER_ROLE'; payload: UserRole }
  | { type: 'UPDATE_PATIENT_DATA'; payload: Partial<PatientJourneyData> }
  | { type: 'UPDATE_CAREGIVER_DATA'; payload: Partial<CaregiverJourneyData> }
  | { type: 'UPDATE_PROFESSIONAL_DATA'; payload: Partial<ProfessionalJourneyData> }
  | { type: 'NEXT_STEP' }
  | { type: 'PREVIOUS_STEP' }
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SET_TOTAL_STEPS'; payload: number }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_RESULTS'; payload: ResultsResponse }
  | { type: 'RESET_JOURNEY' };

// Context interface
interface UserJourneyContextType {
  state: UserJourneyState;
  setUserRole: (role: UserRole) => void;
  updatePatientData: (data: Partial<PatientJourneyData>) => void;
  updateCaregiverData: (data: Partial<CaregiverJourneyData>) => void;
  updateProfessionalData: (data: Partial<ProfessionalJourneyData>) => void;
  nextStep: () => void;
  previousStep: () => void;
  setStep: (step: number) => void;
  setTotalSteps: (total: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setResults: (results: ResultsResponse) => void;
  resetJourney: () => void;
  getCurrentJourneyData: () => PatientJourneyData | CaregiverJourneyData | ProfessionalJourneyData | null;
}

// Initial state
const initialState: UserJourneyState = {
  userRole: null,
  currentStep: 0,
  totalSteps: 3,
  patientData: {
    location: null,
    stage: null,
    recoveryStage: null,
    encephalitisType: null,
    concerns: [],
    ageGroup: null,
    additionalQuery: undefined,
  },
  caregiverData: {
    location: null,
    diagnosisStatus: null,
    careStage: null,
    encephalitisType: null,
    challenges: [],
    role: null,
    additionalQuery: '',
  },
  professionalData: {
    location: null,
    professionalRole: null,
    focusArea: null,
    needs: [],
  },
  results: null,
  isLoading: false,
  error: null,
};

// Reducer function
function userJourneyReducer(
  state: UserJourneyState,
  action: UserJourneyAction
): UserJourneyState {
  switch (action.type) {
    case 'SET_USER_ROLE':
      return {
        ...state,
        userRole: action.payload,
        currentStep: 0,
        error: null,
      };

    case 'UPDATE_PATIENT_DATA':
      return {
        ...state,
        patientData: {
          ...state.patientData,
          ...action.payload,
        },
      };

    case 'UPDATE_CAREGIVER_DATA':
      return {
        ...state,
        caregiverData: {
          ...state.caregiverData,
          ...action.payload,
        },
      };

    case 'UPDATE_PROFESSIONAL_DATA':
      return {
        ...state,
        professionalData: {
          ...state.professionalData,
          ...action.payload,
        },
      };

    case 'NEXT_STEP':
      return {
        ...state,
        currentStep: Math.min(state.currentStep + 1, state.totalSteps),
        error: null,
      };

    case 'PREVIOUS_STEP':
      return {
        ...state,
        currentStep: Math.max(state.currentStep - 1, 0),
        error: null,
      };

    case 'SET_STEP':
      return {
        ...state,
        currentStep: action.payload,
        error: null,
      };

    case 'SET_TOTAL_STEPS':
      return {
        ...state,
        totalSteps: action.payload,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
        error: action.payload ? null : state.error,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case 'SET_RESULTS':
      return {
        ...state,
        results: action.payload,
        isLoading: false,
        error: null,
      };

    case 'RESET_JOURNEY':
      return {
        ...initialState,
      };

    default:
      return state;
  }
}

// Create context
const UserJourneyContext = createContext<UserJourneyContextType | undefined>(undefined);

// Provider component
export function UserJourneyProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(userJourneyReducer, initialState);

  // Actions
  const setUserRole = useCallback((role: UserRole) => {
    dispatch({ type: 'SET_USER_ROLE', payload: role });
  }, []);

  const updatePatientData = useCallback((data: Partial<PatientJourneyData>) => {
    dispatch({ type: 'UPDATE_PATIENT_DATA', payload: data });
  }, []);

  const updateCaregiverData = useCallback((data: Partial<CaregiverJourneyData>) => {
    dispatch({ type: 'UPDATE_CAREGIVER_DATA', payload: data });
  }, []);

  const updateProfessionalData = useCallback((data: Partial<ProfessionalJourneyData>) => {
    dispatch({ type: 'UPDATE_PROFESSIONAL_DATA', payload: data });
  }, []);

  const nextStep = useCallback(() => {
    dispatch({ type: 'NEXT_STEP' });
  }, []);

  const previousStep = useCallback(() => {
    dispatch({ type: 'PREVIOUS_STEP' });
  }, []);

  const setStep = useCallback((step: number) => {
    dispatch({ type: 'SET_STEP', payload: step });
  }, []);

  const setTotalSteps = useCallback((total: number) => {
    dispatch({ type: 'SET_TOTAL_STEPS', payload: total });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const setResults = useCallback((results: ResultsResponse) => {
    dispatch({ type: 'SET_RESULTS', payload: results });
  }, []);

  const resetJourney = useCallback(() => {
    dispatch({ type: 'RESET_JOURNEY' });
  }, []);

  const getCurrentJourneyData = useCallback(() => {
    switch (state.userRole) {
      case 'patient':
        return state.patientData;
      case 'caregiver':
        return state.caregiverData;
      case 'professional':
        return state.professionalData;
      default:
        return null;
    }
  }, [state.userRole, state.patientData, state.caregiverData, state.professionalData]);

  const value = useMemo(
    () => ({
      state,
      setUserRole,
      updatePatientData,
      updateCaregiverData,
      updateProfessionalData,
      nextStep,
      previousStep,
      setStep,
      setTotalSteps,
      setLoading,
      setError,
      setResults,
      resetJourney,
      getCurrentJourneyData,
    }),
    [
      state,
      setUserRole,
      updatePatientData,
      updateCaregiverData,
      updateProfessionalData,
      nextStep,
      previousStep,
      setStep,
      setTotalSteps,
      setLoading,
      setError,
      setResults,
      resetJourney,
      getCurrentJourneyData,
    ]
  );

  return (
    <UserJourneyContext.Provider value={value}>
      {children}
    </UserJourneyContext.Provider>
  );
}

// Custom hook to use the context
export function useUserJourney(): UserJourneyContextType {
  const context = useContext(UserJourneyContext);
  if (context === undefined) {
    throw new Error('useUserJourney must be used within a UserJourneyProvider');
  }
  return context;
}

export default UserJourneyContext;
