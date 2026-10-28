import { Stack } from '@mui/material';

import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { PresetList } from '@/features/presets/components/PresetList';
import { PresetPreviewDialog } from '@/features/presets/components/PresetPreviewDialog';
import { PRESET_MESSAGES } from '@/features/presets/constants';
import { usePresets } from '@/features/presets/hooks/usePresets';

export function PresetsScreen() {
  const presets = usePresets();

  return (
    <PageContainer>
      <Stack spacing={3}>
        <PageHeader title={PRESET_MESSAGES.title} description={PRESET_MESSAGES.description} />
        <PresetList
          presets={presets.presets}
          onPreview={presets.previewPreset}
          onCreate={presets.createFromPreset}
          onModify={presets.modifyPreset}
        />
      </Stack>
      <PresetPreviewDialog
        preset={presets.preview}
        onClose={presets.closePreview}
        onModify={() => {
          if (presets.preview) {
            presets.modifyPreset(presets.preview.id);
          }
        }}
        onSaveAsOwn={() => {
          if (presets.preview) {
            presets.saveAsOwnWheel(presets.preview.id);
          }
        }}
      />
    </PageContainer>
  );
}
