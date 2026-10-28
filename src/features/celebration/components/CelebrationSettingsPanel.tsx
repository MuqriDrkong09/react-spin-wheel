import { Box, Card, CardContent, FormControlLabel, Stack, Switch, Typography } from '@mui/material';

import { CELEBRATION_MESSAGES } from '@/features/celebration/constants';
import { useSettingsStore } from '@/stores/settingsStore';

export function CelebrationSettingsPanel() {
  const confettiEnabled = useSettingsStore((state) => state.settings.confettiEnabled);
  const updateSettings = useSettingsStore((state) => state.updateSettings);

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h6" component="h2">
              {CELEBRATION_MESSAGES.title}
            </Typography>
            <Typography color="text.secondary">{CELEBRATION_MESSAGES.description}</Typography>
          </Box>
          <FormControlLabel
            control={
              <Switch
                checked={confettiEnabled}
                onChange={(_, enabled) => updateSettings({ confettiEnabled: enabled })}
                slotProps={{ input: { 'aria-label': CELEBRATION_MESSAGES.enabled } }}
              />
            }
            label={CELEBRATION_MESSAGES.enabled}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}
