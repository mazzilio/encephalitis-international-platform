/**
 * Placeholder Page Component
 * Temporary page for routes under development
 */

import { Typography, Button, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ConstructionIcon from '@mui/icons-material/Construction';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MainLayout from '../components/layout/MainLayout';
import { APP_ROUTES } from '../utils/constants';

interface PlaceholderPageProps {
  title: string;
  message?: string;
}

export default function PlaceholderPage({ title, message }: PlaceholderPageProps) {
  const navigate = useNavigate();

  return (
    <MainLayout pageTitle={title} maxWidth="md">
      <Paper
        elevation={0}
        sx={{
          textAlign: 'center',
          py: 8,
          px: 4,
          border: 1,
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <ConstructionIcon
          sx={{
            fontSize: 80,
            color: 'warning.main',
            mb: 3,
          }}
        />
        
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        
        <Typography variant="h6" color="text.secondary" paragraph>
          {message || 'This page is currently under development'}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
          We're working hard to bring you personalized guidance and support. Please check back soon!
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(APP_ROUTES.roleSelection)}
          size="large"
        >
          Back to Role Selection
        </Button>
      </Paper>
    </MainLayout>
  );
}
