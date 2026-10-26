import PlayCircleOutlinedIcon from '@mui/icons-material/PlayCircleOutlined';
import { Card, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';

import { getWheelCategory } from '@/features/dashboard/utils/selectDashboardData';
import { SPIN_MESSAGES } from '@/features/spin/constants';
import type { Wheel, WheelId } from '@/types/wheel';

interface SpinWheelPickerProps {
  wheels: Wheel[];
  onSelect: (wheelId: WheelId) => void;
}

export function SpinWheelPicker({ wheels, onSelect }: SpinWheelPickerProps) {
  return (
    <Card variant="outlined">
      <List disablePadding>
        {wheels.map((wheel) => (
          <ListItemButton
            key={wheel.id}
            onClick={() => onSelect(wheel.id)}
            aria-label={SPIN_MESSAGES.chooseWheelAction(wheel.name)}
          >
            <ListItemIcon>
              <PlayCircleOutlinedIcon />
            </ListItemIcon>
            <ListItemText
              primary={wheel.name}
              secondary={`${getWheelCategory(wheel)} · ${SPIN_MESSAGES.itemCount(wheel.items.length)}`}
            />
          </ListItemButton>
        ))}
      </List>
    </Card>
  );
}
