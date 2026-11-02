import { Box, List, ListItem, ListItemText, Stack, Typography } from '@mui/material';

import { GENERATOR_MESSAGES } from '@/features/random-generator/constants';
import type { Team } from '@/features/random-generator/types';

interface TeamResultProps {
  teams?: Team[] | null;
  error?: string | null;
}

export function TeamResultCard({ teams, error }: TeamResultProps) {
  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        border: 1,
        borderColor: error ? 'error.main' : 'divider',
        borderRadius: 2,
        px: 2,
        py: 2,
        minHeight: 88,
      }}
    >
      {error ? (
        <Typography color="error">{error}</Typography>
      ) : teams && teams.length > 0 ? (
        <Stack spacing={2} aria-label={GENERATOR_MESSAGES.teamResultLabel}>
          {teams.map((team) => (
            <Box key={team.name}>
              <Typography variant="h6" component="h3" sx={{ fontWeight: 700 }}>
                {team.name}
              </Typography>
              <List dense disablePadding>
                {team.members.length > 0 ? (
                  team.members.map((member, index) => (
                    <ListItem key={`${member}-${index}`} disableGutters sx={{ py: 0 }}>
                      <ListItemText primary={`- ${member}`} />
                    </ListItem>
                  ))
                ) : (
                  <ListItem disableGutters sx={{ py: 0 }}>
                    <ListItemText primary={GENERATOR_MESSAGES.noTeamMembers} />
                  </ListItem>
                )}
              </List>
            </Box>
          ))}
        </Stack>
      ) : (
        <Typography color="text.secondary">{GENERATOR_MESSAGES.emptyTeamResult}</Typography>
      )}
    </Box>
  );
}
