import { createTheme } from '@mui/material/styles';

const shared = {
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    h3: { fontWeight: 700 },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600 },
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
  },
};

export const darkTheme = createTheme({
  ...shared,
  palette: {
    mode: 'dark',
    primary: { main: '#3b82f6' },
    background: { default: '#0a0a0a', paper: '#141414' },
    text: { primary: '#f5f5f5', secondary: '#a0a0a0', disabled: '#666666' },
    divider: '#262626',
  },
  components: {
    ...shared.components,
    MuiCssBaseline: {
      styleOverrides: { body: { backgroundColor: '#0a0a0a' } },
    },
    MuiCard: {
      styleOverrides: {
        root: { border: '1px solid #262626', backgroundImage: 'none' },
      },
    },
  },
});

export const lightTheme = createTheme({
  ...shared,
  palette: {
    mode: 'light',
    primary: { main: '#2563eb' },
    background: { default: '#f8fafc', paper: '#ffffff' },
    text: { primary: '#1e293b', secondary: '#64748b', disabled: '#94a3b8' },
    divider: '#e2e8f0',
  },
  components: {
    ...shared.components,
    MuiCssBaseline: {
      styleOverrides: { body: { backgroundColor: '#f8fafc' } },
    },
    MuiCard: {
      styleOverrides: {
        root: { border: '1px solid #e2e8f0', backgroundImage: 'none' },
      },
    },
  },
});
