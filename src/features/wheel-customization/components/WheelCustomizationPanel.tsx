import {
  Box,
  Card,
  CardContent,
  MenuItem,
  Slider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import { WHEEL_BORDER_WIDTH_MAX, WHEEL_FONT_SIZE_MAX, WHEEL_FONT_SIZE_MIN } from '@/constants/wheelAppearance';
import { ColorField } from '@/features/wheel-customization/components/ColorField';
import { WheelPreview } from '@/features/wheel-customization/components/WheelPreview';
import { SegmentColorList } from '@/features/wheel-customization/components/SegmentColorList';
import { ThemePicker } from '@/features/wheel-customization/components/ThemePicker';
import { CUSTOMIZATION_MESSAGES } from '@/features/wheel-customization/constants';
import { useWheelCustomization } from '@/features/wheel-customization/hooks/useWheelCustomization';
import { displayWheelTitle } from '@/features/wheel-customization/utils/appearance';
import {
  CENTER_BUTTON_STYLE,
  WHEEL_SIZE,
  type Wheel,
  type WheelFontWeight,
} from '@/types/wheel';

interface WheelCustomizationPanelProps {
  wheel: Wheel;
}

export function WheelCustomizationPanel({ wheel }: WheelCustomizationPanelProps) {
  const { appearance, commit, persistNow, applyTheme } = useWheelCustomization(wheel);
  const previewTitle = displayWheelTitle(appearance, wheel.name);

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h6" component="h2">
              {CUSTOMIZATION_MESSAGES.title}
            </Typography>
            <Typography color="text.secondary">{CUSTOMIZATION_MESSAGES.description}</Typography>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gap: 3,
              gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.1fr) minmax(0, 0.9fr)' },
              alignItems: 'start',
            }}
          >
            <Stack spacing={3}>
              <ThemePicker value={appearance.theme} onChange={applyTheme} />

              <TextField
                label={CUSTOMIZATION_MESSAGES.wheelTitle}
                value={appearance.title}
                placeholder={CUSTOMIZATION_MESSAGES.wheelTitlePlaceholder}
                onChange={(event) => commit({ title: event.target.value })}
                fullWidth
              />

              <TextField
                label={CUSTOMIZATION_MESSAGES.size}
                value={appearance.size}
                onChange={(event) => commit({ size: event.target.value as typeof appearance.size })}
                select
                fullWidth
              >
                <MenuItem value={WHEEL_SIZE.sm}>{CUSTOMIZATION_MESSAGES.sizeSmall}</MenuItem>
                <MenuItem value={WHEEL_SIZE.md}>{CUSTOMIZATION_MESSAGES.sizeMedium}</MenuItem>
                <MenuItem value={WHEEL_SIZE.lg}>{CUSTOMIZATION_MESSAGES.sizeLarge}</MenuItem>
              </TextField>

              <Box
                sx={{
                  display: 'grid',
                  gap: 2,
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                }}
              >
                <ColorField
                  label={CUSTOMIZATION_MESSAGES.textColor}
                  value={appearance.textColor}
                  onChange={(textColor) => commit({ textColor }, { persist: 'none' })}
                  onCommit={persistNow}
                />
                <ColorField
                  label={CUSTOMIZATION_MESSAGES.pointerColor}
                  value={appearance.pointerColor}
                  onChange={(pointerColor) => commit({ pointerColor }, { persist: 'none' })}
                  onCommit={persistNow}
                />
                <ColorField
                  label={CUSTOMIZATION_MESSAGES.borderColor}
                  value={appearance.borderColor}
                  onChange={(borderColor) => commit({ borderColor }, { persist: 'none' })}
                  onCommit={persistNow}
                />
                <ColorField
                  label={CUSTOMIZATION_MESSAGES.background}
                  value={appearance.background}
                  onChange={(background) => commit({ background }, { persist: 'none' })}
                  onCommit={persistNow}
                />
                <ColorField
                  label={CUSTOMIZATION_MESSAGES.centerButtonColor}
                  value={appearance.centerButtonColor}
                  onChange={(centerButtonColor) => commit({ centerButtonColor }, { persist: 'none' })}
                  onCommit={persistNow}
                />
                <ColorField
                  label={CUSTOMIZATION_MESSAGES.centerButtonTextColor}
                  value={appearance.centerButtonTextColor}
                  onChange={(centerButtonTextColor) =>
                    commit({ centerButtonTextColor }, { persist: 'none' })
                  }
                  onCommit={persistNow}
                />
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary" id="wheel-border-width-label">
                  {CUSTOMIZATION_MESSAGES.borderWidth}
                </Typography>
                <Slider
                  aria-labelledby="wheel-border-width-label"
                  value={appearance.borderWidth}
                  min={0}
                  max={WHEEL_BORDER_WIDTH_MAX}
                  step={1}
                  valueLabelDisplay="auto"
                  onChange={(_, value) => {
                    const next = Array.isArray(value) ? value[0] : value;
                    if (typeof next === 'number') {
                      commit({ borderWidth: next });
                    }
                  }}
                />
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary" id="wheel-font-size-label">
                  {CUSTOMIZATION_MESSAGES.fontSize}
                </Typography>
                <Slider
                  aria-labelledby="wheel-font-size-label"
                  value={appearance.fontSize}
                  min={WHEEL_FONT_SIZE_MIN}
                  max={WHEEL_FONT_SIZE_MAX}
                  step={1}
                  valueLabelDisplay="auto"
                  onChange={(_, value) => {
                    const next = Array.isArray(value) ? value[0] : value;
                    if (typeof next === 'number') {
                      commit({ fontSize: next });
                    }
                  }}
                />
              </Box>

              <TextField
                label={CUSTOMIZATION_MESSAGES.fontWeight}
                value={appearance.fontWeight}
                onChange={(event) =>
                  commit({ fontWeight: Number(event.target.value) as WheelFontWeight })
                }
                select
                fullWidth
              >
                <MenuItem value={400}>{CUSTOMIZATION_MESSAGES.fontRegular}</MenuItem>
                <MenuItem value={600}>{CUSTOMIZATION_MESSAGES.fontSemibold}</MenuItem>
                <MenuItem value={700}>{CUSTOMIZATION_MESSAGES.fontBold}</MenuItem>
              </TextField>

              <TextField
                label={CUSTOMIZATION_MESSAGES.centerButtonStyle}
                value={appearance.centerButtonStyle}
                onChange={(event) =>
                  commit({
                    centerButtonStyle: event.target.value as typeof appearance.centerButtonStyle,
                  })
                }
                select
                fullWidth
              >
                <MenuItem value={CENTER_BUTTON_STYLE.filled}>
                  {CUSTOMIZATION_MESSAGES.centerFilled}
                </MenuItem>
                <MenuItem value={CENTER_BUTTON_STYLE.outlined}>
                  {CUSTOMIZATION_MESSAGES.centerOutlined}
                </MenuItem>
                <MenuItem value={CENTER_BUTTON_STYLE.ghost}>
                  {CUSTOMIZATION_MESSAGES.centerGhost}
                </MenuItem>
              </TextField>

              <SegmentColorList
                colors={appearance.segmentColors}
                onChange={(segmentColors) => commit({ segmentColors }, { persist: 'none' })}
                onCommit={persistNow}
              />
            </Stack>

            <Card variant="outlined" sx={{ bgcolor: appearance.background }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  {CUSTOMIZATION_MESSAGES.preview}
                </Typography>
                <Typography
                  variant="h6"
                  component="p"
                  sx={{ textAlign: 'center', mb: 2, fontWeight: 700, color: appearance.textColor }}
                >
                  {previewTitle}
                </Typography>
                <WheelPreview items={wheel.items} appearance={appearance} />
              </CardContent>
            </Card>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
