import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import { List, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';

import { DashboardSectionCard } from '@/features/dashboard/components/DashboardSectionCard';
import { formatDateTime } from '@/features/dashboard/utils/formatDateTime';
import type { RecentResult } from '@/features/dashboard/utils/selectDashboardData';
import type { WheelId } from '@/types/wheel';

interface RecentResultsCardProps {
  results: RecentResult[];
  onOpen: (wheelId: WheelId) => void;
}

export function RecentResultsCard({ results, onOpen }: RecentResultsCardProps) {
  return (
    <DashboardSectionCard title="Recently selected results">
      {results.length === 0 ? (
        <Typography color="text.secondary">No selected results yet.</Typography>
      ) : (
        <List disablePadding>
          {results.map((result) => (
            <ListItemButton
              key={result.id}
              disableGutters
              onClick={() => onOpen(result.wheelId)}
              aria-label={`Open result ${result.itemName}`}
              sx={{ p: 0 }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <EmojiEventsOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={result.itemName}
                secondary={`${result.wheelName} · ${formatDateTime(result.spunAt)}`}
              />
            </ListItemButton>
          ))}
        </List>
      )}
    </DashboardSectionCard>
  );
}
