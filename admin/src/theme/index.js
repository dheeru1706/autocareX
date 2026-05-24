import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0F2D52',
      light: '#1A4580',
      dark: '#071A32',
      contrastText: '#fff',
    },
    secondary: {
      main: '#E8500A',
      light: '#FF6B2B',
      dark: '#B53D07',
      contrastText: '#fff',
    },
    background: {
      default: '#F5F7FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1C1C1E',
      secondary: '#6C7280',
    },
    success: { main: '#15803D' },
    error: { main: '#DC2626' },
    warning: { main: '#D97706' },
    info: { main: '#0369A1' },
    divider: '#E5E7EB',
  },
  typography: {
    fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    button: { fontWeight: 600, textTransform: 'none' },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 2px 12px rgba(15,45,82,0.08)',
          border: '1px solid #E5E7EB',
          borderRadius: 12,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 20px',
          fontWeight: 600,
          textTransform: 'none',
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #0F2D52 0%, #1A4580 100%)',
          color: '#fff',
          '&:hover': {
            background: 'linear-gradient(135deg, #1A4580 0%, #0F2D52 100%)',
            boxShadow: '0 4px 16px rgba(15,45,82,0.25)',
          },
        },
        containedSecondary: {
          background: '#E8500A',
          color: '#fff',
          '&:hover': {
            background: '#c94108',
            boxShadow: '0 4px 16px rgba(232,80,10,0.25)',
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#FFFFFF',
            borderRadius: 8,
            '& fieldset': { borderColor: '#E5E7EB' },
            '&:hover fieldset': { borderColor: '#0F2D52' },
            '&.Mui-focused fieldset': { borderColor: '#0F2D52', borderWidth: 2 },
          },
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: '1px solid #E5E7EB',
          backgroundColor: '#FFFFFF',
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: '#F5F7FA',
            borderBottom: '1px solid #E5E7EB',
            fontWeight: 600,
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: 'rgba(15,45,82,0.03)',
          },
          '& .MuiDataGrid-cell': {
            borderColor: '#E5E7EB',
          },
          '& .MuiDataGrid-footerContainer': {
            borderTop: '1px solid #E5E7EB',
            backgroundColor: '#F5F7FA',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 600 },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          textTransform: 'none',
          '&.Mui-selected': { color: '#0F2D52' },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { backgroundColor: '#E8500A' },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#0F2D52',
          backgroundImage: 'none',
          boxShadow: '0 2px 8px rgba(15,45,82,0.15)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#0F2D52',
          borderRight: 'none',
          color: '#fff',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: '#F5F7FA',
            fontWeight: 600,
            color: '#1C1C1E',
            borderBottom: '1px solid #E5E7EB',
          },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          '&.Mui-checked': { color: '#0F2D52' },
          '&.Mui-checked + .MuiSwitch-track': { backgroundColor: '#0F2D52' },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&.Mui-selected': {
            backgroundColor: 'rgba(232,80,10,0.12)',
            '&:hover': { backgroundColor: 'rgba(232,80,10,0.18)' },
          },
        },
      },
    },
  },
});

export default theme;
