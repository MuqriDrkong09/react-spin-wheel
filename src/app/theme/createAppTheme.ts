import { createTheme, type PaletteMode, type Theme } from '@mui/material/styles';

const testComponents =
  import.meta.env.MODE === 'test'
    ? {
        MuiButtonBase: {
          defaultProps: {
            disableRipple: true,
          },
        },
      }
    : {};

export function createAppTheme(mode: PaletteMode): Theme {
  const light = mode === 'light';

  return createTheme({
    palette: {
      mode,
      contrastThreshold: 4.5,
      primary: {
        main: light ? '#4338ca' : '#818cf8',
      },
      secondary: {
        main: light ? '#0f766e' : '#5eead4',
      },
      background: {
        default: light ? '#f8fafc' : '#0b1220',
        paper: light ? '#ffffff' : '#111827',
      },
      text: {
        primary: light ? '#0f172a' : '#f8fafc',
        secondary: light ? '#334155' : '#cbd5e1',
      },
      divider: light ? '#cbd5e1' : '#475569',
    },
    shape: {
      borderRadius: 12,
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 700,
        letterSpacing: '-0.03em',
      },
      h2: {
        fontWeight: 650,
        letterSpacing: '-0.02em',
      },
      button: {
        textTransform: 'none',
        fontWeight: 600,
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: {
            colorScheme: mode,
          },
          body: {
            minHeight: '100vh',
          },
          '@media (prefers-reduced-motion: reduce)': {
            '*, *::before, *::after': {
              animationDuration: '0.01ms !important',
              animationIterationCount: '1 !important',
              transitionDuration: '0.01ms !important',
              scrollBehavior: 'auto !important',
            },
          },
          'a:focus-visible, button:focus-visible, [role="button"]:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible, [tabindex]:not([tabindex="-1"]):focus-visible':
            {
              outline: `2px solid ${light ? '#4338ca' : '#818cf8'}`,
              outlineOffset: 2,
            },
        },
      },
      MuiAppBar: {
        defaultProps: {
          elevation: 0,
          color: 'inherit',
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            '&.Mui-focusVisible': {
              outline: `2px solid ${light ? '#4338ca' : '#818cf8'}`,
              outlineOffset: 2,
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            '&.Mui-focusVisible': {
              outline: `2px solid ${light ? '#4338ca' : '#818cf8'}`,
              outlineOffset: 2,
            },
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            '&.Mui-focusVisible': {
              outline: `2px solid ${light ? '#4338ca' : '#818cf8'}`,
              outlineOffset: -2,
            },
          },
        },
      },
      MuiPaper: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      ...testComponents,
    },
  });
}
