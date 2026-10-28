import AddIcon from '@mui/icons-material/Add';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';

import { ColorField } from '@/features/wheel-customization/components/ColorField';
import { CUSTOMIZATION_MESSAGES } from '@/features/wheel-customization/constants';
import type { HexColor } from '@/types/wheel';

interface SegmentColorListProps {
  colors: HexColor[];
  onChange: (colors: HexColor[]) => void;
  onCommit?: () => void;
}

export function SegmentColorList({ colors, onChange, onCommit }: SegmentColorListProps) {
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
        {CUSTOMIZATION_MESSAGES.segmentColors}
      </Typography>
      <Stack spacing={1.5}>
        {colors.map((color, index) => (
          <Stack key={`segment-color-${index}`} direction="row" spacing={1} sx={{ alignItems: 'flex-end' }}>
            <Box sx={{ flex: 1 }}>
              <ColorField
                label={CUSTOMIZATION_MESSAGES.colorN(index)}
                value={color}
                onChange={(next) => {
                  const copy = [...colors];
                  copy[index] = next;
                  onChange(copy);
                }}
                onCommit={onCommit}
              />
            </Box>
            <IconButton
              aria-label={CUSTOMIZATION_MESSAGES.removeColor(index)}
              onClick={() => onChange(colors.filter((_, colorIndex) => colorIndex !== index))}
              disabled={colors.length <= 1}
              sx={{ mb: 0.5 }}
            >
              <DeleteOutlinedIcon />
            </IconButton>
          </Stack>
        ))}
        <Button
          startIcon={<AddIcon />}
          onClick={() => onChange([...colors, colors[colors.length - 1] ?? '#4f46e5'])}
        >
          {CUSTOMIZATION_MESSAGES.addColor}
        </Button>
      </Stack>
    </Box>
  );
}
