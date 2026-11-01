import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { IconButton } from '@mui/material';

interface FavoriteStarButtonProps {
  name: string;
  isFavorite: boolean;
  onToggle: () => void;
}

export function FavoriteStarButton({ name, isFavorite, onToggle }: FavoriteStarButtonProps) {
  return (
    <IconButton
      type="button"
      aria-label={isFavorite ? `Remove ${name} from favorites` : `Add ${name} to favorites`}
      aria-pressed={isFavorite}
      onClick={onToggle}
      color={isFavorite ? 'warning' : 'default'}
    >
      {isFavorite ? <StarIcon /> : <StarBorderIcon />}
    </IconButton>
  );
}
