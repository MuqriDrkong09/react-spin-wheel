import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import { STATISTICS_CHART_HEIGHT, STATISTICS_MESSAGES } from '@/features/statistics/constants';
import { formatPercent } from '@/features/statistics/utils/formatPercent';
import type { NamedCount } from '@/features/statistics/utils/selectStatistics';

interface SelectionFrequencyTableProps {
  rows: NamedCount[];
}

export function SelectionFrequencyTable({ rows }: SelectionFrequencyTableProps) {
  if (rows.length === 0) {
    return (
      <Typography color="text.secondary">{STATISTICS_MESSAGES.emptyDescription}</Typography>
    );
  }

  return (
    <TableContainer sx={{ maxHeight: STATISTICS_CHART_HEIGHT }}>
      <Table size="small" stickyHeader aria-label={STATISTICS_MESSAGES.frequencyAria}>
        <TableHead>
          <TableRow>
            <TableCell>{STATISTICS_MESSAGES.item}</TableCell>
            <TableCell align="right">{STATISTICS_MESSAGES.count}</TableCell>
            <TableCell align="right">{STATISTICS_MESSAGES.percentage}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.name}>
              <TableCell>{row.name}</TableCell>
              <TableCell align="right">{row.count}</TableCell>
              <TableCell align="right">{formatPercent(row.percent)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
