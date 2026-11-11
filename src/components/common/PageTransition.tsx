import { Box } from '@mui/material';
import type { ReactNode } from 'react';

import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <Box
      sx={
        prefersReducedMotion
          ? undefined
          : {
              animation: 'spinflow-page-enter 200ms ease-out',
              '@keyframes spinflow-page-enter': {
                from: { opacity: 0, transform: 'translateY(8px)' },
                to: { opacity: 1, transform: 'translateY(0)' },
              },
              '@media (prefers-reduced-motion: reduce)': {
                animation: 'none',
              },
            }
      }
    >
      {children}
    </Box>
  );
}
