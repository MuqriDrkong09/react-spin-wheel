import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';

import { SPIN_MESSAGES } from '@/features/spin/constants';
import { isSelectionMode, SELECTION_MODE, type SelectionMode } from '@/types/wheel';

interface SelectionModeSelectProps {
  value: SelectionMode;
  onChange: (value: SelectionMode) => void;
}

export function SelectionModeSelect({ value, onChange }: SelectionModeSelectProps) {
  return (
    <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 180 } }}>
      <InputLabel id="selection-mode-label">{SPIN_MESSAGES.selectionMode}</InputLabel>
      <Select
        labelId="selection-mode-label"
        label={SPIN_MESSAGES.selectionMode}
        value={value}
        onChange={(event) => {
          if (isSelectionMode(event.target.value)) {
            onChange(event.target.value);
          }
        }}
      >
        <MenuItem value={SELECTION_MODE.manual}>{SPIN_MESSAGES.selectionModeManual}</MenuItem>
        <MenuItem value={SELECTION_MODE.automatic}>{SPIN_MESSAGES.selectionModeAutomatic}</MenuItem>
        <MenuItem value={SELECTION_MODE.ask}>{SPIN_MESSAGES.selectionModeAsk}</MenuItem>
      </Select>
    </FormControl>
  );
}
