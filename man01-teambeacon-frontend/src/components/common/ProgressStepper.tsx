/**
 * Progress Stepper Component
 * Shows current step in the journey with visual progress indicator
 */

import { Box, LinearProgress, Typography, useTheme } from '@mui/material';

interface ProgressStepperProps {
  currentStep: number;
  totalSteps: number;
  label?: string;
}

export default function ProgressStepper({ currentStep, totalSteps, label }: ProgressStepperProps) {
  const theme = useTheme();
  const progress = (currentStep / totalSteps) * 100;

  return (
    <Box
      sx={{
        mb: 4,
        p: 3,
        bgcolor: 'background.paper',
        borderRadius: 2,
        border: 1,
        borderColor: 'divider',
      }}
      role="progressbar"
      aria-valuenow={currentStep}
      aria-valuemin={0}
      aria-valuemax={totalSteps}
      aria-label={label || 'Progress through questionnaire'}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
          Step {currentStep} of {totalSteps}
        </Typography>
        <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
          {Math.round(progress)}% Complete
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 8,
          borderRadius: 4,
          bgcolor: theme.palette.grey[200],
          '& .MuiLinearProgress-bar': {
            borderRadius: 4,
          },
        }}
      />
      {label && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {label}
        </Typography>
      )}
    </Box>
  );
}
