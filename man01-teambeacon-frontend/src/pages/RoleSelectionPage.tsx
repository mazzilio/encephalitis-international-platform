/**
 * Role Selection Page
 * Allows users to choose their role: patient, caregiver, or professional
 * Also provides voice recording option for accessibility
 */

import {
  Box,
  Typography,
  Container,
  Divider,
  Alert,
} from "@mui/material";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import RoleCard from "../components/common/RoleCard";
import VoiceRecorder from "../components/common/VoiceRecorder";
import { useUserJourney } from "../contexts/UserJourneyContext";
import { ROLE_DEFINITIONS } from "../types/user.types";
import type { UserRole } from "../types/user.types";
import { APP_ROUTES } from "../utils/constants";
import { submitVoiceRecording } from "../services/journeyService";
import type { ResultsResponse } from "../types/api.types";

export default function RoleSelectionPage() {
  const navigate = useNavigate();
  const { setUserRole, setResults } = useUserJourney();
  const [voiceSubmitSuccess, setVoiceSubmitSuccess] = useState(false);

  const handleRoleSelect = (role: Exclude<UserRole, null>) => {
    setUserRole(role);

    // Navigate to appropriate journey page
    switch (role) {
      case "patient":
        navigate(APP_ROUTES.patientJourney);
        break;
      case "caregiver":
        navigate(APP_ROUTES.caregiverJourney);
        break;
      case "professional":
        navigate(APP_ROUTES.professionalJourney);
        break;
    }
  };

  const handleVoiceSubmit = async (transcribedText: string): Promise<void> => {
    try {
      // Submit transcribed text to backend
      const results: ResultsResponse = await submitVoiceRecording(
        transcribedText,
        "patient"
      );

      // Store results in context
      setResults(results);

      // Show success message briefly
      setVoiceSubmitSuccess(true);

      // Navigate to search results page after short delay
      setTimeout(() => {
        navigate(APP_ROUTES.searchResults);
      }, 1500);
    } catch (error) {
      // Error will be shown in VoiceRecorder component
      throw error;
    }
  };

  return (
    <MainLayout pageTitle="Select Your Role" maxWidth="lg">
      <Container maxWidth="md">
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

        

        <Box id="role-selection" sx={{ textAlign: "center", mb: 6 }}>
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontWeight: 700,
              fontSize: { xs: "1.75rem", sm: "2.5rem" },
              marginBottom: 0,
            }}
          >
            Tell us about yourself
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{
              fontSize: { xs: "1rem", sm: "1.25rem" },
              fontWeight: 400,
            }}
          >
            Select the option that best matches your situation
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 3,
            mb: 4,
          }}
        >
          {/* Patient Role Card */}
          <RoleCard
            role="patient"
            title={ROLE_DEFINITIONS.patient.title}
            description={ROLE_DEFINITIONS.patient.description}
            icon={ROLE_DEFINITIONS.patient.icon}
            onSelect={() => handleRoleSelect("patient")}
          />

          {/* Caregiver Role Card */}
          <RoleCard
            role="caregiver"
            title={ROLE_DEFINITIONS.caregiver.title}
            description={ROLE_DEFINITIONS.caregiver.description}
            icon={ROLE_DEFINITIONS.caregiver.icon}
            onSelect={() => handleRoleSelect("caregiver")}
          />

          {/* Professional Role Card */}
          <RoleCard
            role="professional"
            title={ROLE_DEFINITIONS.professional.title}
            description={ROLE_DEFINITIONS.professional.description}
            icon={ROLE_DEFINITIONS.professional.icon}
            onSelect={() => handleRoleSelect("professional")}
          />
        </Box>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: "center", mt: 4 }}
        >
          Don't worry, you can always start over if you need to change your
          selection
        </Typography>

        {/* Divider */}
        <Divider sx={{ my: 6 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontWeight: 600 }}
          >
            OR
          </Typography>
        </Divider>

        {/* Voice Recording Option */}
        <Box sx={{ mb: 4 }}>
          {voiceSubmitSuccess && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Voice recording submitted successfully! Redirecting to your
              personalized guidance...
            </Alert>
          )}

          <VoiceRecorder
            onSubmit={handleVoiceSubmit}
            maxDurationSeconds={120} // 2 minutes
          />

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", textAlign: "center", mt: 2 }}
          >
            Your voice recording will be securely processed to provide
            personalized guidance.
            <br />
            We use advanced AI to understand your needs and provide relevant
            resources.
          </Typography>
        </Box>
      </Container>
    </MainLayout>
  );
}
