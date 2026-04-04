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
          borderRadius: 10,
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
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
          },
        },
      },
    },
  },
};

export const darkTheme = createTheme({
  ...shared,
  palette: {
    mode: 'dark',
    primary: { main: '#3b82f6' },
    background: { default: '#09090b', paper: '#18181b' },
    text: { primary: '#fafafa', secondary: '#a1a1aa', disabled: '#52525b' },
    divider: '#27272a',
    success: { main: '#22c55e' },
    error: { main: '#ef4444' },
  },
  components: {
    ...shared.components,
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#09090b',
          transition: 'background-color 0.3s ease, color 0.3s ease',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #27272a',
          backgroundImage: 'none',
          borderRadius: 16,
        },
      },
    },
  },
});

export const lightTheme = createTheme({
  ...shared,
  palette: {
    mode: 'light',
    primary: { main: '#2563eb' },
    background: { default: '#fafafa', paper: '#ffffff' },
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
          backgroundColor: '#fafafa',
          transition: 'background-color 0.3s ease, color 0.3s ease',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #e4e4e7',
          backgroundImage: 'none',
          borderRadius: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        },
      },
    },
  },
});
