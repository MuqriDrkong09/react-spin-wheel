import { Card, CardContent, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface DashboardSectionCardProps {
  title: string;
  children: ReactNode;
}

export function DashboardSectionCard({ title, children }: DashboardSectionCardProps) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Typography
          variant="subtitle1"
          component="h2"
          sx={{ mb: 1.5, fontWeight: 650, letterSpacing: '-0.01em' }}
        >
          {title}
        </Typography>
        {children}
      </CardContent>
    </Card>
  );
}
