import { Box, Stack, Typography } from '@mui/material';

import { SPIN_MESSAGES } from '@/features/spin/constants';
import {
  selectionPathNames,
  type SelectionStep,
} from '@/features/spin/utils/selectionPath';

interface SelectionPathProps {
  steps: readonly SelectionStep[];
  id?: string;
  size?: 'dialog' | 'screen' | 'result';
}

export function SelectionPath({ steps, id, size = 'screen' }: SelectionPathProps) {
  if (steps.length === 0) {
    return null;
  }

  const names = selectionPathNames(steps);
  const emphasizeLeaf = size === 'dialog' || size === 'result';

  return (
    <Stack
      id={id}
      component="ol"
      spacing={0.5}
      alignItems="center"
      aria-label={id ? undefined : SPIN_MESSAGES.pathLabel(names)}
      sx={{ listStyle: 'none', m: 0, p: 0 }}
    >
      {steps.map((step, index) => {
        const isLeaf = index === steps.length - 1;

        return (
          <Stack key={step.id} component="li" spacing={0.5} alignItems="center">
            {index > 0 ? (
              <Typography aria-hidden variant="body2" color="text.secondary" sx={{ lineHeight: 1 }}>
                ↓
              </Typography>
            ) : null}
            <Typography
              variant={isLeaf && emphasizeLeaf ? 'h4' : 'body1'}
              component="p"
              color={isLeaf ? 'text.primary' : 'text.secondary'}
              aria-current={isLeaf ? 'true' : undefined}
              sx={{
                fontWeight: isLeaf ? 700 : 500,
                textAlign: 'center',
                fontSize: isLeaf && size === 'result' ? { xs: '1.5rem', sm: '2.125rem' } : undefined,
              }}
            >
              {step.icon ? (
                <Box component="span" aria-hidden sx={{ mr: 0.75 }}>
                  {step.icon}
                </Box>
              ) : null}
              {step.name}
            </Typography>
          </Stack>
        );
      })}
    </Stack>
  );
}
