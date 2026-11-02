import { FormControlLabel, Switch } from '@mui/material';

import { SPIN_MESSAGES } from '@/features/spin/constants';

interface RemoveWinnerSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function RemoveWinnerSwitch({ checked, onChange, disabled = false }: RemoveWinnerSwitchProps) {
  return (
    <FormControlLabel
      sx={{ mx: 0, whiteSpace: 'nowrap' }}
      disabled={disabled}
      control={
        <Switch
          checked={checked}
          disabled={disabled}
          onChange={(_, next) => onChange(next)}
          slotProps={{ input: { 'aria-label': SPIN_MESSAGES.removeWinner } }}
        />
      }
      label={SPIN_MESSAGES.removeWinner}
    />
  );
}
