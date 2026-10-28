import { CssBaseline, ThemeProvider } from '@mui/material';
import { useMemo, type ReactNode } from 'react';

import { createAppTheme } from '@/app/theme/createAppTheme';
import { SoundProvider } from '@/features/sound/SoundProvider';
import { useColorMode } from '@/hooks/useColorMode';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const { resolvedMode } = useColorMode();
  const theme = useMemo(() => createAppTheme(resolvedMode), [resolvedMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SoundProvider>{children}</SoundProvider>
    </ThemeProvider>
  );
}
