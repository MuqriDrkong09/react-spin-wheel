import { Stack, Typography } from '@mui/material';

import { SPIN_MESSAGES } from '@/features/spin/constants';
import {
  selectionPathNames,
  type SelectionStep,
} from '@/features/spin/utils/selectionPath';

interface SelectionPathProps {
  steps: readonly SelectionStep[];
  id?: string;
  size?: 'dialog' | 'screen';
}

export function SelectionPath({ steps, id, size = 'screen' }: SelectionPathProps) {
  if (steps.length === 0) {
    return null;
  }

  const names = selectionPathNames(steps);

  return (
    <Stack
      id={id}
      spacing={0.5}
      alignItems="center"
      aria-label={id ? undefined : SPIN_MESSAGES.pathLabel(names)}
    >
      {steps.map((step, index) => {
        const isLeaf = index === steps.length - 1;

        return (
          <Stack key={step.id} spacing={0.5} alignItems="center">
            {index > 0 ? (
              <Typography aria-hidden variant="body2" color="text.secondary" sx={{ lineHeight: 1 }}>
                ↓
              </Typography>
            ) : null}
            <Typography
              variant={isLeaf && size === 'dialog' ? 'h4' : 'body1'}
              component="p"
              color={isLeaf ? 'text.primary' : 'text.secondary'}
              sx={{ fontWeight: isLeaf ? 700 : 500, textAlign: 'center' }}
            >
              {step.name}
            </Typography>
          </Stack>
        );
      })}
    </Stack>
  );
}
