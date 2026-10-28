import { Box } from '@mui/material';

import { activeWheelItems } from '@/features/spin/utils/wheelGeometry';
import { segmentColorAt } from '@/features/wheel-customization/utils/appearance';
import { CENTER_BUTTON_STYLE, type WheelAppearance, type WheelItem } from '@/types/wheel';

interface WheelPreviewProps {
  items: WheelItem[];
  appearance: WheelAppearance;
}

export function WheelPreview({ items, appearance }: WheelPreviewProps) {
  const segments = activeWheelItems(items);
  const colors = segments.map((item, index) => segmentColorAt(appearance, index, item.color));
  const gradient =
    colors.length === 0
      ? appearance.background
      : `conic-gradient(${colors
          .map((color, index) => {
            const start = (index / colors.length) * 360;
            const end = ((index + 1) / colors.length) * 360;
            return `${color} ${start}deg ${end}deg`;
          })
          .join(', ')})`;
  const hubColor =
    appearance.centerButtonStyle === CENTER_BUTTON_STYLE.filled
      ? appearance.centerButtonColor
      : appearance.background;

  return (
    <Box
      aria-hidden
      sx={{
        position: 'relative',
        width: '100%',
        maxWidth: 280,
        mx: 'auto',
        aspectRatio: '1',
      }}
    >
      <Box
        sx={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          bgcolor: appearance.background,
          backgroundImage: gradient,
          border: `${appearance.borderWidth}px solid ${appearance.borderColor}`,
          boxSizing: 'border-box',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          left: '50%',
          top: 0,
          width: 0,
          height: 0,
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: `18px solid ${appearance.pointerColor}`,
          transform: 'translateX(-50%)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '22%',
          height: '22%',
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: hubColor,
          color: appearance.centerButtonTextColor,
          border:
            appearance.centerButtonStyle === CENTER_BUTTON_STYLE.outlined
              ? `2px solid ${appearance.centerButtonColor}`
              : 'none',
        }}
      />
    </Box>
  );
}
