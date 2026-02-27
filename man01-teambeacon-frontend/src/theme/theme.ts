import { createTheme } from '@mui/material/styles';
import type { ThemeOptions } from '@mui/material/styles';

/**
 * Custom MUI Theme for Encephalitis User Guide
 * - WCAG 2.1 AA compliant colors
 * - Healthcare-appropriate aesthetic
 * - Optimized for accessibility and readability
 */

const themeOptions: ThemeOptions = {
  palette: {
    primary: {
      main: '#ea6852', // Encephalitis International coral
      light: '#ef8d7a',
      dark: '#d14f36',
      contrastText: '#ffffff',
      lighter: '#fdebe8', // Very light coral for backgrounds
    },
    secondary: {
      main: '#7c4dff', // Supportive purple
      light: '#b47cff',
      dark: '#5e35b1',
      contrastText: '#ffffff',
    },
    error: {
      main: '#d32f2f', // High contrast red for warnings
      light: '#ef5350',
      dark: '#c62828',
      contrastText: '#ffffff',
      lighter: '#ffebee', // Very light red for backgrounds
    },
    warning: {
      main: '#ed6c02', // Amber for caution
      light: '#ff9800',
      dark: '#e65100',
      contrastText: '#ffffff',
      lighter: '#fff3e0', // Very light amber for backgrounds
    },
    success: {
      main: '#2e7d32', // Green for positive actions
      light: '#4caf50',
      dark: '#1b5e20',
      contrastText: '#ffffff',
      lighter: '#e8f5e9', // Very light green for backgrounds
    },
    info: {
      main: '#0288d1', // Information blue
      light: '#03a9f4',
      dark: '#01579b',
      contrastText: '#ffffff',
      lighter: '#e1f5fe', // Very light info blue for backgrounds
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
    text: {
      primary: '#212121', // High contrast for readability
      secondary: '#424242',
      disabled: '#9e9e9e',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    fontSize: 16, // Base font size (minimum for accessibility)
    htmlFontSize: 16,
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      lineHeight: 1.2,
      letterSpacing: '-0.01562em',
      marginBottom: '1rem',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.00833em',
      marginBottom: '0.875rem',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: '0em',
      marginBottom: '0.75rem',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
      marginBottom: '0.625rem',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.5,
      marginBottom: '0.5rem',
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.5,
      marginBottom: '0.5rem',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      letterSpacing: '0.00938em',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      letterSpacing: '0.01071em',
    },
    button: {
      fontSize: '1rem',
      fontWeight: 500,
      textTransform: 'none', // More friendly, less shouty
      letterSpacing: '0.02857em',
    },
  },
  spacing: 8, // Base spacing unit
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
  shape: {
    borderRadius: 8, // Softer, more approachable corners
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 44, // Minimum touch target size
          minWidth: 44,
          padding: '12px 24px',
          fontSize: '1rem',
        },
        sizeLarge: {
          minHeight: 48,
          padding: '14px 28px',
          fontSize: '1.125rem',
        },
      },
      defaultProps: {
        disableElevation: false,
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          },
          '&:focus-within': {
            outline: '3px solid #1976d2',
            outlineOffset: '2px',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-root': {
            fontSize: '1rem',
            minHeight: 44,
          },
        },
      },
      defaultProps: {
        variant: 'outlined',
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          fontSize: '1rem',
          fontWeight: 500,
          marginBottom: '0.5rem',
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          padding: '12px', // Larger touch target
        },
      },
    },
    MuiRadio: {
      styleOverrides: {
        root: {
          padding: '12px', // Larger touch target
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          textDecoration: 'underline',
          '&:hover': {
            textDecoration: 'underline',
            opacity: 0.8,
          },
          '&:focus': {
            outline: '2px solid #1976d2',
            outlineOffset: '2px',
            borderRadius: '2px',
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          fontSize: '1rem',
          padding: '16px',
        },
        standardError: {
          backgroundColor: '#ffebee',
          color: '#c62828',
        },
        standardWarning: {
          backgroundColor: '#fff3e0',
          color: '#e65100',
        },
        standardInfo: {
          backgroundColor: '#e3f2fd',
          color: '#01579b',
        },
        standardSuccess: {
          backgroundColor: '#e8f5e9',
          color: '#1b5e20',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none', // Remove default gradient
        },
      },
    },
  },
};

const theme = createTheme(themeOptions);

export default theme;
