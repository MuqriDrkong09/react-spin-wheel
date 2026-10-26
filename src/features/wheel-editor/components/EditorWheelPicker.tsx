import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { Card, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';

import { getWheelCategory } from '@/features/dashboard/utils/selectDashboardData';
import { EDITOR_MESSAGES } from '@/features/wheel-editor/constants';
import type { Wheel, WheelId } from '@/types/wheel';

interface EditorWheelPickerProps {
  wheels: Wheel[];
  onSelect: (wheelId: WheelId) => void;
}

export function EditorWheelPicker({ wheels, onSelect }: EditorWheelPickerProps) {
  return (
    <Card variant="outlined">
      <List disablePadding>
        {wheels.map((wheel) => (
          <ListItemButton
            key={wheel.id}
            onClick={() => onSelect(wheel.id)}
            aria-label={EDITOR_MESSAGES.chooseWheelAction(wheel.name)}
          >
            <ListItemIcon>
              <EditOutlinedIcon />
            </ListItemIcon>
            <ListItemText
              primary={wheel.name}
              secondary={`${getWheelCategory(wheel)} · ${EDITOR_MESSAGES.itemCount(wheel.items.length)}`}
            />
          </ListItemButton>
        ))}
      </List>
    </Card>
  );
}
