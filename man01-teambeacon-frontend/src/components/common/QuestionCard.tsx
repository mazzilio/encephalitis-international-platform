/**
 * Question Card Component
 * Wrapper for question sections with consistent styling
 */

import { Paper, Typography, Box } from '@mui/material';
import type { ReactNode } from 'react';

interface QuestionCardProps {
  question: string;
  helpText?: string;
  required?: boolean;
  children: ReactNode;
}

export default function QuestionCard({
  question,
  helpText,
  required = true,
  children,
}: QuestionCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        mb: 3,
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h6"
          component="h3"
          gutterBottom
          sx={{
            fontWeight: 600,
            fontSize: { xs: '1.125rem', sm: '1.25rem' },
          }}
        >
          {question}
          {required && (
            <Typography
              component="span"
              sx={{
                color: 'error.main',
                ml: 0.5,
              }}
              aria-label="required"
            >
              *
            </Typography>
          )}
        </Typography>
        {helpText && (
          <Typography variant="body2" color="text.secondary">
            {helpText}
          </Typography>
        )}
      </Box>
      {children}
    </Paper>
  );
}
