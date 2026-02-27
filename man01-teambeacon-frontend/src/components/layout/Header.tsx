/**
 * Header Component
 * Displays Encephalitis International branding and navigation
 */

import {
  AppBar,
  Toolbar,
  Container,
} from '@mui/material';

export default function Header() {

  return (
    <AppBar position="sticky" color="default" elevation={1}>
      <Toolbar>
        <Container maxWidth="lg" sx={{ display: 'flex', alignItems: 'center', gap: 2, px: { xs: 0, sm: 2 } }}>
          {/* Logo and Branding */}
          

          {/* Navigation */}
          
        </Container>
      </Toolbar>
    </AppBar>
  );
}
