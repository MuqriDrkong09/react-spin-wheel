import { Card, CardContent, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface StatisticsMetricCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
}

export function StatisticsMetricCard({ label, value, hint, icon }: StatisticsMetricCardProps) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        {icon}
        <Typography color="text.secondary" variant="body2">
          {label}
        </Typography>
        <Typography
          variant={typeof value === 'number' ? 'h4' : 'h6'}
          component="p"
          sx={{ fontWeight: 700, wordBreak: 'break-word' }}
        >
          {value}
        </Typography>
        {hint ? (
          <Typography color="text.secondary" variant="caption" sx={{ display: 'block' }}>
            {hint}
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  );
}
