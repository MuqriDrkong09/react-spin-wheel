import { CssBaseline, ThemeProvider } from '@mui/material';
import { useMemo, type ReactNode } from 'react';

import { createAppTheme } from '@/app/theme/createAppTheme';
import { useColorMode } from '@/hooks/useColorMode';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const { colorMode } = useColorMode();
  const theme = useMemo(() => createAppTheme(colorMode), [colorMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
