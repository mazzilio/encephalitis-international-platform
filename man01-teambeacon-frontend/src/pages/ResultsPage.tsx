/**
 * Results Page
 * Displays personalized results based on user's journey
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Alert,
  AlertTitle,
  Paper,
  Divider,
  Chip,
  Stack,
} from '@mui/material';
import MainLayout from '../components/layout/MainLayout';
import ResultsSection from '../components/results/ResultsSection';
import ResourceCard from '../components/results/ResourceCard';
import ActionButtons from '../components/results/ActionButtons';
import { useUserJourney } from '../contexts/UserJourneyContext';
import { ENCEPHALITIS_INTERNATIONAL, APP_ROUTES } from '../utils/constants';

export default function ResultsPage() {
  const navigate = useNavigate();
  const { state } = useUserJourney();
  const results = state.results;

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    // Redirect to home if no results available
    if (!results) {
      navigate(APP_ROUTES.home);
    }
  }, [results, navigate]);

  if (!results) {
    return null; // Will redirect
  }

  return (
    <MainLayout pageTitle="Your Personalized Results" maxWidth="lg">
      {/* Header Section */}
      <Paper
        elevation={0}
        sx={{
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          p: 4,
          mb: 4,
          borderRadius: 2,
          textAlign: 'center',
        }}
      >
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 700,
            fontSize: { xs: '1.75rem', sm: '2.5rem' },
          }}
        >
          {results.heading}
        </Typography>
        {results.subheading && (
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            {results.subheading}
          </Typography>
        )}
        <Chip
          label="Personalized for You"
          sx={{
            mt: 2,
            bgcolor: 'rgba(255, 255, 255, 0.2)',
            color: 'inherit',
            fontWeight: 600,
          }}
        />
      </Paper>

      {/* Content Sections */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          Your Personalized Information
        </Typography>
        {results.sections.map((section, index) => (
          <ResultsSection
            key={index}
            section={section}
            defaultExpanded={index < 2}
          />
        ))}
      </Box>

      {/* Resources Section */}
      {results.resources && results.resources.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Helpful Resources
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                lg: 'repeat(3, 1fr)',
              },
              gap: 2,
            }}
          >
            {results.resources.map((resource, index) => (
              <ResourceCard key={index} resource={resource} />
            ))}
          </Box>
        </Box>
      )}

      {/* Additional Info */}
      {results.additionalInfo && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 4,
            bgcolor: 'background.default',
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>
            {results.additionalInfo}
          </Typography>
        </Paper>
      )}

      {/* Action Buttons */}
      <ActionButtons />

      <Divider sx={{ my: 4 }} />

      {/* Contact Section */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          bgcolor: 'background.default',
          border: 1,
          borderColor: 'divider',
          borderRadius: 2,
          textAlign: 'center',
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          Need More Support?
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Our team at {ENCEPHALITIS_INTERNATIONAL.name} is here to help
        </Typography>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ justifyContent: 'center', mt: 2 }}
        >
          <Typography variant="body1">
            <strong>Helpline:</strong> {ENCEPHALITIS_INTERNATIONAL.helpline}
          </Typography>
          <Typography variant="body1">
            <strong>Email:</strong> {ENCEPHALITIS_INTERNATIONAL.email}
          </Typography>
        </Stack>
      </Paper>

      {/* Disclaimer */}
      <Alert severity="info" sx={{ mt: 4 }}>
        <AlertTitle sx={{ fontWeight: 600 }}>Medical Disclaimer</AlertTitle>
        <Typography variant="body2">
          This information is for educational purposes only and is not a substitute for
          professional medical advice, diagnosis, or treatment. Always seek the advice of your
          physician or other qualified health provider with any questions you may have
          regarding a medical condition.
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          Content provided in partnership with {ENCEPHALITIS_INTERNATIONAL.name}.
        </Typography>
      </Alert>
    </MainLayout>
  );
}
