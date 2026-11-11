import { Box, Card, CardContent, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: number;
  icon?: ReactNode;
}

export function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <Card variant="outlined">
      <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
        {icon ? (
          <Box sx={{ color: 'primary.main', display: 'inline-flex', mb: 0.75, opacity: 0.9 }}>
            {icon}
          </Box>
        ) : null}
        <Typography color="text.secondary" variant="body2" sx={{ fontWeight: 600 }}>
          {label}
        </Typography>
        <Typography variant="h4" component="p" sx={{ fontWeight: 700, mt: 0.5, letterSpacing: '-0.03em' }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}
