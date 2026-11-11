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

const FONT_FAMILY =
  '"Plus Jakarta Sans", "Segoe UI", "Helvetica Neue", Arial, sans-serif';

export function createAppTheme(mode: PaletteMode): Theme {
  const light = mode === 'light';
  const primaryMain = light ? '#0f766e' : '#2dd4bf';
  const focusRing = `2px solid ${primaryMain}`;

  return createTheme({
    palette: {
      mode,
      contrastThreshold: 4.5,
      primary: {
        main: primaryMain,
        dark: light ? '#0d5f59' : '#14b8a6',
        light: light ? '#14b8a6' : '#5eead4',
        contrastText: light ? '#f8fafc' : '#042f2e',
      },
      secondary: {
        main: light ? '#334155' : '#94a3b8',
      },
      background: {
        default: light ? '#f4f7f7' : '#0a1214',
        paper: light ? '#ffffff' : '#111a1c',
      },
      text: {
        primary: light ? '#0f172a' : '#f1f5f9',
        secondary: light ? '#475569' : '#94a3b8',
      },
      divider: light ? '#d7e0e0' : '#1f2d30',
      success: {
        main: light ? '#15803d' : '#4ade80',
      },
      warning: {
        main: light ? '#b45309' : '#fbbf24',
      },
      error: {
        main: light ? '#b91c1c' : '#f87171',
      },
    },
    shape: {
      borderRadius: 10,
    },
    spacing: 8,
    typography: {
      fontFamily: FONT_FAMILY,
      h1: {
        fontWeight: 700,
        letterSpacing: '-0.03em',
        lineHeight: 1.15,
      },
      h2: {
        fontWeight: 700,
        letterSpacing: '-0.025em',
        lineHeight: 1.2,
      },
      h3: {
        fontWeight: 650,
        letterSpacing: '-0.02em',
        lineHeight: 1.25,
      },
      h4: {
        fontWeight: 650,
        letterSpacing: '-0.02em',
        lineHeight: 1.3,
      },
      h5: {
        fontWeight: 600,
        letterSpacing: '-0.015em',
        lineHeight: 1.35,
      },
      h6: {
        fontWeight: 600,
        letterSpacing: '-0.01em',
        lineHeight: 1.4,
      },
      subtitle1: {
        fontWeight: 600,
        letterSpacing: '-0.01em',
      },
      subtitle2: {
        fontWeight: 600,
      },
      body1: {
        lineHeight: 1.6,
      },
      body2: {
        lineHeight: 1.55,
      },
      button: {
        textTransform: 'none',
        fontWeight: 600,
        letterSpacing: '-0.01em',
      },
      overline: {
        fontWeight: 600,
        letterSpacing: '0.06em',
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
            backgroundImage: light
              ? 'radial-gradient(ellipse 80% 50% at 0% -10%, rgba(15, 118, 110, 0.06), transparent 55%)'
              : 'radial-gradient(ellipse 70% 45% at 0% -10%, rgba(45, 212, 191, 0.08), transparent 55%)',
            backgroundAttachment: 'fixed',
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
              outline: focusRing,
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
            borderRadius: 8,
            '&.Mui-focusVisible': {
              outline: focusRing,
              outlineOffset: 2,
            },
          },
          sizeSmall: {
            minHeight: 36,
          },
          sizeMedium: {
            minHeight: 40,
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            '&.Mui-focusVisible': {
              outline: focusRing,
              outlineOffset: 2,
            },
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            '&.Mui-focusVisible': {
              outline: focusRing,
              outlineOffset: -2,
            },
            '&.Mui-selected': {
              backgroundColor: light ? 'rgba(15, 118, 110, 0.1)' : 'rgba(45, 212, 191, 0.12)',
              '&:hover': {
                backgroundColor: light ? 'rgba(15, 118, 110, 0.14)' : 'rgba(45, 212, 191, 0.16)',
              },
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 600,
          },
          sizeSmall: {
            height: 24,
          },
        },
      },
      MuiCard: {
        defaultProps: {
          variant: 'outlined',
          elevation: 0,
        },
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiDialog: {
        defaultProps: {
          transitionDuration: 0,
        },
        styleOverrides: {
          paper: {
            backgroundImage: 'none',
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            fontWeight: 650,
            letterSpacing: '-0.015em',
          },
        },
      },
      MuiDialogActions: {
        styleOverrides: {
          root: {
            padding: '16px 24px 24px',
          },
        },
      },
      MuiSnackbar: {
        defaultProps: {
          anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
        },
      },
      MuiAlert: {
        styleOverrides: {
          filled: {
            fontWeight: 600,
          },
          standard: {
            border: '1px solid',
            borderColor: 'divider',
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
          outlined: {
            borderColor: light ? '#d7e0e0' : '#1f2d30',
          },
        },
      },
      MuiTooltip: {
        defaultProps: {
          arrow: true,
        },
      },
      MuiSkeleton: {
        defaultProps: {
          animation: 'wave',
        },
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
      ...testComponents,
    },
  });
}
