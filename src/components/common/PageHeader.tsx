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
        pb: 0.5,
      }}
    >
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: description ? 1 : 0 }}>
          {title}
        </Typography>
        {description ? (
          <Typography color="text.secondary" sx={{ maxWidth: 640, lineHeight: 1.6 }}>
            {description}
          </Typography>
        ) : null}
      </Box>
      {action ? (
        <Box
          sx={{
            flexShrink: 0,
            width: { xs: '100%', [actionsBesideFrom]: 'auto' },
            '& .MuiStack-root': { width: { xs: '100%', [actionsBesideFrom]: 'auto' } },
            '& .MuiButton-root': { width: { xs: '100%', sm: 'auto' } },
          }}
        >
          {action}
        </Box>
      ) : null}
    </Stack>
  );
}
