import { Card, CardContent, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface StatisticsSectionCardProps {
  title: string;
  children: ReactNode;
}

export function StatisticsSectionCard({ title, children }: StatisticsSectionCardProps) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
          {title}
        </Typography>
        {children}
      </CardContent>
    </Card>
  );
}
