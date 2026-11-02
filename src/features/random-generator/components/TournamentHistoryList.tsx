import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import {
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useState } from 'react';

import { formatDateTime } from '@/features/dashboard/utils/formatDateTime';
import { HistoryConfirmDialog } from '@/features/history/components/HistoryConfirmDialog';
import { GENERATOR_MESSAGES } from '@/features/random-generator/constants';
import type { TournamentBracket } from '@/features/random-generator/types';
import {
  formatTournamentHistoryLabel,
  formatTournamentRoundFlow,
  formatTournamentSettings,
} from '@/features/random-generator/utils/formatTournamentHistory';

interface TournamentHistoryListProps {
  entries: TournamentBracket[];
  onDelete: (entryId: string) => void;
  onClear?: () => void;
}

export function TournamentHistoryList({ entries, onDelete, onClear }: TournamentHistoryListProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [clearOpen, setClearOpen] = useState(false);

  if (entries.length === 0) {
    return null;
  }

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" component="h2">
          {GENERATOR_MESSAGES.tournamentHistoryTitle}
        </Typography>
        {onClear ? (
          <Button color="error" variant="outlined" size="small" onClick={() => setClearOpen(true)}>
            {GENERATOR_MESSAGES.clearTournamentHistory}
          </Button>
        ) : null}
      </Stack>
      <Paper
        component="section"
        aria-label={GENERATOR_MESSAGES.tournamentHistoryAria}
        elevation={0}
        sx={{ border: 1, borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}
      >
        <List disablePadding>
          {entries.map((entry, index) => (
            <ListItem
              key={entry.id}
              divider={index < entries.length - 1}
              secondaryAction={
                <IconButton
                  edge="end"
                  aria-label={`${GENERATOR_MESSAGES.deleteTournamentResult}: ${formatTournamentHistoryLabel(entry)}`}
                  onClick={() => setPendingDeleteId(entry.id)}
                >
                  <DeleteOutlinedIcon />
                </IconButton>
              }
              sx={{ alignItems: 'flex-start', py: 1.5 }}
            >
              <ListItemText
                primary={
                  <Typography component="span" sx={{ fontWeight: 600 }}>
                    {formatTournamentRoundFlow(entry)}
                  </Typography>
                }
                secondary={`${formatDateTime(entry.createdAt)} · ${formatTournamentSettings(entry)}`}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
      <HistoryConfirmDialog
        open={Boolean(pendingDeleteId)}
        title={GENERATOR_MESSAGES.deleteTournamentResultTitle}
        description={GENERATOR_MESSAGES.deleteTournamentResultDescription}
        confirmLabel={GENERATOR_MESSAGES.deleteTournamentResult}
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          if (pendingDeleteId) {
            onDelete(pendingDeleteId);
          }
          setPendingDeleteId(null);
        }}
      />
      {onClear ? (
        <HistoryConfirmDialog
          open={clearOpen}
          title={GENERATOR_MESSAGES.clearTournamentHistoryTitle}
          description={GENERATOR_MESSAGES.clearTournamentHistoryDescription}
          confirmLabel={GENERATOR_MESSAGES.clearTournamentHistory}
          onCancel={() => setClearOpen(false)}
          onConfirm={() => {
            onClear();
            setClearOpen(false);
          }}
        />
      ) : null}
    </Stack>
  );
}
