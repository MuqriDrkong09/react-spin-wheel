import { Stack } from '@mui/material';

import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { SETTINGS_MESSAGES } from '@/features/settings/constants';
import { SoundSettingsPanel } from '@/features/sound/components/SoundSettingsPanel';

export function SettingsScreen() {
  return (
    <PageContainer>
      <Stack spacing={3}>
        <PageHeader title={SETTINGS_MESSAGES.title} description={SETTINGS_MESSAGES.description} />
        <SoundSettingsPanel />
      </Stack>
    </PageContainer>
  );
}
