import { ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';

import {
  STATISTICS_DATE_RANGE_OPTIONS,
  STATISTICS_MESSAGES,
  type StatisticsDateRange,
} from '@/features/statistics/constants';

interface StatisticsDateFilterProps {
  value: StatisticsDateRange;
  onChange: (range: StatisticsDateRange) => void;
}

export function StatisticsDateFilter({ value, onChange }: StatisticsDateFilterProps) {
  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      color="primary"
      value={value}
      onChange={(_event, next: StatisticsDateRange | null) => {
        if (next) {
          onChange(next);
        }
      }}
      aria-label={STATISTICS_MESSAGES.dateRange}
      sx={{
        flexWrap: 'wrap',
        gap: 0.5,
        '& .MuiToggleButton-root': {
          px: 1.5,
          textTransform: 'none',
          borderRadius: '8px !important',
          border: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      {STATISTICS_DATE_RANGE_OPTIONS.map((option) => (
        <ToggleButton key={option.value} value={option.value}>
          <Typography variant="body2" component="span" sx={{ fontWeight: 600 }}>
            {option.label}
          </Typography>
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
