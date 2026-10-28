import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ReplayIcon from '@mui/icons-material/Replay';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SaveIcon from '@mui/icons-material/Save';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

import { useSound } from '@/features/sound/useSound';
import { SelectionPath } from '@/features/spin/components/SelectionPath';
import { SPIN_MESSAGES } from '@/features/spin/constants';
import { formatResultTimestamp } from '@/features/spin/utils/formatFinalResult';
import type { SelectionStep } from '@/features/spin/utils/selectionPath';
import { SOUND_ID } from '@/types/sound';

interface FinalResultProps {
  wheelName: string;
  steps: readonly SelectionStep[];
  timestamp: string;
  reducedMotion?: boolean;
  saved?: boolean;
  statusMessage?: string;
  soundEnabled?: boolean;
  onSpinAgain: () => void;
  onStartNewSelection: () => void;
  onCopy: () => void;
  onSave: () => void;
}

export function FinalResult({
  wheelName,
  steps,
  timestamp,
  reducedMotion = false,
  saved = false,
  statusMessage,
  soundEnabled = true,
  onSpinAgain,
  onStartNewSelection,
  onCopy,
  onSave,
}: FinalResultProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { play } = useSound();
  const playRef = useRef(play);
  const formattedTime = formatResultTimestamp(timestamp);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    playRef.current = play;
  }, [play]);

  useEffect(() => {
    if (soundEnabled) {
      playRef.current(SOUND_ID.celebration);
    }
  }, [soundEnabled]);

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        minHeight: 0,
        px: { xs: 0.5, sm: 2 },
      }}
    >
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.32, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: '100%', maxWidth: 480 }}
      >
        <Paper
          component="section"
          elevation={0}
          aria-labelledby="final-result-title"
          aria-describedby="final-result-wheel final-result-path final-result-time"
          sx={{
            width: '100%',
            px: { xs: 2.5, sm: 4 },
            py: { xs: 3, sm: 4 },
            borderRadius: 3,
            border: 1,
            borderColor: 'divider',
            textAlign: 'center',
          }}
        >
          <Typography
            ref={headingRef}
            id="final-result-title"
            tabIndex={-1}
            variant="h5"
            component="h2"
            sx={{ fontWeight: 800, letterSpacing: 0.4, outline: 'none' }}
          >
            {SPIN_MESSAGES.finalResultTitle}
          </Typography>
          <Typography id="final-result-wheel" color="text.secondary" sx={{ mt: 0.75 }}>
            {wheelName}
          </Typography>
          <Box id="final-result-path" sx={{ mt: { xs: 2.5, sm: 3 } }}>
            <SelectionPath steps={steps} size="result" />
          </Box>
          <Typography
            id="final-result-time"
            component="time"
            dateTime={timestamp}
            color="text.secondary"
            variant="body2"
            sx={{ display: 'block', mt: 2.5 }}
          >
            {formattedTime}
          </Typography>
          <Stack
            spacing={1}
            sx={{
              mt: { xs: 3, sm: 3.5 },
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 1,
            }}
          >
            <Button variant="contained" startIcon={<ReplayIcon />} onClick={onSpinAgain}>
              {SPIN_MESSAGES.spinAgain}
            </Button>
            <Button variant="outlined" startIcon={<RestartAltIcon />} onClick={onStartNewSelection}>
              {SPIN_MESSAGES.startNewSelection}
            </Button>
            <Button variant="outlined" startIcon={<ContentCopyIcon />} onClick={onCopy}>
              {SPIN_MESSAGES.copyResult}
            </Button>
            <Button
              variant="outlined"
              startIcon={<SaveIcon />}
              onClick={onSave}
              disabled={saved}
              aria-label={saved ? SPIN_MESSAGES.resultSaved : SPIN_MESSAGES.saveResult}
            >
              {saved ? SPIN_MESSAGES.resultSaved : SPIN_MESSAGES.saveResult}
            </Button>
          </Stack>
          <Typography
            component="p"
            aria-live="polite"
            sx={{
              position: 'absolute',
              width: 1,
              height: 1,
              p: 0,
              m: -1,
              overflow: 'hidden',
              clip: 'rect(0, 0, 0, 0)',
              whiteSpace: 'nowrap',
              border: 0,
            }}
          >
            {statusMessage}
          </Typography>
        </Paper>
      </motion.div>
    </Box>
  );
}
