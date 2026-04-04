import { createTheme } from '@mui/material/styles';

const shared = {
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    h3: { fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 600, letterSpacing: '-0.01em' },
    h6: { fontWeight: 600, letterSpacing: '-0.01em' },
    body2: { letterSpacing: '0.01em' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
          transition: 'all 0.2s ease',
        },
        sizeLarge: {
          fontSize: '0.95rem',
          padding: '12px 24px',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'medium' },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
  },
};

export const darkTheme = createTheme({
  ...shared,
  palette: {
    mode: 'dark',
    primary: { main: '#667eea' },
    secondary: { main: '#764ba2' },
    background: { default: '#121212', paper: '#1e1e1e' },
    text: { primary: '#f4f4f5', secondary: '#a1a1aa', disabled: '#71717a' },
    divider: '#2e2e33',
    success: { main: '#22c55e' },
    error: { main: '#ef4444' },
  },
  components: {
    ...shared.components,
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#121212',
          transition: 'background-color 0.3s ease, color 0.3s ease',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #2e2e33',
          backgroundImage: 'none',
          borderRadius: 12,
        },
      },
    },
  },
});

export const lightTheme = createTheme({
  ...shared,
  palette: {
    mode: 'light',
    primary: { main: '#667eea' },
    secondary: { main: '#764ba2' },
    background: { default: '#f8fafc', paper: '#ffffff' },
    text: { primary: '#09090b', secondary: '#71717a', disabled: '#a1a1aa' },
    divider: '#e4e4e7',
    success: { main: '#16a34a' },
    error: { main: '#dc2626' },
  },
  components: {
    ...shared.components,
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#f8fafc',
          transition: 'background-color 0.3s ease, color 0.3s ease',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #e4e4e7',
          backgroundImage: 'none',
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});
