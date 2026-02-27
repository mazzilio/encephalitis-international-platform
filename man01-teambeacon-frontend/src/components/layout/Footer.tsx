/**
 * Footer Component
 * Displays Encephalitis International contact information, legal details, and partner badges
 */

import {
  Box,
  Container,
  Typography,
  Link,
  Divider,
  Stack,
} from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LanguageIcon from '@mui/icons-material/Language';
import { ENCEPHALITIS_INTERNATIONAL, MEDICAL_DISCLAIMER } from '../../utils/constants';

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider',
        py: 6,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 4,
          }}
        >
          {/* About & Attribution */}
          <Box sx={{ flex: { md: 1 } }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              {ENCEPHALITIS_INTERNATIONAL.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {ENCEPHALITIS_INTERNATIONAL.tagline}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              This application provides personalized information and support for people
              affected by encephalitis, their caregivers, and healthcare professionals.
            </Typography>
            <Stack spacing={0.5} sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                {ENCEPHALITIS_INTERNATIONAL.charityNumber}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {ENCEPHALITIS_INTERNATIONAL.charityNumberScotland}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {ENCEPHALITIS_INTERNATIONAL.companyNumber}
              </Typography>
            </Stack>
          </Box>

          {/* Contact Information */}
          <Box sx={{ flex: { md: 1 } }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Contact & Support
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                  Need help?
                </Typography>
                <Link
                  href={`tel:${ENCEPHALITIS_INTERNATIONAL.helpline.replace(/\s/g, '')}`}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    color: 'primary.main',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  <PhoneIcon fontSize="small" />
                  <Typography variant="body2">
                    {ENCEPHALITIS_INTERNATIONAL.helpline}
                  </Typography>
                </Link>
              </Box>

              <Box>
                <Link
                  href={`mailto:${ENCEPHALITIS_INTERNATIONAL.email}`}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    color: 'primary.main',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  <EmailIcon fontSize="small" />
                  <Typography variant="body2">
                    {ENCEPHALITIS_INTERNATIONAL.email}
                  </Typography>
                </Link>
              </Box>

              <Box>
                <Link
                  href={ENCEPHALITIS_INTERNATIONAL.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    color: 'primary.main',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  <LanguageIcon fontSize="small" />
                  <Typography variant="body2">
                    Visit Encephalitis International
                  </Typography>
                </Link>
              </Box>
            </Stack>
          </Box>

          {/* Important Information */}
          <Box sx={{ flex: { md: 1 } }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Important Information
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: 'error.main' }}>
                  Emergency
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  If experiencing severe symptoms or a medical emergency, call emergency
                  services immediately.
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                  Medical Disclaimer
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {MEDICAL_DISCLAIMER}
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Partner Badges - Placeholder */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            gutterBottom
            sx={{ display: 'block', mb: 2 }}
          >
            Supported by:
          </Typography>
          <Stack
            direction="row"
            spacing={2}
            flexWrap="wrap"
            sx={{
              '& > *': {
                opacity: 0.7,
                transition: 'opacity 0.2s',
                '&:hover': {
                  opacity: 1,
                },
              },
            }}
          >
            {/* Add partner badge images here when available */}
            <Typography variant="caption" color="text.secondary">
              Lottery Funded
            </Typography>
            <Typography variant="caption" color="text.secondary">
              •
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Carbon Neutral Business
            </Typography>
            <Typography variant="caption" color="text.secondary">
              •
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Disability Confident Employer
            </Typography>
          </Stack>
        </Box>

        {/* Copyright */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} {ENCEPHALITIS_INTERNATIONAL.name}. All rights reserved.
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Content provided in partnership with Encephalitis International
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
