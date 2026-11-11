import { Box } from '@mui/material';

import { LoadingState } from '@/components/feedback/LoadingState';

export function RouteFallback() {
  return (
    <Box data-testid="route-loading">
      <LoadingState label="Loading page…" showLabel />
    </Box>
  );
}
