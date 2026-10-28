import { Box, Button, Stack, Typography } from '@mui/material';

import { WHEEL_THEME_LABELS, WHEEL_THEME_PRESETS } from '@/constants/wheelAppearance';
import { CUSTOMIZATION_MESSAGES } from '@/features/wheel-customization/constants';
import { WHEEL_THEME, type WheelTheme } from '@/types/wheel';

interface ThemePickerProps {
  value: WheelTheme;
  onChange: (theme: Exclude<WheelTheme, 'custom'>) => void;
}

const NAMED_THEMES = Object.keys(WHEEL_THEME_PRESETS) as Exclude<WheelTheme, 'custom'>[];

export function ThemePicker({ value, onChange }: ThemePickerProps) {
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
        {CUSTOMIZATION_MESSAGES.themes}
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gap: 1,
          gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, minmax(0, 1fr))' },
        }}
      >
        {NAMED_THEMES.map((theme) => {
          const preset = WHEEL_THEME_PRESETS[theme];
          const selected = value === theme;

          return (
            <Button
              key={theme}
              variant={selected ? 'contained' : 'outlined'}
              onClick={() => onChange(theme)}
              aria-pressed={selected}
              aria-label={CUSTOMIZATION_MESSAGES.applyTheme(WHEEL_THEME_LABELS[theme])}
              sx={{
                justifyContent: 'flex-start',
                px: 1.5,
                py: 1.25,
                textTransform: 'none',
                bgcolor: selected ? undefined : preset.background,
                color: selected ? undefined : preset.textColor,
                borderColor: selected ? undefined : preset.borderColor,
                '&:hover': {
                  bgcolor: selected ? undefined : preset.background,
                },
              }}
            >
              <Stack spacing={0.75} sx={{ alignItems: 'flex-start' }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'inherit' }}>
                  {WHEEL_THEME_LABELS[theme]}
                </Typography>
                <Stack direction="row" spacing={0.5}>
                  {preset.segmentColors.slice(0, 5).map((color, index) => (
                    <Box
                      key={`${theme}-${index}`}
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: color,
                        border: '1px solid rgba(0,0,0,0.15)',
                      }}
                    />
                  ))}
                </Stack>
              </Stack>
            </Button>
          );
        })}
      </Box>
      {value === WHEEL_THEME.custom ? (
        <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
          Custom
        </Typography>
      ) : null}
    </Box>
  );
}
