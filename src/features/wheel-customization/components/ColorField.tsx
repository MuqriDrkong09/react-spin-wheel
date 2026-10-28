import { Box, Button, ClickAwayListener, Paper, Popper, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { HexColorPicker } from 'react-colorful';

import { isHexColor, normalizeHexColor } from '@/constants/wheelAppearance';
import { CUSTOMIZATION_MESSAGES } from '@/features/wheel-customization/constants';
import type { HexColor } from '@/types/wheel';

interface ColorFieldProps {
  label: string;
  value: HexColor;
  onChange: (value: HexColor) => void;
  onCommit?: (value: HexColor) => void;
}

export function ColorField({ label, value, onChange, onCommit }: ColorFieldProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [draft, setDraft] = useState(value);
  const [editingHex, setEditingHex] = useState(false);
  const [hexDraft, setHexDraft] = useState(value);
  const open = Boolean(anchorEl);
  const displayed = open ? draft : value;
  const hexValue = editingHex ? hexDraft : displayed;

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') {
        return;
      }

      setAnchorEl(null);
      onCommit?.(draft);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [draft, onCommit, open]);

  function applyColor(next: string, commit = false) {
    const color = normalizeHexColor(next, displayed);
    setDraft(color);
    onChange(color);
    if (commit) {
      onCommit?.(color);
    }
  }

  function closePicker() {
    if (!open) {
      return;
    }

    setAnchorEl(null);
    onCommit?.(draft);
  }

  return (
    <ClickAwayListener onClickAway={closePicker}>
      <Stack spacing={0.75}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Button
            variant="outlined"
            aria-label={label}
            aria-expanded={open}
            aria-haspopup="dialog"
            onClick={(event) => {
              setDraft(normalizeHexColor(value, value));
              setAnchorEl(event.currentTarget);
            }}
            sx={{
              minWidth: 56,
              width: 56,
              height: 40,
              p: 0.5,
              borderColor: 'divider',
              bgcolor: displayed,
              boxShadow: (theme) =>
                `inset 0 0 0 1px ${
                  theme.palette.mode === 'dark' ? 'rgba(248,250,252,0.22)' : 'rgba(15,23,42,0.16)'
                }`,
              '&:hover': { bgcolor: displayed },
            }}
          />
          <TextField
            value={hexValue}
            onFocus={() => {
              setHexDraft(displayed);
              setEditingHex(true);
            }}
            onChange={(event) => {
              const next = event.target.value;
              setHexDraft(next);
              if (/^#[0-9a-fA-F]{6}$/.test(next.trim())) {
                applyColor(next);
              }
            }}
            onBlur={() => {
              setEditingHex(false);
              if (isHexColor(hexDraft)) {
                applyColor(hexDraft, true);
              }
            }}
            slotProps={{ htmlInput: { 'aria-label': `${label} hex` } }}
            size="small"
            fullWidth
          />
        </Stack>
        {open ? (
          <Popper
            open
            anchorEl={anchorEl}
            placement="bottom-start"
            disablePortal
            sx={{ zIndex: (theme) => theme.zIndex.modal }}
          >
            <Paper
              elevation={8}
              sx={{ p: 1.5, mt: 1 }}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <Box
                sx={{
                  '& .react-colorful': { width: 240, height: 200 },
                  '& .react-colorful__saturation': { borderRadius: 1, marginBottom: 1 },
                  '& .react-colorful__hue': { borderRadius: 1, height: 12 },
                  '& .react-colorful__interactive': { outline: 'none' },
                  '& .react-colorful__pointer': { width: 18, height: 18 },
                }}
              >
                <HexColorPicker
                  aria-label={CUSTOMIZATION_MESSAGES.colorPicker(label)}
                  color={draft}
                  onChange={applyColor}
                  onChangeEnd={(next) => applyColor(next, true)}
                />
              </Box>
            </Paper>
          </Popper>
        ) : null}
      </Stack>
    </ClickAwayListener>
  );
}
