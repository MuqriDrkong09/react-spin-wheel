import { Card, CardContent, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: number;
  icon?: ReactNode;
}

export function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <Card variant="outlined">
      <CardContent>
        {icon}
        <Typography color="text.secondary" variant="body2">
          {label}
        </Typography>
        <Typography variant="h4" component="p" sx={{ fontWeight: 700 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}
