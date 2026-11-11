import { Box, CircularProgress, Typography } from '@mui/material';

export function RouteFallback() {
  return (
    <Box
      role="status"
      aria-live="polite"
      data-testid="route-loading"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.5,
        minHeight: 240,
        py: 6,
      }}
    >
      <CircularProgress size={28} aria-hidden />
      <Typography color="text.secondary">Loading page…</Typography>
    </Box>
  );
}
