import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';

import { DEFAULT_WHEEL_APPEARANCE } from '@/constants/wheelAppearance';
import { PRESET_MESSAGES } from '@/features/presets/constants';
import { PresetItemTree } from '@/features/presets/components/PresetItemTree';
import type { WheelPresetDefinition } from '@/features/presets/types';
import { toPreviewItems } from '@/features/presets/utils/toPreviewItems';
import { WheelPreview } from '@/features/wheel-customization/components/WheelPreview';

interface PresetPreviewDialogProps {
  preset?: WheelPresetDefinition;
  onClose: () => void;
  onSaveAsOwn: () => void;
  onModify: () => void;
}

export function PresetPreviewDialog({
  preset,
  onClose,
  onSaveAsOwn,
  onModify,
}: PresetPreviewDialogProps) {
  const items = preset ? toPreviewItems(preset.items) : [];

  return (
    <Dialog
      open={Boolean(preset)}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      transitionDuration={0}
      closeAfterTransition={false}
      aria-labelledby="preset-preview-title"
      aria-describedby="preset-preview-hint"
    >
      <DialogTitle id="preset-preview-title">
        {preset ? PRESET_MESSAGES.previewTitle(preset.name) : PRESET_MESSAGES.preview}
      </DialogTitle>
      <DialogContent>
        {preset ? (
          <Stack spacing={2.5}>
            <Typography id="preset-preview-hint" color="text.secondary">
              {PRESET_MESSAGES.previewHint}
            </Typography>
            <WheelPreview items={items} appearance={DEFAULT_WHEEL_APPEARANCE} />
            <Stack spacing={1}>
              <Typography variant="subtitle2" component="h3">
                {PRESET_MESSAGES.optionsHeading}
              </Typography>
              <PresetItemTree items={preset.items} />
            </Stack>
          </Stack>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ flexWrap: 'wrap', gap: 1, px: 3, pb: 2 }}>
        <Button onClick={onClose}>{PRESET_MESSAGES.closePreview}</Button>
        <Button aria-label={preset ? `Modify ${preset.name}` : PRESET_MESSAGES.modify} onClick={onModify}>
          {PRESET_MESSAGES.modify}
        </Button>
        <Button
          variant="contained"
          aria-label={preset ? `Save ${preset.name} as my wheel` : PRESET_MESSAGES.saveAsOwn}
          onClick={onSaveAsOwn}
        >
          {PRESET_MESSAGES.saveAsOwn}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
