import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Stack,
  Typography,
} from '@mui/material';

import { FavoriteStarButton } from '@/features/dashboard/components/FavoriteStarButton';
import { getWheelCategory } from '@/features/dashboard/utils/selectDashboardData';
import type { Wheel, WheelId } from '@/types/wheel';

interface WheelCardProps {
  wheel: Wheel;
  isFavorite: boolean;
  onOpen: (wheelId: WheelId) => void;
  onEdit: (wheelId: WheelId) => void;
  onDelete: (wheelId: WheelId) => void;
  onToggleFavorite: (wheelId: WheelId) => void;
  onExport: (wheelId: WheelId) => void;
  onShare: (wheelId: WheelId) => void;
}

export function WheelCard({
  wheel,
  isFavorite,
  onOpen,
  onEdit,
  onDelete,
  onToggleFavorite,
  onExport,
  onShare,
}: WheelCardProps) {
  return (
    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" component="h3" noWrap>
              {wheel.name}
            </Typography>
            <Chip label={getWheelCategory(wheel)} size="small" sx={{ mt: 1 }} />
          </Box>
          <FavoriteStarButton
            name={wheel.name}
            isFavorite={isFavorite}
            onToggle={() => onToggleFavorite(wheel.id)}
          />
        </Stack>
        <Typography color="text.secondary" sx={{ mt: 1.5 }} variant="body2">
          {wheel.description?.trim() || 'No description'}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }} variant="caption">
          {wheel.items.length} {wheel.items.length === 1 ? 'item' : 'items'}
        </Typography>
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Button
          variant="contained"
          size="small"
          startIcon={<PlayArrowIcon />}
          aria-label={`Open ${wheel.name}`}
          onClick={() => onOpen(wheel.id)}
        >
          Open
        </Button>
        <Button
          size="small"
          startIcon={<EditOutlinedIcon />}
          aria-label={`Edit ${wheel.name}`}
          onClick={() => onEdit(wheel.id)}
        >
          Edit
        </Button>
        <Button
          size="small"
          startIcon={<FileDownloadOutlinedIcon />}
          aria-label={`Export ${wheel.name}`}
          onClick={() => onExport(wheel.id)}
        >
          Export
        </Button>
        <Button
          size="small"
          startIcon={<ShareOutlinedIcon />}
          aria-label={`Share ${wheel.name}`}
          onClick={() => onShare(wheel.id)}
        >
          Share
        </Button>
        <Button
          size="small"
          color="error"
          startIcon={<DeleteOutlinedIcon />}
          aria-label={`Delete ${wheel.name}`}
          onClick={() => onDelete(wheel.id)}
        >
          Delete
        </Button>
      </CardActions>
    </Card>
  );
}
