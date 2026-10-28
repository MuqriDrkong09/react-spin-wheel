import { Box, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  actionsBesideFrom?: 'sm' | 'md';
}

export function PageHeader({
  title,
  description,
  action,
  actionsBesideFrom = 'sm',
}: PageHeaderProps) {
  return (
    <Stack
      direction={{ xs: 'column', [actionsBesideFrom]: 'row' }}
      spacing={2}
      sx={{
        alignItems: { [actionsBesideFrom]: 'flex-start' },
        justifyContent: 'space-between',
      }}
    >
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          {title}
        </Typography>
        {description ? (
          <Typography color="text.secondary" sx={{ maxWidth: 640 }}>
            {description}
          </Typography>
        ) : null}
      </Box>
      {action}
    </Stack>
  );
}
