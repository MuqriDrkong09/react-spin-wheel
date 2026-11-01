import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import { Button, Chip, Stack, Typography } from '@mui/material';

import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { DEFAULT_WHEEL_CATEGORY } from '@/constants/wheel';
import { ShareItemTree } from '@/features/wheel-share/components/ShareItemTree';
import { ShareWheelSnackbar } from '@/features/wheel-share/components/ShareWheelSnackbar';
import { SHARE_MESSAGES } from '@/features/wheel-share/constants';
import { useSharedWheel } from '@/features/wheel-share/hooks/useSharedWheel';
import { toSharePreviewItems } from '@/features/wheel-share/utils/toPreviewItems';
import { WheelPreview } from '@/features/wheel-customization/components/WheelPreview';
import type { ShareFailureReason } from '@/features/wheel-share/types';

const ERROR_COPY: Record<ShareFailureReason, { title: string; description: string }> = {
  missing: { title: SHARE_MESSAGES.missingTitle, description: SHARE_MESSAGES.missing },
  invalid: { title: SHARE_MESSAGES.invalidTitle, description: SHARE_MESSAGES.invalid },
  expired: { title: SHARE_MESSAGES.expiredTitle, description: SHARE_MESSAGES.expired },
  unavailable: { title: SHARE_MESSAGES.unavailableTitle, description: SHARE_MESSAGES.unavailable },
};

export function SharedWheelScreen() {
  const shared = useSharedWheel();

  return (
    <PageContainer>
      <Stack spacing={3}>
        <PageHeader
          title={SHARE_MESSAGES.pageTitle}
          description={
            shared.resolved.ok
              ? SHARE_MESSAGES.pageDescription
              : ERROR_COPY[shared.resolved.reason].description
          }
          action={
            shared.resolved.ok ? (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={<ContentCopyOutlinedIcon />}
                  onClick={() => {
                    void shared.copyShareLink();
                  }}
                >
                  {SHARE_MESSAGES.copyLink}
                </Button>
                <Button variant="contained" onClick={shared.saveCopy}>
                  {SHARE_MESSAGES.saveCopy}
                </Button>
              </Stack>
            ) : undefined
          }
        />
        {shared.resolved.ok ? (
          <Stack spacing={2.5}>
            <Stack spacing={1}>
              <Typography variant="h5" component="h2">
                {shared.resolved.document.wheel.name}
              </Typography>
              <Chip
                label={shared.resolved.document.wheel.category?.trim() || DEFAULT_WHEEL_CATEGORY}
                size="small"
                sx={{ alignSelf: 'flex-start' }}
              />
              <Typography color="text.secondary">
                {shared.resolved.document.wheel.description?.trim() || 'No description'}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                {SHARE_MESSAGES.previewHint}
              </Typography>
            </Stack>
            <WheelPreview
              items={toSharePreviewItems(shared.resolved.document.wheel.items)}
              appearance={shared.resolved.document.wheel.settings.appearance}
            />
            <Stack spacing={1}>
              <Typography variant="subtitle2" component="h3">
                {SHARE_MESSAGES.optionsHeading}
              </Typography>
              <ShareItemTree items={shared.resolved.document.wheel.items} />
            </Stack>
          </Stack>
        ) : (
          <EmptyState
            title={ERROR_COPY[shared.resolved.reason].title}
            description={ERROR_COPY[shared.resolved.reason].description}
            titleComponent="h2"
            action={
              <Button variant="contained" onClick={shared.goToDashboard}>
                {SHARE_MESSAGES.backToDashboard}
              </Button>
            }
          />
        )}
      </Stack>
      <ShareWheelSnackbar status={shared.status} onClose={shared.clearStatus} />
    </PageContainer>
  );
}
