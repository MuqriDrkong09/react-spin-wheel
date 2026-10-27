import { FormControlLabel, Switch } from '@mui/material';

import { SPIN_MESSAGES } from '@/features/spin/constants';

interface RemoveWinnerSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function RemoveWinnerSwitch({ checked, onChange }: RemoveWinnerSwitchProps) {
  return (
    <FormControlLabel
      sx={{ mx: 0, whiteSpace: 'nowrap' }}
      control={
        <Switch
          checked={checked}
          onChange={(_, next) => onChange(next)}
          slotProps={{ input: { 'aria-label': SPIN_MESSAGES.removeWinner } }}
        />
      }
      label={SPIN_MESSAGES.removeWinner}
    />
  );
}
