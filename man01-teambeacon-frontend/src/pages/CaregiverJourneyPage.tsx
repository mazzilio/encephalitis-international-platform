/**
 * Caregiver Journey Page
 * Multi-step questionnaire for caregivers and family members
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Checkbox,
  FormGroup,
  Alert,
  CircularProgress,
  Stack,
  Box,
  Typography,
  FormControlLabel,
  TextField,
  Snackbar,
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import BugReportIcon from '@mui/icons-material/BugReport';
import ShieldIcon from '@mui/icons-material/Shield';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import PsychologyIcon from '@mui/icons-material/Psychology';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import ForumIcon from '@mui/icons-material/Forum';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled';
import MoreTimeIcon from '@mui/icons-material/MoreTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PublicIcon from '@mui/icons-material/Public';
import MainLayout from '../components/layout/MainLayout';
import ProgressStepper from '../components/common/ProgressStepper';
import OptionCard from '../components/common/OptionCard';
import { useUserJourney } from '../contexts/UserJourneyContext';
import { useJourneySubmission } from '../hooks/useJourneySubmission';
import { isCaregiverStepComplete } from '../utils/validation';
import type { DiagnosisStatus, CareStage, EncephalitisType, CaregiverChallenge, CaregiverRole, UserLocation } from '../types/journey.types';
import { APP_ROUTES } from '../utils/constants';

const LOCATION_OPTIONS: { value: UserLocation; label: string; description: string; icon: any }[] = [
  { 
    value: 'uk', 
    label: 'United Kingdom',
    description: 'I am based in England, Scotland, Wales, or Northern Ireland',
    icon: <LocationOnIcon sx={{ fontSize: 28 }} />,
  },
  { 
    value: 'outside_uk', 
    label: 'Outside the UK',
    description: 'I am based elsewhere in the world',
    icon: <PublicIcon sx={{ fontSize: 28 }} />,
  },
];

const DIAGNOSIS_STATUS: { value: DiagnosisStatus; label: string; description: string; icon: any }[] = [
  { 
    value: 'confirmed', 
    label: 'Yes, confirmed diagnosis',
    description: 'A medical professional has confirmed encephalitis',
    icon: <CheckCircleIcon sx={{ fontSize: 28 }} />,
  },
  { 
    value: 'suspected', 
    label: 'Suspected, awaiting confirmation',
    description: 'Currently undergoing tests or awaiting results',
    icon: <AccessTimeIcon sx={{ fontSize: 28 }} />,
  },
  { 
    value: 'not_sure', 
    label: 'Not sure / Still exploring',
    description: 'Looking for information to better understand the condition',
    icon: <HelpOutlineIcon sx={{ fontSize: 28 }} />,
  },
];

const CARE_STAGES: { value: CareStage; label: string; description: string; icon: any }[] = [
  { 
    value: 'in_hospital_or_discharged', 
    label: 'In hospital or recently discharged',
    description: 'Currently receiving acute care or just left hospital',
    icon: <ErrorOutlineIcon sx={{ fontSize: 28 }} />,
  },
  { 
    value: 'early_recovery', 
    label: 'Early recovery (0-6 months)',
    description: 'In the first months of recovery at home',
    icon: <TrendingUpIcon sx={{ fontSize: 28 }} />,
  },
  { 
    value: 'ongoing_recovery', 
    label: 'Ongoing recovery (6 months - 2 years)',
    description: 'Continuing rehabilitation and adjustment',
    icon: <ShowChartIcon sx={{ fontSize: 28 }} />,
  },
  { 
    value: 'long_term', 
    label: 'Long-term (2+ years)',
    description: 'Living with long-term effects of encephalitis',
    icon: <CalendarMonthIcon sx={{ fontSize: 28 }} />,
  },
];

const ENCEPHALITIS_TYPES: { value: EncephalitisType; label: string; description: string; icon: any }[] = [
  { 
    value: 'infectious', 
    label: 'Infectious encephalitis',
    description: 'Caused by viruses (e.g., herpes simplex, tick-borne), bacteria, or other pathogens',
    icon: <BugReportIcon sx={{ fontSize: 28 }} />,
  },
  { 
    value: 'autoimmune', 
    label: 'Autoimmune encephalitis',
    description: 'Caused by the immune system attacking the brain (e.g., anti-NMDAR, limbic)',
    icon: <ShieldIcon sx={{ fontSize: 28 }} />,
  },
  { 
    value: 'unknown', 
    label: "I don't know the type",
    description: "The type hasn't been identified or I'm not sure",
    icon: <HelpOutlineIcon sx={{ fontSize: 28 }} />,
  },
  { 
    value: 'other_multiple', 
    label: 'Other / Multiple types',
    description: 'A different type or combination of causes',
    icon: <MoreHorizIcon sx={{ fontSize: 28 }} />,
  },
];

const CHALLENGES: { value: CaregiverChallenge; label: string; icon: any }[] = [
  { value: 'behavior_changes', label: 'Behavior or personality changes', icon: <PsychologyIcon /> },
  { value: 'memory_confusion', label: 'Memory or confusion issues', icon: <PsychologyIcon /> },
  { value: 'physical_care', label: 'Physical care needs', icon: <FitnessCenterIcon /> },
  { value: 'emotional_stress', label: 'Emotional stress and burnout', icon: <SentimentVeryDissatisfiedIcon /> },
  { value: 'communication_doctors', label: 'Communication with healthcare providers', icon: <ForumIcon /> },
  { value: 'long_term_planning', label: 'Planning long-term support', icon: <EventIcon /> },
];

const CAREGIVER_ROLES: { value: CaregiverRole; label: string; description: string; icon: any }[] = [
  { 
    value: 'full_time', 
    label: 'Full-time caregiver',
    description: 'Primary caregiver providing daily support and care',
    icon: <AccessTimeFilledIcon sx={{ fontSize: 28 }} />,
  },
  { 
    value: 'occasional', 
    label: 'Occasional support',
    description: 'Providing support on a part-time or as-needed basis',
    icon: <MoreTimeIcon sx={{ fontSize: 28 }} />,
  },
];

export default function CaregiverJourneyPage() {
  const navigate = useNavigate();
  const { state, updateCaregiverData, setStep } = useUserJourney();
  const { submitCurrentJourney, isSubmitting, error } = useJourneySubmission();
  const [localError, setLocalError] = useState<string | null>(null);
  const [isLocalSubmitting, setIsLocalSubmitting] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const totalSteps = 6;
  const currentStep = state.currentStep + 1;
  
  // Combined submitting state
  const isActuallySubmitting = isSubmitting || isLocalSubmitting;

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [state.currentStep]);

  const handleLocationChange = (location: UserLocation) => {
    updateCaregiverData({ location });
    setLocalError(null);
    // Automatically advance to next step after selection
    setTimeout(() => {
      setStep(state.currentStep + 1);
    }, 300); // Small delay for visual feedback
  };

  const handleNext = () => {
    if (!isCaregiverStepComplete(state.caregiverData, state.currentStep)) {
      setLocalError('Please answer the required question before continuing');
      return;
    }
    setLocalError(null);
    setStep(state.currentStep + 1);
  };

  const handleBack = () => {
    setLocalError(null);
    setStep(state.currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!isCaregiverStepComplete(state.caregiverData, state.currentStep)) {
      setLocalError('Please complete all required fields');
      return;
    }

    try {
      setIsLocalSubmitting(true);
      const success = await submitCurrentJourney();
      
      // Navigate if submission was successful
      if (success) {
        navigate(APP_ROUTES.searchResults);
      } else {
        if (error) {
          // If there's a specific error, show it in the alert at the top
          setLocalError(error);
        } else {
          // If no specific error but failed, show generic snackbar
          setSnackbarMessage('We couldn\'t retrieve your personalized results. Please try again or contact our helpline for assistance.');
          setSnackbarOpen(true);
        }
      }
    } finally {
      setIsLocalSubmitting(false);
    }
  };

  const handleChallengeToggle = (challenge: CaregiverChallenge) => {
    const challenges = state.caregiverData.challenges || [];
    const newChallenges = challenges.includes(challenge)
      ? challenges.filter((c) => c !== challenge)
      : [...challenges, challenge];
    updateCaregiverData({ challenges: newChallenges });
    setLocalError(null);
  };

  const renderStepContent = () => {
    switch (state.currentStep) {
      case 0:
        return (
          <Box>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 600, fontSize: '2.25rem' }}>
                Where are you based?
              </Typography>
              <Typography variant="body1" color="text.secondary">
                This helps us provide you with the most relevant resources and support services for your location.
              </Typography>
            </Box>
            
            <Box>
              {LOCATION_OPTIONS.map((location) => (
                <OptionCard
                  key={location.value}
                  icon={location.icon}
                  title={location.label}
                  description={location.description}
                  selected={state.caregiverData.location === location.value}
                  onClick={() => handleLocationChange(location.value)}
                  value={location.value}
                />
              ))}
            </Box>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 600, fontSize: '2.25rem' }}>
                Has the person you care for received a diagnosis?
              </Typography>
              <Typography variant="body1" color="text.secondary">
                This helps us provide the most relevant resources
              </Typography>
            </Box>
            
            <Box>
              {DIAGNOSIS_STATUS.map((status) => (
                <OptionCard
                  key={status.value}
                  icon={status.icon}
                  title={status.label}
                  description={status.description}
                  selected={state.caregiverData.diagnosisStatus === status.value}
                  onClick={() => {
                    updateCaregiverData({ diagnosisStatus: status.value });
                    setLocalError(null);
                    // Auto-advance to next step
                    setTimeout(() => {
                      setStep(state.currentStep + 1);
                    }, 300);
                  }}
                  value={status.value}
                />
              ))}
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 600, fontSize: '2.25rem' }}>
                Where is the person you care for in their recovery journey?
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Everyone's journey is different. Select the option that best describes your current situation.
              </Typography>
            </Box>
            
            <Box>
              {CARE_STAGES.map((stage) => (
                <OptionCard
                  key={stage.value}
                  icon={stage.icon}
                  title={stage.label}
                  description={stage.description}
                  selected={state.caregiverData.careStage === stage.value}
                  onClick={() => {
                    updateCaregiverData({ careStage: stage.value });
                    setLocalError(null);
                    // Auto-advance to next step
                    setTimeout(() => {
                      setStep(state.currentStep + 1);
                    }, 300);
                  }}
                  value={stage.value}
                />
              ))}
            </Box>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 600, fontSize: '2.25rem' }}>
                Do you know what type of encephalitis they have?
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Don't worry if you're not sure — we can still help
              </Typography>
            </Box>
            
            <Box>
              {ENCEPHALITIS_TYPES.map((type) => (
                <OptionCard
                  key={type.value}
                  icon={type.icon}
                  title={type.label}
                  description={type.description}
                  selected={state.caregiverData.encephalitisType === type.value}
                  onClick={() => {
                    updateCaregiverData({ encephalitisType: type.value });
                    setLocalError(null);
                    // Auto-advance to next step
                    setTimeout(() => {
                      setStep(state.currentStep + 1);
                    }, 300);
                  }}
                  value={type.value}
                />
              ))}
            </Box>
          </Box>
        );

      case 4:
        return (
          <Box>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 600, fontSize: '2.25rem' }}>
                What are their biggest challenges?
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Select all that are important to you right now
              </Typography>
            </Box>

            <FormGroup sx={{ mb: 4 }}>
              {CHALLENGES.map((challenge) => (
                <FormControlLabel
                  key={challenge.value}
                  control={
                    <Checkbox
                      checked={state.caregiverData.challenges.includes(challenge.value)}
                      onChange={() => handleChallengeToggle(challenge.value)}
                      icon={challenge.icon}
                      checkedIcon={challenge.icon}
                    />
                  }
                  label={challenge.label}
                  sx={{ 
                    mb: 1,
                    p: 2,
                    border: 1,
                    borderColor: state.caregiverData.challenges.includes(challenge.value) ? 'primary.main' : 'divider',
                    borderRadius: 2,
                    bgcolor: state.caregiverData.challenges.includes(challenge.value) ? 'primary.lighter' : 'transparent',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'primary.lighter',
                    },
                  }}
                />
              ))}
            </FormGroup>

            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                Do you have any specific questions or concerns?
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Tell us more about your situation or any questions you have (optional)
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="e.g., How can I support them through recovery? What should I expect? Where can I find respite care?"
                value={state.caregiverData.additionalQuery || ''}
                onChange={(e) => updateCaregiverData({ additionalQuery: e.target.value })}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Box>
          </Box>
        );

      case 5:
        return (
          <Box>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 600, fontSize: '2.25rem' }}>
                What is your caregiving role?
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Understanding your level of involvement helps us tailor our guidance
              </Typography>
            </Box>
            
            <Box>
              {CAREGIVER_ROLES.map((role) => (
                <OptionCard
                  key={role.value}
                  icon={role.icon}
                  title={role.label}
                  description={role.description}
                  selected={state.caregiverData.role === role.value}
                  onClick={() => {
                    updateCaregiverData({ role: role.value });
                    setLocalError(null);
                  }}
                  value={role.value}
                />
              ))}
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <MainLayout pageTitle="Caregiver Journey" maxWidth="md">
      <ProgressStepper
        currentStep={currentStep}
        totalSteps={totalSteps}
        label="Caregiver Information"
      />

      {(localError || error) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {localError || error}
        </Alert>
      )}

      <Box sx={{ position: 'relative' }}>
        {/* Loading overlay */}
        {isActuallySubmitting && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: 'rgba(255, 255, 255, 0.7)',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 2,
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress size={60} thickness={4} />
              <Typography variant="h6" sx={{ mt: 2, color: 'primary.main', fontWeight: 600 }}>
                Processing your information...
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                This may take a few moments
              </Typography>
            </Box>
          </Box>
        )}
        
        {renderStepContent()}
      </Box>

      <Stack
        direction="row"
        spacing={2}
        sx={{ justifyContent: 'space-between', mt: 4 }}
      >
        <Button
          variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={state.currentStep === 0 ? () => navigate(APP_ROUTES.roleSelection) : handleBack}
            disabled={isActuallySubmitting}
        >
          {state.currentStep === 0 ? 'Change Role' : 'Back'}
        </Button>

        {/* Hide Next button on auto-advancing steps (0, 1, 2, 3) */}
        {(state.currentStep === 0 || state.currentStep === 1 || state.currentStep === 2 || state.currentStep === 3) ? (
          <Box /> // Empty box to maintain layout
        ) : state.currentStep < totalSteps - 1 ? (
          <Button
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            onClick={handleNext}
            disabled={!isCaregiverStepComplete(state.caregiverData, state.currentStep)}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            endIcon={
              isActuallySubmitting ? (
                <CircularProgress size={20} sx={{ color: 'white' }} />
              ) : (
                <SendIcon />
              )
            }
            onClick={handleSubmit}
            disabled={isActuallySubmitting || !isCaregiverStepComplete(state.caregiverData, state.currentStep)}
            sx={{
              minWidth: 180,
              position: 'relative',
              '&.Mui-disabled': {
                bgcolor: isActuallySubmitting ? 'primary.main' : 'action.disabledBackground',
                color: isActuallySubmitting ? 'white' : 'action.disabled',
                opacity: isActuallySubmitting ? 0.8 : 0.6,
              },
            }}
          >
            {isActuallySubmitting ? 'Getting Your Results...' : 'Get My Results'}
          </Button>
        )}
      </Stack>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={() => setSnackbarOpen(false)}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    </MainLayout>
  );
}
