import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { List, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';

import { DashboardSectionCard } from '@/features/dashboard/components/DashboardSectionCard';
import type { Wheel, WheelId } from '@/types/wheel';

interface FavoriteWheelsCardProps {
  wheels: Wheel[];
  onOpen: (wheelId: WheelId) => void;
}

export function FavoriteWheelsCard({ wheels, onOpen }: FavoriteWheelsCardProps) {
  return (
    <DashboardSectionCard title="Favorite wheels">
      {wheels.length === 0 ? (
        <Typography color="text.secondary">No favorite wheels yet.</Typography>
      ) : (
        <List disablePadding>
          {wheels.map((wheel) => (
            <ListItemButton
              key={wheel.id}
              disableGutters
              onClick={() => onOpen(wheel.id)}
              aria-label={`Open favorite ${wheel.name}`}
              sx={{ p: 0 }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <FavoriteBorderIcon fontSize="small" color="secondary" />
              </ListItemIcon>
              <ListItemText primary={wheel.name} secondary={wheel.category} />
            </ListItemButton>
          ))}
        </List>
      )}
    </DashboardSectionCard>
  );
}
