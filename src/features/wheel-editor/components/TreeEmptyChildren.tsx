import AddIcon from '@mui/icons-material/Add';
import { Button, Stack, Typography } from '@mui/material';

import { EDITOR_MESSAGES } from '@/features/wheel-editor/constants';

interface TreeEmptyChildrenProps {
  name: string;
  onAddChild: () => void;
}

export function TreeEmptyChildren({ name, onAddChild }: TreeEmptyChildrenProps) {
  return (
    <Stack spacing={1} sx={{ py: 1.5, pr: 1 }}>
      <Typography color="text.secondary" variant="body2">
        {EDITOR_MESSAGES.emptyChildren(name)}
      </Typography>
      <Button
        size="small"
        startIcon={<AddIcon />}
        aria-label={`Add child to ${name}`}
        onClick={onAddChild}
        sx={{ alignSelf: 'flex-start' }}
      >
        Add Child
      </Button>
    </Stack>
  );
}
