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
import type { TeamGeneratorHistoryEntry } from '@/features/random-generator/types';
import {
  formatTeamHistoryLabel,
  formatTeamLine,
  formatTeamSettings,
} from '@/features/random-generator/utils/formatTeamHistory';

interface TeamHistoryListProps {
  entries: TeamGeneratorHistoryEntry[];
  onDelete: (entryId: string) => void;
  onClear?: () => void;
}

export function TeamHistoryList({ entries, onDelete, onClear }: TeamHistoryListProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [clearOpen, setClearOpen] = useState(false);

  if (entries.length === 0) {
    return null;
  }

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" component="h2">
          {GENERATOR_MESSAGES.teamHistoryTitle}
        </Typography>
        {onClear ? (
          <Button color="error" variant="outlined" size="small" onClick={() => setClearOpen(true)}>
            {GENERATOR_MESSAGES.clearTeamHistory}
          </Button>
        ) : null}
      </Stack>
      <Paper
        component="section"
        aria-label={GENERATOR_MESSAGES.teamHistoryAria}
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
                  aria-label={`${GENERATOR_MESSAGES.deleteTeamResult}: ${formatTeamHistoryLabel(entry)}`}
                  onClick={() => setPendingDeleteId(entry.id)}
                >
                  <DeleteOutlinedIcon />
                </IconButton>
              }
              sx={{ alignItems: 'flex-start', py: 1.5 }}
            >
              <ListItemText
                primary={
                  <Stack spacing={0.25}>
                    {entry.teams.map((team) => (
                      <Typography key={team.name} component="span" sx={{ fontWeight: 600 }}>
                        {formatTeamLine(team)}
                      </Typography>
                    ))}
                  </Stack>
                }
                secondary={`${formatDateTime(entry.createdAt)} · ${formatTeamSettings(entry)}`}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
      <HistoryConfirmDialog
        open={Boolean(pendingDeleteId)}
        title={GENERATOR_MESSAGES.deleteTeamResultTitle}
        description={GENERATOR_MESSAGES.deleteTeamResultDescription}
        confirmLabel={GENERATOR_MESSAGES.deleteTeamResult}
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
          title={GENERATOR_MESSAGES.clearTeamHistoryTitle}
          description={GENERATOR_MESSAGES.clearTeamHistoryDescription}
          confirmLabel={GENERATOR_MESSAGES.clearTeamHistory}
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
