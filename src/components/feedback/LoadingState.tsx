import { Box, CircularProgress, Skeleton, Stack, Typography } from '@mui/material';

interface LoadingStateProps {
  label?: string;
  /** Show a short visible caption under the spinner. */
  showLabel?: boolean;
}

export function LoadingState({ label = 'Loading', showLabel = false }: LoadingStateProps) {
  return (
    <Box
      role="status"
      aria-live="polite"
      aria-label={label}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.5,
        py: 8,
      }}
    >
      <CircularProgress size={28} />
      {showLabel ? (
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      ) : null}
    </Box>
  );
}

interface PageLoadingSkeletonProps {
  label?: string;
  cards?: number;
}

/** Page-level skeleton for list/dashboard surfaces. */
export function PageLoadingSkeleton({ label = 'Loading', cards = 3 }: PageLoadingSkeletonProps) {
  return (
    <Box role="status" aria-live="polite" aria-label={label}>
      <Stack spacing={2}>
        <Skeleton variant="text" width="40%" height={40} />
        <Skeleton variant="text" width="60%" height={24} />
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: {
              xs: '1fr',
              sm: '1fr 1fr',
              md: `repeat(${Math.min(cards, 3)}, minmax(0, 1fr))`,
            },
            pt: 1,
          }}
        >
          {Array.from({ length: cards }, (_, index) => (
            <Skeleton key={index} variant="rounded" height={160} />
          ))}
        </Box>
      </Stack>
    </Box>
  );
}
