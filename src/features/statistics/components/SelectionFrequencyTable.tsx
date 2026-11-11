import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';

import { STATISTICS_CHART_HEIGHT, STATISTICS_MESSAGES } from '@/features/statistics/constants';
import { formatPercent } from '@/features/statistics/utils/formatPercent';
import type { NamedCount } from '@/features/statistics/utils/selectStatistics';

interface SelectionFrequencyTableProps {
  rows: NamedCount[];
  ariaLabel?: string;
  nameColumnLabel?: string;
  emptyMessage?: string;
}

export function SelectionFrequencyTable({
  rows,
  ariaLabel = STATISTICS_MESSAGES.frequencyAria,
  nameColumnLabel = STATISTICS_MESSAGES.item,
  emptyMessage = STATISTICS_MESSAGES.emptyDescription,
}: SelectionFrequencyTableProps) {
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true });

  if (rows.length === 0) {
    return <Typography color="text.secondary">{emptyMessage}</Typography>;
  }

  if (compact) {
    return (
      <Box
        component="ul"
        aria-label={ariaLabel}
        sx={{ display: 'grid', m: 0, p: 0, gap: 1, listStyle: 'none' }}
      >
        {rows.map((row) => (
          <Box
            key={row.name}
            component="li"
            sx={{
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
              px: 1.5,
              py: 1.25,
            }}
          >
            <Typography sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>{row.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {STATISTICS_MESSAGES.count} {row.count} · {STATISTICS_MESSAGES.percentage}{' '}
              {formatPercent(row.percent)}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <TableContainer sx={{ maxHeight: STATISTICS_CHART_HEIGHT }}>
      <Table size="small" stickyHeader aria-label={ariaLabel}>
        <TableHead>
          <TableRow>
            <TableCell>{nameColumnLabel}</TableCell>
            <TableCell align="right">{STATISTICS_MESSAGES.count}</TableCell>
            <TableCell align="right">{STATISTICS_MESSAGES.percentage}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.name}>
              <TableCell sx={{ overflowWrap: 'anywhere' }}>{row.name}</TableCell>
              <TableCell align="right">{row.count}</TableCell>
              <TableCell align="right">{formatPercent(row.percent)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
