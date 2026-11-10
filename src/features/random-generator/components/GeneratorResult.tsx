import { Box, Stack, Typography } from '@mui/material';

import { GENERATOR_MESSAGES } from '@/features/random-generator/constants';

interface GeneratorResultProps {
  values?: string[] | null;
  error?: string | null;
}

export function GeneratorResultCard({ values, error }: GeneratorResultProps) {
  return (
    <Box
      role={error ? 'alert' : 'status'}
      aria-live={error ? 'assertive' : 'polite'}
      aria-atomic
      sx={{
        border: 1,
        borderColor: error ? 'error.main' : 'divider',
        borderRadius: 2,
        px: 2,
        py: 2,
        minHeight: 88,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {error ? (
        <Typography color="error">{error}</Typography>
      ) : values && values.length > 0 ? (
        <Stack spacing={0.5} aria-label={GENERATOR_MESSAGES.resultLabel}>
          {values.map((value, index) => (
            <Typography key={`${value}-${index}`} variant="h5" component="p" sx={{ fontWeight: 700 }}>
              {value}
            </Typography>
          ))}
        </Stack>
      ) : (
        <Typography color="text.secondary">{GENERATOR_MESSAGES.emptyResult}</Typography>
      )}
    </Box>
  );
}
