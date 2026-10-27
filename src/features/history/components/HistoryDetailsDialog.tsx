import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';

import { formatDateTime } from '@/features/dashboard/utils/formatDateTime';
import { HISTORY_MESSAGES, HISTORY_MODE_LABELS } from '@/features/history/constants';
import { formatDuration } from '@/features/history/utils/formatDuration';
import type { HistoryResult } from '@/features/history/utils/selectHistory';

interface HistoryDetailsDialogProps {
  result?: HistoryResult | null;
  onClose: () => void;
}

export function HistoryDetailsDialog({ result, onClose }: HistoryDetailsDialogProps) {
  return (
    <Dialog
      open={Boolean(result)}
      onClose={onClose}
      transitionDuration={0}
      closeAfterTransition={false}
      fullWidth
      maxWidth="sm"
      aria-labelledby="history-details-title"
    >
      <DialogTitle id="history-details-title">{HISTORY_MESSAGES.detailsTitle}</DialogTitle>
      <DialogContent>
        {result ? (
          <Stack spacing={1.5} component="dl" sx={{ m: 0 }}>
            <Detail label={HISTORY_MESSAGES.wheel} value={result.wheelName} />
            <Detail label={HISTORY_MESSAGES.path} value={result.pathLabel} />
            <Detail label={HISTORY_MESSAGES.selectedItem} value={result.selectedItemName} />
            <Detail label={HISTORY_MESSAGES.timestamp} value={formatDateTime(result.timestamp)} />
            <Detail label={HISTORY_MESSAGES.duration} value={formatDuration(result.duration)} />
            <Detail label={HISTORY_MESSAGES.mode} value={HISTORY_MODE_LABELS[result.mode]} />
            <Detail label={HISTORY_MESSAGES.session} value={result.sessionId} />
          </Stack>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{HISTORY_MESSAGES.close}</Button>
      </DialogActions>
    </Dialog>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <Stack spacing={0.25}>
      <Typography component="dt" variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography component="dd" sx={{ m: 0, fontWeight: 600 }}>
        {value}
      </Typography>
    </Stack>
  );
}
