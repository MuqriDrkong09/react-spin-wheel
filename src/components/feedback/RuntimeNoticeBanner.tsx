import CloseIcon from '@mui/icons-material/Close';
import { Alert, IconButton } from '@mui/material';

import { APP_ERROR_MESSAGES } from '@/constants/errorMessages';
import { useRuntimeNoticeStore } from '@/stores/runtimeNoticeStore';

export function RuntimeNoticeBanner() {
  const notice = useRuntimeNoticeStore((state) => state.notice);
  const dismissNotice = useRuntimeNoticeStore((state) => state.dismissNotice);

  if (!notice) {
    return null;
  }

  const severity =
    notice.kind === 'storageRecovered' || notice.kind === 'hierarchyRepaired' ? 'warning' : 'error';

  return (
    <Alert
      severity={severity}
      role="status"
      aria-live="polite"
      action={
        <IconButton
          aria-label={APP_ERROR_MESSAGES.dismissNotice}
          color="inherit"
          size="small"
          onClick={dismissNotice}
        >
          <CloseIcon fontSize="inherit" />
        </IconButton>
      }
      sx={{ mb: 2 }}
    >
      {notice.message}
    </Alert>
  );
}
