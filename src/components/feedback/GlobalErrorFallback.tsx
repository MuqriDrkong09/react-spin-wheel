import { Box, Button, CssBaseline, Stack, ThemeProvider, Typography } from '@mui/material';
import { useMemo } from 'react';

import { createAppTheme } from '@/app/theme/createAppTheme';
import { APP_ERROR_MESSAGES } from '@/constants/errorMessages';
import { isProductionUi, toUserErrorMessage } from '@/utils/toUserErrorMessage';

interface GlobalErrorFallbackProps {
  error?: unknown;
  title?: string;
  description?: string;
  onReset?: () => void;
  onGoHome?: () => void;
  resetLabel?: string;
  homeLabel?: string;
}

export function GlobalErrorFallback({
  error,
  title = APP_ERROR_MESSAGES.crashTitle,
  description = APP_ERROR_MESSAGES.crashDescription,
  onReset,
  onGoHome,
  resetLabel = APP_ERROR_MESSAGES.crashTryAgain,
  homeLabel = APP_ERROR_MESSAGES.crashGoHome,
}: GlobalErrorFallbackProps) {
  const theme = useMemo(() => createAppTheme('light'), []);
  const detail = !isProductionUi() && error ? toUserErrorMessage(error) : null;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        role="alert"
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
          bgcolor: 'background.default',
        }}
      >
        <Box sx={{ maxWidth: 480, textAlign: 'center' }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1.5 }}>
            {title}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: detail ? 1.5 : 3 }}>
            {description}
          </Typography>
          {detail ? (
            <Typography
              component="pre"
              variant="body2"
              sx={{
                mb: 3,
                p: 1.5,
                borderRadius: 2,
                bgcolor: 'action.hover',
                textAlign: 'left',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              }}
            >
              {detail}
            </Typography>
          ) : null}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'center' }}>
            {onReset ? (
              <Button variant="contained" onClick={onReset}>
                {resetLabel}
              </Button>
            ) : null}
            {onGoHome ? (
              <Button variant="outlined" onClick={onGoHome}>
                {homeLabel}
              </Button>
            ) : null}
          </Stack>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
