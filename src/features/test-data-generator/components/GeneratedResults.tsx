import {
  Button,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import { TEST_DATA_MESSAGES } from '@/features/test-data-generator/constants';
import type { GeneratedCombination, TestField } from '@/features/test-data-generator/types';
import { formatCombinationPath } from '@/features/test-data-generator/utils/formatCombinationPath';

interface GeneratedResultsProps {
  fields: readonly TestField[];
  results: readonly GeneratedCombination[];
  onExportJson: () => void;
  onExportCsv: () => void;
}

export function GeneratedResults({
  fields,
  results,
  onExportJson,
  onExportCsv,
}: GeneratedResultsProps) {
  if (results.length === 0) {
    return (
      <Stack spacing={1}>
        <Typography variant="h6" component="h2">
          {TEST_DATA_MESSAGES.resultsTitle}
        </Typography>
        <Typography color="text.secondary">{TEST_DATA_MESSAGES.noResults}</Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
      >
        <Typography variant="h6" component="h2">
          {TEST_DATA_MESSAGES.resultsTitle} ({results.length})
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button variant="outlined" onClick={onExportCsv}>
            {TEST_DATA_MESSAGES.exportCsv}
          </Button>
          <Button variant="contained" onClick={onExportJson}>
            {TEST_DATA_MESSAGES.exportJson}
          </Button>
        </Stack>
      </Stack>
      <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 480 }}>
        <Table size="small" stickyHeader aria-label={TEST_DATA_MESSAGES.resultsTitle}>
          <TableHead>
            <TableRow>
              <TableCell>Record</TableCell>
              <TableCell>{TEST_DATA_MESSAGES.pathColumn}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {results.map((row, index) => (
              <TableRow key={`${index}-${formatCombinationPath(row, fields)}`}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{formatCombinationPath(row, fields)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}
