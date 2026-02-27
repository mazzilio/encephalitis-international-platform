/**
 * Main Layout Component
 * Wraps the entire application with consistent header, footer, and emergency banner
 */

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Box, Container } from '@mui/material';
import Footer from './Footer';
import EmergencyBanner from '../common/EmergencyBanner';
import { announceToScreenReader } from '../../utils/accessibility';

interface MainLayoutProps {
  children: ReactNode;
  showEmergencyBanner?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  pageTitle?: string;
}

export default function MainLayout({
  children,
  showEmergencyBanner = true,
  maxWidth = 'lg',
  pageTitle,
}: MainLayoutProps) {
  // Announce page changes to screen readers
  useEffect(() => {
    if (pageTitle) {
      announceToScreenReader(`Navigated to ${pageTitle}`, 'polite');
    }
  }, [pageTitle]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
     

      {/* Emergency Banner */}
      {showEmergencyBanner && <EmergencyBanner dismissible />}



      {/* Main Content */}
      <Box
        component="main"
        id="main-content"
        tabIndex={-1}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          py: 4,
          outline: 'none',
        }}
        role="main"
        aria-label="Main content"
      >
        <Container maxWidth={maxWidth} sx={{ flex: 1 }}>
          {children}
        </Container>
      </Box>

      {/* Footer */}
      <Footer />
    </Box>
  );
}
