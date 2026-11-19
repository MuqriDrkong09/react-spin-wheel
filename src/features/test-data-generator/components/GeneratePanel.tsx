import {
  Alert,
  Button,
  FormControlLabel,
  LinearProgress,
  Stack,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';

import {
  TEST_DATA_MESSAGES,
  TEST_DATA_RECORD_COUNTS,
  type TestDataRecordCount,
} from '@/features/test-data-generator/constants';

export interface GenerationProgress {
  completed: number;
  total: number;
}

interface GeneratePanelProps {
  error: string | null;
  infoMessage: string | null;
  count: TestDataRecordCount;
  unique: boolean;
  generating: boolean;
  progress: GenerationProgress | null;
  onCountChange: (count: TestDataRecordCount) => void;
  onUniqueChange: (unique: boolean) => void;
  onGenerate: () => void;
  onCancel: () => void;
}

export function GeneratePanel({
  error,
  infoMessage,
  count,
  unique,
  generating,
  progress,
  onCountChange,
  onUniqueChange,
  onGenerate,
  onCancel,
}: GeneratePanelProps) {
  const progressValue =
    progress && progress.total > 0 ? Math.min(100, (progress.completed / progress.total) * 100) : 0;

  return (
    <Stack spacing={2}>
      <Typography variant="h6" component="h2">
        {TEST_DATA_MESSAGES.generateTitle}
      </Typography>
      <Typography color="text.secondary">{TEST_DATA_MESSAGES.generateHint}</Typography>
      {error ? (
        <Alert severity="error" role="alert">
          {error}
        </Alert>
      ) : null}
      {infoMessage ? (
        <Alert severity="info" role="status">
          {infoMessage}
        </Alert>
      ) : null}

      <Stack spacing={1}>
        <Typography variant="subtitle2" component="h3">
          {TEST_DATA_MESSAGES.resultCount}
        </Typography>
        <ToggleButtonGroup
          exclusive
          color="primary"
          size="small"
          value={count}
          disabled={generating}
          onChange={(_, value: TestDataRecordCount | null) => {
            if (value !== null) {
              onCountChange(value);
            }
          }}
          aria-label={TEST_DATA_MESSAGES.resultCount}
          sx={{ flexWrap: 'wrap' }}
        >
          {TEST_DATA_RECORD_COUNTS.map((option) => (
            <ToggleButton key={option} value={option} aria-label={`${option} records`}>
              {option}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>

      <FormControlLabel
        control={
          <Switch
            checked={unique}
            disabled={generating}
            onChange={(_, checked) => onUniqueChange(checked)}
            slotProps={{ input: { 'aria-label': TEST_DATA_MESSAGES.uniqueResults } }}
          />
        }
        label={unique ? TEST_DATA_MESSAGES.uniqueResults : TEST_DATA_MESSAGES.allowDuplicates}
      />

      {generating && progress ? (
        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            {TEST_DATA_MESSAGES.progressLabel(progress.completed, progress.total)}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={progressValue}
            aria-label={TEST_DATA_MESSAGES.progressLabel(progress.completed, progress.total)}
          />
        </Stack>
      ) : null}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        {generating ? (
          <Button variant="outlined" color="inherit" onClick={onCancel}>
            {TEST_DATA_MESSAGES.cancelGeneration}
          </Button>
        ) : (
          <Button variant="contained" onClick={onGenerate}>
            {TEST_DATA_MESSAGES.generateBatch}
          </Button>
        )}
      </Stack>
    </Stack>
  );
}
