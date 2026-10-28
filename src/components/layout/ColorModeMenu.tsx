import CheckIcon from '@mui/icons-material/Check';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import SettingsBrightnessOutlinedIcon from '@mui/icons-material/SettingsBrightnessOutlined';
import { IconButton, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import { useState } from 'react';

import { COLOR_MODE_MESSAGES, COLOR_MODE_OPTIONS } from '@/constants/colorMode';
import { useColorMode } from '@/hooks/useColorMode';
import { COLOR_MODE, type ColorMode } from '@/types/colorMode';

export function ColorModeMenu() {
  const { colorMode, resolvedMode, setColorMode } = useColorMode();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton
        color="inherit"
        aria-label={COLOR_MODE_MESSAGES.choose}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? 'color-mode-menu' : undefined}
        onClick={(event) => setAnchorEl(event.currentTarget)}
      >
        {colorMode === COLOR_MODE.system ? (
          <SettingsBrightnessOutlinedIcon />
        ) : resolvedMode === 'dark' ? (
          <DarkModeOutlinedIcon />
        ) : (
          <LightModeOutlinedIcon />
        )}
      </IconButton>
      <Menu
        id="color-mode-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        slotProps={{
          list: { 'aria-label': COLOR_MODE_MESSAGES.choose },
        }}
      >
        {COLOR_MODE_OPTIONS.map((mode) => (
          <MenuItem
            key={mode}
            selected={colorMode === mode}
            onClick={() => {
              setColorMode(mode);
              setAnchorEl(null);
            }}
          >
            <ListItemIcon>{modeIcon(mode)}</ListItemIcon>
            <ListItemText>{COLOR_MODE_MESSAGES[mode]}</ListItemText>
            {colorMode === mode ? <CheckIcon fontSize="small" /> : null}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

function modeIcon(mode: ColorMode) {
  if (mode === COLOR_MODE.dark) {
    return <DarkModeOutlinedIcon fontSize="small" />;
  }

  if (mode === COLOR_MODE.system) {
    return <SettingsBrightnessOutlinedIcon fontSize="small" />;
  }

  return <LightModeOutlinedIcon fontSize="small" />;
}
