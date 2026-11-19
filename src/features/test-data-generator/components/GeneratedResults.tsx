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
import type { GeneratedCombination } from '@/features/test-data-generator/types';

interface GeneratedResultsProps {
  results: readonly GeneratedCombination[];
  onExport: () => void;
}

export function GeneratedResults({ results, onExport }: GeneratedResultsProps) {
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

  const columns = Array.from(
    results.reduce((keys, row) => {
      for (const key of Object.keys(row)) {
        keys.add(key);
      }
      return keys;
    }, new Set<string>()),
  ).sort((left, right) => left.localeCompare(right));

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
        <Button variant="contained" onClick={onExport}>
          {TEST_DATA_MESSAGES.exportResults}
        </Button>
      </Stack>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small" aria-label={TEST_DATA_MESSAGES.resultsTitle}>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              {columns.map((column) => (
                <TableCell key={column}>{column}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {results.map((row, index) => (
              <TableRow key={`${index}-${JSON.stringify(row)}`}>
                <TableCell>{index + 1}</TableCell>
                {columns.map((column) => (
                  <TableCell key={column}>{row[column] ?? '—'}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}
