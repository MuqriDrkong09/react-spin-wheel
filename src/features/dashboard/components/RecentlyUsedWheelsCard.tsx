import HistoryIcon from '@mui/icons-material/History';
import { List, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';

import { DashboardSectionCard } from '@/features/dashboard/components/DashboardSectionCard';
import { formatDateTime } from '@/features/dashboard/utils/formatDateTime';
import type { RecentWheelUsage } from '@/features/dashboard/utils/selectDashboardData';
import type { WheelId } from '@/types/wheel';

interface RecentlyUsedWheelsCardProps {
  wheels: RecentWheelUsage[];
  onOpen: (wheelId: WheelId) => void;
}

export function RecentlyUsedWheelsCard({ wheels, onOpen }: RecentlyUsedWheelsCardProps) {
  return (
    <DashboardSectionCard title="Recently used wheels">
      {wheels.length === 0 ? (
        <Typography color="text.secondary">No recently used wheels yet.</Typography>
      ) : (
        <List disablePadding>
          {wheels.map(({ wheel, lastUsedAt }) => (
            <ListItemButton
              key={wheel.id}
              disableGutters
              onClick={() => onOpen(wheel.id)}
              aria-label={`Open recently used ${wheel.name}`}
              sx={{ p: 0 }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <HistoryIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={wheel.name} secondary={formatDateTime(lastUsedAt)} />
            </ListItemButton>
          ))}
        </List>
      )}
    </DashboardSectionCard>
  );
}
