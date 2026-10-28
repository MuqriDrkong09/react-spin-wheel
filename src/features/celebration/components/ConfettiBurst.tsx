import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { useMemo } from 'react';

import { CELEBRATION_PIECE_COUNT } from '@/features/celebration/constants';
import { createConfettiPieces } from '@/features/celebration/utils/createConfettiPieces';

interface ConfettiBurstProps {
  active: boolean;
}

export function ConfettiBurst({ active }: ConfettiBurstProps) {
  const theme = useTheme();
  const pieces = useMemo(() => {
    const colors = [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.error.main,
    ];
    return createConfettiPieces(CELEBRATION_PIECE_COUNT, colors);
  }, [
    theme.palette.error.main,
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
  ]);

  if (!active) {
    return null;
  }

  return (
    <Box
      aria-hidden
      data-testid="celebration-confetti"
      sx={{
        position: 'absolute',
        inset: '-20px -8px -96px',
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 2,
      }}
    >
      {pieces.map((piece) => (
        <Box
          key={piece.id}
          component={motion.div}
          initial={{ y: -16, opacity: 1, rotate: 0, x: 0 }}
          animate={{ y: 420, opacity: 0, rotate: piece.rotate, x: piece.drift }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            ease: 'easeOut',
          }}
          sx={{
            position: 'absolute',
            top: 0,
            left: piece.left,
            width: piece.width,
            height: piece.height,
            bgcolor: piece.color,
            borderRadius: 0.5,
          }}
        />
      ))}
    </Box>
  );
}
