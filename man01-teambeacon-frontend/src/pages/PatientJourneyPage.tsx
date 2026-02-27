/**
 * Patient Journey Page
 * Multi-step questionnaire for patients/survivors
 */

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
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
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import SendIcon from "@mui/icons-material/Send";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import MemoryIcon from "@mui/icons-material/Memory";
import BatteryChargingFullIcon from "@mui/icons-material/BatteryChargingFull";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import MoodIcon from "@mui/icons-material/Mood";
import RecordVoiceOverIcon from "@mui/icons-material/RecordVoiceOver";
import WorkIcon from "@mui/icons-material/Work";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import BugReportIcon from "@mui/icons-material/BugReport";
import ShieldIcon from "@mui/icons-material/Shield";
import HelpIcon from "@mui/icons-material/Help";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PublicIcon from "@mui/icons-material/Public";
import MainLayout from "../components/layout/MainLayout";
import ProgressStepper from "../components/common/ProgressStepper";
import OptionCard from "../components/common/OptionCard";
import { useUserJourney } from "../contexts/UserJourneyContext";
import { useJourneySubmission } from "../hooks/useJourneySubmission";
import { isPatientStepComplete } from "../utils/validation";
import type {
  PatientStage,
  RecoveryStage,
  EncephalitisType,
  PatientConcern,
  UserLocation,
} from "../types/journey.types";
import { APP_ROUTES } from "../utils/constants";

const LOCATION_OPTIONS: {
  value: UserLocation;
  label: string;
  description: string;
  icon: any;
}[] = [
  {
    value: "uk",
    label: "United Kingdom",
    description: "I am based in England, Scotland, Wales, or Northern Ireland",
    icon: <LocationOnIcon sx={{ fontSize: 28 }} />,
  },
  {
    value: "outside_uk",
    label: "Outside the UK",
    description: "I am based elsewhere in the world",
    icon: <PublicIcon sx={{ fontSize: 28 }} />,
  },
];

const PATIENT_STAGES: {
  value: PatientStage;
  label: string;
  description: string;
  icon: any;
}[] = [
  {
    value: "recently_diagnosed",
    label: "Yes, confirmed diagnosis",
    description: "A medical professional has confirmed encephalitis",
    icon: <CheckCircleIcon sx={{ fontSize: 28 }} />,
  },
  {
    value: "in_recovery",
    label: "In recovery",
    description: "Currently in the recovery phase after treatment",
    icon: <BatteryChargingFullIcon sx={{ fontSize: 28 }} />,
  },
  {
    value: "long_term_survivor",
    label: "Long-term survivor",
    description: "Managing long-term effects and adjustments",
    icon: <CheckCircleIcon sx={{ fontSize: 28 }} />,
  },
  {
    value: "unsure",
    label: "Not sure / Still exploring",
    description: "Looking for information to better understand the condition",
    icon: <HelpOutlineIcon sx={{ fontSize: 28 }} />,
  },
];

const RECOVERY_STAGES: {
  value: RecoveryStage;
  label: string;
  description: string;
  icon: any;
}[] = [
  {
    value: "in_hospital",
    label: "In hospital or recently discharged",
    description: "Currently receiving acute care or just left hospital",
    icon: <ErrorOutlineIcon sx={{ fontSize: 28 }} />,
  },
  {
    value: "early_recovery",
    label: "Early recovery (0-6 months)",
    description: "In the first months of recovery at home",
    icon: <TrendingUpIcon sx={{ fontSize: 28 }} />,
  },
  {
    value: "ongoing_recovery",
    label: "Ongoing recovery (6 months - 2 years)",
    description: "Continuing rehabilitation and adjustment",
    icon: <ShowChartIcon sx={{ fontSize: 28 }} />,
  },
  {
    value: "long_term",
    label: "Long-term (2+ years)",
    description: "Living with long-term effects of encephalitis",
    icon: <CalendarMonthIcon sx={{ fontSize: 28 }} />,
  },
];

const ENCEPHALITIS_TYPES: {
  value: EncephalitisType;
  label: string;
  description: string;
  icon: any;
}[] = [
  {
    value: "infectious",
    label: "Infectious encephalitis",
    description:
      "Caused by viruses (e.g., herpes simplex, tick-borne), bacteria, or other pathogens",
    icon: <BugReportIcon sx={{ fontSize: 28 }} />,
  },
  {
    value: "autoimmune",
    label: "Autoimmune encephalitis",
    description:
      "Caused by the immune system attacking the brain (e.g., anti-NMDAR, limbic)",
    icon: <ShieldIcon sx={{ fontSize: 28 }} />,
  },
  {
    value: "unknown",
    label: "I don't know the type",
    description: "The type hasn't been identified or I'm not sure",
    icon: <HelpIcon sx={{ fontSize: 28 }} />,
  },
  {
    value: "other_multiple",
    label: "Other / Multiple types",
    description: "A different type or combination of causes",
    icon: <MoreHorizIcon sx={{ fontSize: 28 }} />,
  },
];

const CONCERNS: { value: PatientConcern; label: string; icon: any }[] = [
  {
    value: "memory",
    label: "Memory or concentration problems",
    icon: <MemoryIcon />,
  },
  {
    value: "fatigue",
    label: "Fatigue and energy levels",
    icon: <BatteryChargingFullIcon />,
  },
  { value: "seizures", label: "Seizures", icon: <FlashOnIcon /> },
  { value: "mood", label: "Mood or personality changes", icon: <MoodIcon /> },
  {
    value: "speech_movement",
    label: "Speech or movement issues",
    icon: <RecordVoiceOverIcon />,
  },
  {
    value: "returning_work",
    label: "Returning to work/school",
    icon: <WorkIcon />,
  },
  {
    value: "understanding",
    label: "Understanding encephalitis itself",
    icon: <MenuBookIcon />,
  },
];

export default function PatientJourneyPage() {
  const navigate = useNavigate();
  const { state, updatePatientData, setStep } = useUserJourney();
  const { submitCurrentJourney, isSubmitting, error } = useJourneySubmission();
  const [localError, setLocalError] = useState<string | null>(null);
  const [isLocalSubmitting, setIsLocalSubmitting] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const totalSteps = 5;
  const currentStep = state.currentStep + 1; // Display as 1-indexed

  // Combined submitting state
  const isActuallySubmitting = isSubmitting || isLocalSubmitting;

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [state.currentStep]);

  const handleLocationChange = (location: UserLocation) => {
    updatePatientData({ location });
    setLocalError(null);
    // Automatically advance to next step after selection
    setTimeout(() => {
      setStep(state.currentStep + 1);
    }, 300); // Small delay for visual feedback
  };

  const handleStageChange = (stage: PatientStage) => {
    updatePatientData({ stage });
    setLocalError(null);
    // Automatically advance to next step after selection
    setTimeout(() => {
      setStep(state.currentStep + 1);
    }, 300); // Small delay for visual feedback
  };

  const handleRecoveryStageChange = (recoveryStage: RecoveryStage) => {
    updatePatientData({ recoveryStage });
    setLocalError(null);
    // Automatically advance to next step after selection
    setTimeout(() => {
      setStep(state.currentStep + 1);
    }, 300); // Small delay for visual feedback
  };

  const handleEncephalitisTypeChange = (encephalitisType: EncephalitisType) => {
    updatePatientData({ encephalitisType });
    setLocalError(null);
    // Automatically advance to next step after selection
    setTimeout(() => {
      setStep(state.currentStep + 1);
    }, 300); // Small delay for visual feedback
  };

  const handleConcernToggle = (concern: PatientConcern) => {
    const concerns = state.patientData.concerns || [];
    const newConcerns = concerns.includes(concern)
      ? concerns.filter((c) => c !== concern)
      : [...concerns, concern];

    updatePatientData({ concerns: newConcerns });
    setLocalError(null);
  };

  const handleAdditionalQueryChange = (query: string) => {
    updatePatientData({ additionalQuery: query });
  };

  const handleNext = () => {
    if (!isPatientStepComplete(state.patientData, state.currentStep)) {
      setLocalError("Please answer the required question before continuing");
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
    if (!isPatientStepComplete(state.patientData, state.currentStep)) {
      setLocalError("Please complete all required fields");
      return;
    }

    try {
      setIsLocalSubmitting(true);
      console.log("Submitting patient journey with data:", state.patientData);
      const success = await submitCurrentJourney();
      console.log("Journey submitted, success:", success, "error:", error);

      // Navigate if submission was successful
      if (success) {
        console.log("Navigating to search results");
        navigate(APP_ROUTES.searchResults);
      } else {
        console.log("Submission failed");
        if (error) {
          // If there's a specific error, show it in the alert at the top
          setLocalError(error);
        } else {
          // If no specific error but failed, show generic snackbar
          setSnackbarMessage(
            "We couldn't retrieve your personalized results. Please try again or contact our helpline for assistance."
          );
          setSnackbarOpen(true);
        }
      }
    } finally {
      setIsLocalSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (state.currentStep) {
      case 0:
        return (
          <Box>
            <Box sx={{ textAlign: "center", mb: 4 }}>
              <Typography
                variant="h4"
                component="h2"
                gutterBottom
                sx={{ fontWeight: 600, fontSize: "2.25rem" }}
              >
                Where are you based?
              </Typography>
              <Typography variant="body1" color="text.secondary">
                This helps us provide you with the most relevant resources and
                support services for your location.
              </Typography>
            </Box>

            <Box>
              {LOCATION_OPTIONS.map((location) => (
                <OptionCard
                  key={location.value}
                  icon={location.icon}
                  title={location.label}
                  description={location.description}
                  selected={state.patientData.location === location.value}
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
            <Box sx={{ textAlign: "center", mb: 4 }}>
              <Typography
                variant="h4"
                component="h2"
                gutterBottom
                sx={{ fontWeight: 600, fontSize: "2.25rem" }}
              >
                Have you received a diagnosis?
              </Typography>
              <Typography variant="body1" color="text.secondary">
                This helps us provide the most relevant resources
              </Typography>
            </Box>

            <Box>
              {PATIENT_STAGES.map((stage) => (
                <OptionCard
                  key={stage.value}
                  icon={stage.icon}
                  title={stage.label}
                  description={stage.description}
                  selected={state.patientData.stage === stage.value}
                  onClick={() => handleStageChange(stage.value)}
                  value={stage.value}
                />
              ))}
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Box sx={{ textAlign: "center", mb: 4 }}>
              <Typography
                variant="h4"
                component="h2"
                gutterBottom
                sx={{ fontWeight: 600, fontSize: "2.25rem" }}
              >
                Where are you in your recovery journey?
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Everyone's journey is different. Select the option that best
                describes your current situation.
              </Typography>
            </Box>

            <Box>
              {RECOVERY_STAGES.map((recoveryStage) => (
                <OptionCard
                  key={recoveryStage.value}
                  icon={recoveryStage.icon}
                  title={recoveryStage.label}
                  description={recoveryStage.description}
                  selected={
                    state.patientData.recoveryStage === recoveryStage.value
                  }
                  onClick={() => handleRecoveryStageChange(recoveryStage.value)}
                  value={recoveryStage.value}
                />
              ))}
            </Box>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Box sx={{ textAlign: "center", mb: 4 }}>
              <Typography
                variant="h4"
                component="h2"
                gutterBottom
                sx={{ fontWeight: 600, fontSize: "2.25rem" }}
              >
                Do you know what type of encephalitis you have?
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
                  selected={state.patientData.encephalitisType === type.value}
                  onClick={() => handleEncephalitisTypeChange(type.value)}
                  value={type.value}
                />
              ))}
            </Box>
          </Box>
        );

      case 4:
        return (
          <Box>
            <Box sx={{ textAlign: "center", mb: 4 }}>
              <Typography
                variant="h4"
                component="h2"
                gutterBottom
                sx={{ fontWeight: 600, fontSize: "2.25rem" }}
              >
                What are your main concerns?
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Select all concerns that are important to you right now
              </Typography>
            </Box>

            <FormGroup sx={{ mb: 4 }}>
              {CONCERNS.map((concern) => (
                <FormControlLabel
                  key={concern.value}
                  control={
                    <Checkbox
                      checked={state.patientData.concerns.includes(
                        concern.value
                      )}
                      onChange={() => handleConcernToggle(concern.value)}
                      icon={concern.icon}
                      checkedIcon={concern.icon}
                    />
                  }
                  label={concern.label}
                  sx={{
                    mb: 1,
                    p: 2,
                    border: 1,
                    borderColor: state.patientData.concerns.includes(
                      concern.value
                    )
                      ? "primary.main"
                      : "divider",
                    borderRadius: 2,
                    bgcolor: state.patientData.concerns.includes(concern.value)
                      ? "primary.lighter"
                      : "white",
                    "&:hover": {
                      borderColor: "primary.main",
                      bgcolor: "primary.lighter",
                    },
                  }}
                />
              ))}
            </FormGroup>

            <Box sx={{ mt: 4 }}>
              <Typography
                variant="h6"
                component="h3"
                gutterBottom
                sx={{ fontWeight: 600 }}
              >
                Do you have any specific questions or concerns?
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Tell us more about your situation or any questions you have
                (optional)
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="e.g., When can I return to work? How can I manage my fatigue? What support is available for my family?"
                value={state.patientData.additionalQuery || ""}
                onChange={(e) => handleAdditionalQueryChange(e.target.value)}
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    bgcolor: "white",
                  },
                }}
              />
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <MainLayout pageTitle="Patient Journey" maxWidth="md">
      {/* Logo */}
      <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
        <Link to={APP_ROUTES.home} style={{ textDecoration: 'none' }}>
          <img
            src="/assets/branding/encephalitis-logo.png"
            alt="Encephalitis International"
            style={{
              maxWidth: "280px",
              width: "100%",
              height: "auto",
              position: "relative",
              left: "-12px",
              marginTop: "20px",
              cursor: "pointer"
            }}
          />
        </Link>
      </Box>
      <ProgressStepper
        currentStep={currentStep}
        totalSteps={totalSteps}
        label="Patient Information"
      />

      {(localError || error) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {localError || error}
        </Alert>
      )}

      <Box sx={{ position: "relative" }}>
        {/* Loading overlay */}
        {isActuallySubmitting && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: "rgba(255, 255, 255, 0.7)",
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 2,
            }}
          >
            <Box sx={{ textAlign: "center" }}>
              <CircularProgress size={60} thickness={4} />
              <Typography
                variant="h6"
                sx={{ mt: 2, color: "primary.main", fontWeight: 600 }}
              >
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
        sx={{ justifyContent: "space-between", mt: 4 }}
      >
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={
            state.currentStep === 0
              ? () => navigate(APP_ROUTES.roleSelection)
              : handleBack
          }
          disabled={isActuallySubmitting}
        >
          {state.currentStep === 0 ? "Change Role" : "Back"}
        </Button>

        {/* Hide Next button on steps 0, 1, 2, and 3 (auto-advance on selection) */}
        {state.currentStep === 0 ||
        state.currentStep === 1 ||
        state.currentStep === 2 ||
        state.currentStep === 3 ? (
          <Box /> // Empty box to maintain layout
        ) : state.currentStep < totalSteps - 1 ? (
          <Button
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            onClick={handleNext}
            disabled={
              !isPatientStepComplete(state.patientData, state.currentStep)
            }
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            endIcon={
              isActuallySubmitting ? (
                <CircularProgress size={20} sx={{ color: "white" }} />
              ) : (
                <SendIcon />
              )
            }
            onClick={handleSubmit}
            disabled={
              isActuallySubmitting ||
              !isPatientStepComplete(state.patientData, state.currentStep)
            }
            sx={{
              minWidth: 180,
              position: "relative",
              "&.Mui-disabled": {
                bgcolor: isActuallySubmitting
                  ? "primary.main"
                  : "action.disabledBackground",
                color: isActuallySubmitting ? "white" : "action.disabled",
                opacity: isActuallySubmitting ? 0.8 : 0.6,
              },
            }}
          >
            {isActuallySubmitting
              ? "Getting Your Results..."
              : "Get My Results"}
          </Button>
        )}
      </Stack>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
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
