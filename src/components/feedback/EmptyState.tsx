import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  titleComponent?: 'h1' | 'h2' | 'h3';
}

export function EmptyState({
  title,
  description,
  action,
  titleComponent = 'h1',
}: EmptyStateProps) {
  return (
    <Box sx={{ textAlign: 'center', py: { xs: 6, md: 8 } }}>
      <Typography variant="h5" component={titleComponent} gutterBottom>
        {title}
      </Typography>
      {description ? (
        <Typography color="text.secondary" sx={{ maxWidth: 520, mx: 'auto' }}>
          {description}
        </Typography>
      ) : null}
      {action ? <Box sx={{ mt: 3 }}>{action}</Box> : null}
    </Box>
  );
}
