/**
 * Action Buttons Component
 * Provides actions for results page (start over)
 */

import { Button, Stack, Divider } from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { useNavigate } from 'react-router-dom';
import { useUserJourney } from '../../contexts/UserJourneyContext';
import { APP_ROUTES } from '../../utils/constants';

export default function ActionButtons() {
  const navigate = useNavigate();
  const { resetJourney } = useUserJourney();

  const handleStartOver = () => {
    if (window.confirm('Are you sure you want to start over? This will clear your current results.')) {
      resetJourney();
      navigate(APP_ROUTES.home);
    }
  };

  return (
    <>
      <Divider sx={{ my: 4 }} />
      
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        <Button
          variant="contained"
          startIcon={<RestartAltIcon />}
          onClick={handleStartOver}
          size="large"
          color="primary"
        >
          Start Over
        </Button>
      </Stack>
    </>
  );
}
