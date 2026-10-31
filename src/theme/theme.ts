import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: { main: '#1565c0', light: '#1976d2', dark: '#0d47a1' },
    secondary: { main: '#e91e63' },
    background: { default: '#f0f2f5', paper: '#ffffff' },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
          padding: '8px 20px',
        },
        sizeLarge: {
          padding: '12px 28px',
          fontSize: '1rem',
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid rgba(0,0,0,0.08)',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            fontWeight: 600,
            backgroundColor: '#fafafa',
            borderBottom: '1px solid rgba(0,0,0,0.08)',
            padding: '12px 16px',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '14px 16px',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&.MuiTableRow-hover:hover': {
            backgroundColor: 'rgba(0,0,0,0.02)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});
