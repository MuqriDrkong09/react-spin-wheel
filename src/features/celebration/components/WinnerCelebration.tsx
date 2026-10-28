import { Box } from '@mui/material';
import { motion } from 'framer-motion';
import { useEffect, useRef, type ReactNode } from 'react';

import { ConfettiBurst } from '@/features/celebration/components/ConfettiBurst';
import { useSound } from '@/features/sound/useSound';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { useSettingsStore } from '@/stores/settingsStore';
import { SOUND_ID } from '@/types/sound';

interface WinnerCelebrationProps {
  children: ReactNode;
  enabled?: boolean;
  soundEnabled?: boolean;
  reducedMotion?: boolean;
}

export function WinnerCelebration({
  children,
  enabled = true,
  soundEnabled = true,
  reducedMotion = false,
}: WinnerCelebrationProps) {
  const confettiEnabled = useSettingsStore((state) => state.settings.confettiEnabled);
  const prefersReducedMotion = usePrefersReducedMotion();
  const reduceMotion = reducedMotion || prefersReducedMotion;
  const showVisuals = enabled && confettiEnabled && !reduceMotion;
  const { play } = useSound();
  const playRef = useRef(play);

  useEffect(() => {
    playRef.current = play;
  }, [play]);

  useEffect(() => {
    if (soundEnabled) {
      playRef.current(SOUND_ID.celebration);
    }
  }, [soundEnabled]);

  return (
    <Box sx={{ position: 'relative', width: '100%', maxWidth: 480 }}>
      <motion.div
        initial={
          reduceMotion ? false : showVisuals ? { opacity: 0, scale: 0.86, y: 28 } : { opacity: 0, y: 16 }
        }
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : showVisuals
              ? { type: 'spring', stiffness: 280, damping: 16 }
              : { duration: 0.32, ease: [0.16, 1, 0.3, 1] }
        }
        style={{ position: 'relative', zIndex: 1, width: '100%' }}
      >
        {children}
      </motion.div>
      <ConfettiBurst active={showVisuals} />
    </Box>
  );
}
