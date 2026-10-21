import { Box, CircularProgress } from '@mui/material';

interface LoadingStateProps {
  label?: string;
}

export function LoadingState({ label = 'Loading' }: LoadingStateProps) {
  return (
    <Box
      role="status"
      aria-live="polite"
      aria-label={label}
      sx={{ display: 'flex', justifyContent: 'center', py: 8 }}
    >
      <CircularProgress />
    </Box>
  );
}
