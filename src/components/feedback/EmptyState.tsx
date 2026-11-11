import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  titleComponent?: 'h1' | 'h2' | 'h3';
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  titleComponent = 'h1',
}: EmptyStateProps) {
  return (
    <Box
      sx={{
        textAlign: 'center',
        py: { xs: 6, md: 8 },
        px: { xs: 2, sm: 3 },
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        bgcolor: 'background.paper',
      }}
    >
      {icon ? (
        <Box
          aria-hidden
          sx={{
            mb: 2,
            mx: 'auto',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 56,
            height: 56,
            borderRadius: '50%',
            bgcolor: 'action.hover',
            color: 'primary.main',
            '& .MuiSvgIcon-root': { fontSize: 28 },
          }}
        >
          {icon}
        </Box>
      ) : null}
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
