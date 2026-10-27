import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import {
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

import { formatDateTime } from '@/features/dashboard/utils/formatDateTime';
import { HISTORY_MESSAGES, HISTORY_MODE_LABELS } from '@/features/history/constants';
import { formatDuration } from '@/features/history/utils/formatDuration';
import type { HistoryResult } from '@/features/history/utils/selectHistory';

interface HistoryListProps {
  results: HistoryResult[];
  onView: (result: HistoryResult) => void;
  onDelete: (result: HistoryResult) => void;
}

export function HistoryList({ results, onView, onDelete }: HistoryListProps) {
  return (
    <Paper
      component="section"
      aria-label={HISTORY_MESSAGES.resultsAria}
      elevation={0}
      sx={{ border: 1, borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}
    >
      <List disablePadding>
        {results.map((result, index) => (
          <ListItem
            key={result.id}
            divider={index < results.length - 1}
            disablePadding
            secondaryAction={
              <Stack direction="row" spacing={0.5}>
                <IconButton
                  edge="end"
                  aria-label={`${HISTORY_MESSAGES.viewDetails}: ${result.pathLabel}`}
                  onClick={() => onView(result)}
                >
                  <VisibilityOutlinedIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  aria-label={`${HISTORY_MESSAGES.deleteResult}: ${result.pathLabel}`}
                  onClick={() => onDelete(result)}
                >
                  <DeleteOutlinedIcon />
                </IconButton>
              </Stack>
            }
          >
            <ListItemButton onClick={() => onView(result)} sx={{ pr: 12 }}>
              <ListItemText
                primary={result.pathLabel}
                secondary={
                  <Typography component="span" variant="body2" color="text.secondary">
                    {result.wheelName} · {formatDateTime(result.timestamp)} ·{' '}
                    {HISTORY_MODE_LABELS[result.mode]} · {formatDuration(result.duration)}
                  </Typography>
                }
                slotProps={{
                  primary: { sx: { fontWeight: 600 } },
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}
