import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Stack,
  Typography,
} from '@mui/material';

import { PRESET_MESSAGES } from '@/features/presets/constants';
import type { WheelPresetDefinition } from '@/features/presets/types';
import { countPresetChildren, countPresetRoots } from '@/features/presets/utils/clonePreset';
import type { WheelPresetId } from '@/types/wheel';

interface PresetCardProps {
  preset: WheelPresetDefinition;
  onPreview: (presetId: WheelPresetId) => void;
  onCreate: (presetId: WheelPresetId) => void;
  onModify: (presetId: WheelPresetId) => void;
}

export function PresetCard({ preset, onPreview, onCreate, onModify }: PresetCardProps) {
  const rootCount = countPresetRoots(preset.items);
  const nestedCount = countPresetChildren(preset.items);

  return (
    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" component="h2" noWrap>
              {preset.icon} {preset.name}
            </Typography>
            <Chip label={preset.category} size="small" sx={{ mt: 1 }} />
          </Box>
        </Stack>
        <Typography color="text.secondary" sx={{ mt: 1.5 }} variant="body2">
          {preset.description}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }} variant="caption">
          {PRESET_MESSAGES.itemCount(rootCount)}
          {nestedCount > 0 ? ` · ${PRESET_MESSAGES.nestedCount(nestedCount)}` : ''}
        </Typography>
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Button
          size="small"
          startIcon={<VisibilityOutlinedIcon />}
          aria-label={`Preview ${preset.name}`}
          onClick={() => onPreview(preset.id)}
        >
          {PRESET_MESSAGES.preview}
        </Button>
        <Button
          variant="contained"
          size="small"
          startIcon={<PlayArrowIcon />}
          aria-label={`Create ${preset.name} from preset`}
          onClick={() => onCreate(preset.id)}
        >
          {PRESET_MESSAGES.create}
        </Button>
        <Button
          size="small"
          startIcon={<EditOutlinedIcon />}
          aria-label={`Modify ${preset.name}`}
          onClick={() => onModify(preset.id)}
        >
          {PRESET_MESSAGES.modify}
        </Button>
      </CardActions>
    </Card>
  );
}
