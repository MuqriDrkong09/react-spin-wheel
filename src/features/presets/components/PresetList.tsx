import { Box } from '@mui/material';

import { PresetCard } from '@/features/presets/components/PresetCard';
import type { WheelPresetDefinition } from '@/features/presets/types';
import type { WheelPresetId } from '@/types/wheel';

interface PresetListProps {
  presets: readonly WheelPresetDefinition[];
  onPreview: (presetId: WheelPresetId) => void;
  onCreate: (presetId: WheelPresetId) => void;
  onModify: (presetId: WheelPresetId) => void;
}

export function PresetList({ presets, onPreview, onCreate, onModify }: PresetListProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(3, minmax(0, 1fr))' },
      }}
    >
      {presets.map((preset) => (
        <PresetCard
          key={preset.id}
          preset={preset}
          onPreview={onPreview}
          onCreate={onCreate}
          onModify={onModify}
        />
      ))}
    </Box>
  );
}
