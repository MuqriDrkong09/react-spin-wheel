import { List, ListItem, ListItemButton, ListItemText, Typography } from '@mui/material';

import { DashboardSectionCard } from '@/features/dashboard/components/DashboardSectionCard';
import { FavoriteStarButton } from '@/features/dashboard/components/FavoriteStarButton';
import type { Wheel, WheelId } from '@/types/wheel';

interface FavoriteWheelsCardProps {
  wheels: Wheel[];
  onOpen: (wheelId: WheelId) => void;
  onToggleFavorite: (wheelId: WheelId) => void;
}

export function FavoriteWheelsCard({ wheels, onOpen, onToggleFavorite }: FavoriteWheelsCardProps) {
  return (
    <DashboardSectionCard title="Favorite wheels">
      {wheels.length === 0 ? (
        <Typography color="text.secondary">No favorite wheels yet.</Typography>
      ) : (
        <List disablePadding>
          {wheels.map((wheel) => (
            <ListItem
              key={wheel.id}
              disablePadding
              secondaryAction={
                <FavoriteStarButton
                  name={wheel.name}
                  isFavorite
                  onToggle={() => onToggleFavorite(wheel.id)}
                />
              }
            >
              <ListItemButton
                onClick={() => onOpen(wheel.id)}
                aria-label={`Open favorite ${wheel.name}`}
                sx={{ py: 0.5, pl: 0, pr: 7 }}
              >
                <ListItemText primary={wheel.name} secondary={wheel.category} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      )}
    </DashboardSectionCard>
  );
}
