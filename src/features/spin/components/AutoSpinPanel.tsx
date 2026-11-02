import {
  Alert,
  Button,
  Card,
  CardContent,
  FormControlLabel,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';

import {
  AUTO_SPIN_LIMITS,
  AUTO_SPIN_STATUS,
  SPIN_MESSAGES,
  type AutoSpinStatus,
} from '@/features/spin/constants';
import { isAutoSpinActive, type AutoSpinEntry } from '@/features/spin/utils/autoSpin';

interface AutoSpinPanelProps {
  countInput: string;
  delayInput: string;
  saveResults: boolean;
  removeWinners: boolean;
  status: AutoSpinStatus;
  error: string | null;
  results: readonly AutoSpinEntry[];
  total: number;
  currentIndex: number;
  progressPercent: number;
  busy?: boolean;
  reducedMotion?: boolean;
  onCountChange: (value: string) => void;
  onDelayChange: (value: string) => void;
  onSaveResultsChange: (value: boolean) => void;
  onRemoveWinnersChange: (value: boolean) => void;
  onStart: () => void;
  onStop: () => void;
}

export function AutoSpinPanel({
  countInput,
  delayInput,
  saveResults,
  removeWinners,
  status,
  error,
  results,
  total,
  currentIndex,
  progressPercent,
  busy = false,
  reducedMotion = false,
  onCountChange,
  onDelayChange,
  onSaveResultsChange,
  onRemoveWinnersChange,
  onStart,
  onStop,
}: AutoSpinPanelProps) {
  const locked = isAutoSpinActive(status);
  const showProgress = locked || results.length > 0 || status === AUTO_SPIN_STATUS.completed;
  const statusLabel =
    status === AUTO_SPIN_STATUS.completed
      ? SPIN_MESSAGES.autoSpinComplete
      : status === AUTO_SPIN_STATUS.stopped
        ? SPIN_MESSAGES.autoSpinStopped
        : status === AUTO_SPIN_STATUS.error || total <= 0
          ? null
          : SPIN_MESSAGES.autoSpinProgress(currentIndex, total);

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2.5}>
          <Typography variant="h6" component="h3">
            {SPIN_MESSAGES.autoSpinTitle}
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label={SPIN_MESSAGES.autoSpinCount}
              type="number"
              value={countInput}
              disabled={locked}
              onChange={(event) => onCountChange(event.target.value)}
              sx={{ maxWidth: { sm: 220 } }}
              slotProps={{
                htmlInput: {
                  min: AUTO_SPIN_LIMITS.minCount,
                  max: AUTO_SPIN_LIMITS.maxCount,
                  step: 1,
                  'aria-label': SPIN_MESSAGES.autoSpinCount,
                },
              }}
            />
            <TextField
              label={SPIN_MESSAGES.autoSpinDelay}
              type="number"
              value={delayInput}
              disabled={locked}
              helperText={SPIN_MESSAGES.autoSpinDelayHint}
              onChange={(event) => onDelayChange(event.target.value)}
              sx={{ maxWidth: { sm: 260 } }}
              slotProps={{
                htmlInput: {
                  min: AUTO_SPIN_LIMITS.minDelayMs,
                  max: AUTO_SPIN_LIMITS.maxDelayMs,
                  step: 1,
                  'aria-label': SPIN_MESSAGES.autoSpinDelay,
                },
              }}
            />
          </Stack>
          <Stack spacing={0.5}>
            <FormControlLabel
              sx={{ mx: 0 }}
              control={
                <Switch
                  checked={removeWinners}
                  disabled={locked}
                  onChange={(_, checked) => onRemoveWinnersChange(checked)}
                  slotProps={{ input: { 'aria-label': SPIN_MESSAGES.autoSpinRemoveWinners } }}
                />
              }
              label={SPIN_MESSAGES.autoSpinRemoveWinners}
            />
            <FormControlLabel
              sx={{ mx: 0 }}
              control={
                <Switch
                  checked={saveResults}
                  disabled={locked}
                  onChange={(_, checked) => onSaveResultsChange(checked)}
                  slotProps={{ input: { 'aria-label': SPIN_MESSAGES.autoSpinSaveResults } }}
                />
              }
              label={SPIN_MESSAGES.autoSpinSaveResults}
            />
          </Stack>
          {locked ? (
            <Button
              type="button"
              variant="outlined"
              color="inherit"
              onClick={onStop}
              disabled={status === AUTO_SPIN_STATUS.stopping}
            >
              {status === AUTO_SPIN_STATUS.stopping
                ? SPIN_MESSAGES.autoSpinStopping
                : SPIN_MESSAGES.autoSpinStop}
            </Button>
          ) : (
            <Button type="button" variant="contained" onClick={onStart} disabled={busy}>
              {SPIN_MESSAGES.autoSpinStart}
            </Button>
          )}
          {showProgress ? (
            <Stack spacing={1.5} aria-live="polite">
              {statusLabel ? (
                <Typography variant="body2" color="text.secondary">
                  {statusLabel}
                </Typography>
              ) : null}
              <LinearProgress
                variant="determinate"
                value={progressPercent}
                aria-label={SPIN_MESSAGES.autoSpinTitle}
                sx={
                  reducedMotion
                    ? { '& .MuiLinearProgress-bar': { transition: 'none' } }
                    : undefined
                }
              />
              {results.length > 0 ? (
                <List dense disablePadding>
                  {results.map((entry) => (
                    <ListItem key={entry.sessionId} disableGutters>
                      <ListItemText primary={SPIN_MESSAGES.autoSpinResult(entry.index, entry.labels)} />
                    </ListItem>
                  ))}
                </List>
              ) : null}
            </Stack>
          ) : null}
          {error ? (
            <Alert severity="error" variant="outlined">
              {error}
            </Alert>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}
