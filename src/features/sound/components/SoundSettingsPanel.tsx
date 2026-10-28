import {
  Box,
  Button,
  Card,
  CardContent,
  FormControlLabel,
  Slider,
  Stack,
  Switch,
  Typography,
} from '@mui/material';

import { SOUND_MESSAGES, SOUND_VOLUME_MAX, SOUND_VOLUME_MIN } from '@/constants/sound';
import { useSound } from '@/features/sound/useSound';
import { useSettingsStore } from '@/stores/settingsStore';

export function SoundSettingsPanel() {
  const settings = useSettingsStore((state) => state.settings);
  const updateSettings = useSettingsStore((state) => state.updateSettings);
  const { preview, unlock } = useSound();
  const controlsDisabled = !settings.soundEnabled;

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h6" component="h2">
              {SOUND_MESSAGES.title}
            </Typography>
            <Typography color="text.secondary">{SOUND_MESSAGES.description}</Typography>
          </Box>
          <FormControlLabel
            control={
              <Switch
                checked={settings.soundEnabled}
                onChange={(_, enabled) => {
                  void unlock();
                  updateSettings({ soundEnabled: enabled });
                }}
                slotProps={{ input: { 'aria-label': SOUND_MESSAGES.enabled } }}
              />
            }
            label={SOUND_MESSAGES.enabled}
          />
          <Box>
            <Typography id="master-volume-label" gutterBottom>
              {SOUND_MESSAGES.masterVolume}
            </Typography>
            <Slider
              aria-labelledby="master-volume-label"
              min={0}
              max={100}
              value={Math.round((settings.masterVolume / SOUND_VOLUME_MAX) * 100)}
              disabled={controlsDisabled}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value}%`}
              onChange={(_, value) => {
                const next = Array.isArray(value) ? (value[0] ?? 0) : value;
                updateSettings({
                  masterVolume: SOUND_VOLUME_MIN + (next / 100) * (SOUND_VOLUME_MAX - SOUND_VOLUME_MIN),
                });
              }}
            />
          </Box>
          <FormControlLabel
            disabled={controlsDisabled}
            control={
              <Switch
                checked={settings.spinSound}
                onChange={(_, enabled) => updateSettings({ spinSound: enabled })}
                slotProps={{ input: { 'aria-label': SOUND_MESSAGES.spinSound } }}
              />
            }
            label={SOUND_MESSAGES.spinSound}
          />
          <FormControlLabel
            disabled={controlsDisabled}
            control={
              <Switch
                checked={settings.tickSound}
                onChange={(_, enabled) => updateSettings({ tickSound: enabled })}
                slotProps={{ input: { 'aria-label': SOUND_MESSAGES.tickSound } }}
              />
            }
            label={SOUND_MESSAGES.tickSound}
          />
          <FormControlLabel
            disabled={controlsDisabled}
            control={
              <Switch
                checked={settings.winnerSound}
                onChange={(_, enabled) => updateSettings({ winnerSound: enabled })}
                slotProps={{ input: { 'aria-label': SOUND_MESSAGES.winnerSound } }}
              />
            }
            label={SOUND_MESSAGES.winnerSound}
          />
          <Box>
            <Button
              variant="outlined"
              disabled={controlsDisabled}
              onClick={() => {
                void unlock();
                preview();
              }}
            >
              {SOUND_MESSAGES.preview}
            </Button>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
