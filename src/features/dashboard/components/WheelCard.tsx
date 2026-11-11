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
  IconButton,
  Stack,
  Tooltip,
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

function WheelSegmentPreview({ wheel }: { wheel: Wheel }) {
  const colors = wheel.items.slice(0, 8).map((item) => item.color);
  const stops =
    colors.length === 0
      ? 'var(--mui-palette-divider)'
      : colors
          .map((color, index) => {
            const start = (index / colors.length) * 100;
            const end = ((index + 1) / colors.length) * 100;
            return `${color} ${start}% ${end}%`;
          })
          .join(', ');

  return (
    <Box
      aria-hidden
      sx={{
        height: 8,
        borderRadius: 1,
        mb: 2,
        background: `linear-gradient(90deg, ${stops})`,
      }}
    />
  );
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
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: (theme) =>
          theme.transitions.create(['border-color', 'transform'], {
            duration: theme.transitions.duration.shorter,
          }),
        '&:hover': {
          borderColor: 'primary.main',
        },
        '@media (prefers-reduced-motion: reduce)': {
          transition: 'none',
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1.5 }}>
        <WheelSegmentPreview wheel={wheel} />
        <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" component="h3" noWrap>
              {wheel.name}
            </Typography>
            <Chip label={getWheelCategory(wheel)} size="small" variant="outlined" sx={{ mt: 1 }} />
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
      <CardActions
        sx={{
          px: 2,
          pb: 2,
          pt: 0,
          gap: 0.5,
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          '& .MuiButton-root': { minHeight: 40 },
        }}
      >
        <Button
          variant="contained"
          size="small"
          startIcon={<PlayArrowIcon />}
          aria-label={`Open ${wheel.name}`}
          onClick={() => onOpen(wheel.id)}
        >
          Open
        </Button>
        <Stack direction="row" spacing={0.25}>
          <Tooltip title="Edit">
            <IconButton size="small" aria-label={`Edit ${wheel.name}`} onClick={() => onEdit(wheel.id)}>
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export">
            <IconButton
              size="small"
              aria-label={`Export ${wheel.name}`}
              onClick={() => onExport(wheel.id)}
            >
              <FileDownloadOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Share">
            <IconButton
              size="small"
              aria-label={`Share ${wheel.name}`}
              onClick={() => onShare(wheel.id)}
            >
              <ShareOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              color="error"
              aria-label={`Delete ${wheel.name}`}
              onClick={() => onDelete(wheel.id)}
            >
              <DeleteOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </CardActions>
    </Card>
  );
}
