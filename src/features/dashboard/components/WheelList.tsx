import { Box } from '@mui/material';

import { WheelCard } from '@/features/dashboard/components/WheelCard';
import type { Wheel, WheelId } from '@/types/wheel';

interface WheelListProps {
  wheels: Wheel[];
  favoriteWheelIds: WheelId[];
  onOpen: (wheelId: WheelId) => void;
  onEdit: (wheelId: WheelId) => void;
  onDelete: (wheelId: WheelId) => void;
  onToggleFavorite: (wheelId: WheelId) => void;
}

export function WheelList({
  wheels,
  favoriteWheelIds,
  onOpen,
  onEdit,
  onDelete,
  onToggleFavorite,
}: WheelListProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(3, minmax(0, 1fr))' },
      }}
    >
      {wheels.map((wheel) => (
        <WheelCard
          key={wheel.id}
          wheel={wheel}
          isFavorite={favoriteWheelIds.includes(wheel.id)}
          onOpen={onOpen}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </Box>
  );
}
