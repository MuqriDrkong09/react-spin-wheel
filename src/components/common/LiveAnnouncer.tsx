import { Typography } from '@mui/material';

import { visuallyHiddenSx } from '@/components/common/visuallyHidden';

interface LiveAnnouncerProps {
  message: string;
  politeness?: 'polite' | 'assertive';
  atomic?: boolean;
  id?: string;
}

/** Screen-reader-only live region for status and result announcements. */
export function LiveAnnouncer({
  message,
  politeness = 'polite',
  atomic = true,
  id,
}: LiveAnnouncerProps) {
  return (
    <Typography
      id={id}
      component="p"
      aria-live={politeness}
      aria-atomic={atomic}
      sx={visuallyHiddenSx}
    >
      {message}
    </Typography>
  );
}
