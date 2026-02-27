/**
 * Professional Journey Page
 * Multi-step questionnaire for healthcare professionals and researchers
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
  Snackbar,
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import ScienceIcon from '@mui/icons-material/Science';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import SchoolIcon from '@mui/icons-material/School';
import SearchIcon from '@mui/icons-material/Search';
import EmergencyIcon from '@mui/icons-material/Emergency';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';
import TimelineIcon from '@mui/icons-material/Timeline';
import ChildCareIcon from '@mui/icons-material/ChildCare';
import BiotechIcon from '@mui/icons-material/Biotech';
import DescriptionIcon from '@mui/icons-material/Description';
import ArticleIcon from '@mui/icons-material/Article';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AssessmentIcon from '@mui/icons-material/Assessment';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PublicIcon from '@mui/icons-material/Public';
import MainLayout from '../components/layout/MainLayout';
import ProgressStepper from '../components/common/ProgressStepper';
import OptionCard from '../components/common/OptionCard';
import { useUserJourney } from '../contexts/UserJourneyContext';
import { useJourneySubmission } from '../hooks/useJourneySubmission';
import { isProfessionalStepComplete } from '../utils/validation';
import type { ProfessionalRole, ProfessionalFocus, ProfessionalNeed, UserLocation } from '../types/journey.types';
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

const PROFESSIONAL_ROLES: { value: ProfessionalRole; label: string; description: string; icon: any }[] = [
  { 
    value: 'clinician', 
    label: 'Clinician',
    description: 'Physician, nurse, or other clinical healthcare provider',
    icon: <LocalHospitalIcon sx={{ fontSize: 28 }} />,
  },
  { 
    value: 'researcher', 
    label: 'Researcher',
    description: 'Conducting research on encephalitis',
    icon: <ScienceIcon sx={{ fontSize: 28 }} />,
  },
  { 
    value: 'allied_health', 
    label: 'Allied health professional',
    description: 'Therapist, social worker, or support specialist',
    icon: <HealthAndSafetyIcon sx={{ fontSize: 28 }} />,
  },
  { 
    value: 'student', 
    label: 'Student',
    description: 'Medical, nursing, or research student',
    icon: <SchoolIcon sx={{ fontSize: 28 }} />,
  },
];

const FOCUS_AREAS: { value: ProfessionalFocus; label: string; description: string; icon: any }[] = [
  { 
    value: 'diagnosis', 
    label: 'Diagnosis and assessment',
    description: 'Initial diagnosis and patient evaluation',
    icon: <SearchIcon sx={{ fontSize: 28 }} />,
  },
  { 
    value: 'acute_management', 
    label: 'Acute management',
    description: 'Emergency and critical care treatment',
    icon: <EmergencyIcon sx={{ fontSize: 28 }} />,
  },
  { 
    value: 'rehabilitation', 
    label: 'Rehabilitation and recovery',
    description: 'Post-acute recovery and rehabilitation',
    icon: <AccessibilityNewIcon sx={{ fontSize: 28 }} />,
  },
  { 
    value: 'long_term_outcomes', 
    label: 'Long-term outcomes',
    description: 'Ongoing management and follow-up care',
    icon: <TimelineIcon sx={{ fontSize: 28 }} />,
  },
  { 
    value: 'pediatric', 
    label: 'Pediatric encephalitis',
    description: 'Encephalitis in children and adolescents',
    icon: <ChildCareIcon sx={{ fontSize: 28 }} />,
  },
  { 
    value: 'autoimmune_infectious', 
    label: 'Autoimmune/infectious causes',
    description: 'Etiology and pathophysiology research',
    icon: <BiotechIcon sx={{ fontSize: 28 }} />,
  },
];

const PROFESSIONAL_NEEDS: { value: ProfessionalNeed; label: string; icon: any }[] = [
  { value: 'clinical_guidelines', label: 'Clinical guidelines and protocols', icon: <DescriptionIcon /> },
  { value: 'latest_research', label: 'Latest research and evidence', icon: <ArticleIcon /> },
  { value: 'patient_education', label: 'Patient education resources', icon: <MenuBookIcon /> },
  { value: 'assessment_tools', label: 'Assessment and diagnostic tools', icon: <AssessmentIcon /> },
];

export default function ProfessionalJourneyPage() {
  const navigate = useNavigate();
  const { state, updateProfessionalData, setStep } = useUserJourney();
  const { submitCurrentJourney, isSubmitting, error } = useJourneySubmission();
  const [localError, setLocalError] = useState<string | null>(null);
  const [isLocalSubmitting, setIsLocalSubmitting] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const totalSteps = 4;
  
  // Combined submitting state
  const isActuallySubmitting = isSubmitting || isLocalSubmitting;

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [state.currentStep]);
  const currentStep = state.currentStep + 1;

  const handleLocationChange = (location: UserLocation) => {
    updateProfessionalData({ location });
    setLocalError(null);
    // Automatically advance to next step after selection
    setTimeout(() => {
      setStep(state.currentStep + 1);
    }, 300); // Small delay for visual feedback
  };

  const handleNext = () => {
    if (!isProfessionalStepComplete(state.professionalData, state.currentStep)) {
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
    if (!isProfessionalStepComplete(state.professionalData, state.currentStep)) {
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

  const handleNeedToggle = (need: ProfessionalNeed) => {
    const needs = state.professionalData.needs || [];
    const newNeeds = needs.includes(need)
      ? needs.filter((n) => n !== need)
      : [...needs, need];
    updateProfessionalData({ needs: newNeeds });
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
                  selected={state.professionalData.location === location.value}
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
                What is your professional role?
              </Typography>
              <Typography variant="body1" color="text.secondary">
                This helps us provide the most relevant professional resources
              </Typography>
            </Box>
            
            <Box>
              {PROFESSIONAL_ROLES.map((role) => (
                <OptionCard
                  key={role.value}
                  icon={role.icon}
                  title={role.label}
                  description={role.description}
                  selected={state.professionalData.professionalRole === role.value}
                  onClick={() => {
                    updateProfessionalData({ professionalRole: role.value });
                    setLocalError(null);
                  }}
                  value={role.value}
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
                What is your primary area of interest?
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Select the area most relevant to your current work or study
              </Typography>
            </Box>
            
            <Box>
              {FOCUS_AREAS.map((area) => (
                <OptionCard
                  key={area.value}
                  icon={area.icon}
                  title={area.label}
                  description={area.description}
                  selected={state.professionalData.focusArea === area.value}
                  onClick={() => {
                    updateProfessionalData({ focusArea: area.value });
                    setLocalError(null);
                  }}
                  value={area.value}
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
                What do you need right now?
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Select all resources that would be most helpful
              </Typography>
            </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
              Selected: {state.professionalData.needs.length} item(s)
            </Alert>
            
            <FormGroup>
              {PROFESSIONAL_NEEDS.map((need) => (
                <FormControlLabel
                  key={need.value}
                  control={
                    <Checkbox
                      checked={state.professionalData.needs.includes(need.value)}
                      onChange={() => handleNeedToggle(need.value)}
                      icon={need.icon}
                      checkedIcon={need.icon}
                    />
                  }
                  label={need.label}
                  sx={{ 
                    mb: 1,
                    p: 2,
                    border: 1,
                    borderColor: state.professionalData.needs.includes(need.value) ? 'primary.main' : 'divider',
                    borderRadius: 2,
                    bgcolor: state.professionalData.needs.includes(need.value) ? 'primary.lighter' : 'transparent',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'primary.lighter',
                    },
                  }}
                />
              ))}
            </FormGroup>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <MainLayout pageTitle="Professional Journey" maxWidth="md">
      <ProgressStepper
        currentStep={currentStep}
        totalSteps={totalSteps}
        label="Professional Information"
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

        {state.currentStep < totalSteps - 1 ? (
          <Button
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            onClick={handleNext}
            disabled={!isProfessionalStepComplete(state.professionalData, state.currentStep)}
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
            disabled={isActuallySubmitting || !isProfessionalStepComplete(state.professionalData, state.currentStep)}
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
