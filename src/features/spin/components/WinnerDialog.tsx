import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from '@mui/material';
import { motion } from 'framer-motion';

import { SPIN_MESSAGES } from '@/features/spin/constants';
import { isWheelItemBranch, type WheelItem } from '@/types/wheel';

interface WinnerDialogProps {
  open: boolean;
  item?: WheelItem;
  reducedMotion?: boolean;
  onClose: () => void;
  onFinish: () => void;
  onSpinAgain: () => void;
  onSpinChild: () => void;
}

export function WinnerDialog({
  open,
  item,
  reducedMotion = false,
  onClose,
  onFinish,
  onSpinAgain,
  onSpinChild,
}: WinnerDialogProps) {
  const hasChildren = item ? isWheelItemBranch(item) : false;
  const extraId = hasChildren ? 'winner-dialog-extra' : undefined;

  return (
    <Dialog
      open={open && Boolean(item)}
      onClose={onClose}
      transitionDuration={0}
      closeAfterTransition={false}
      fullWidth
      maxWidth="xs"
      aria-labelledby="winner-dialog-title"
      aria-describedby={extraId ? `winner-dialog-name ${extraId}` : 'winner-dialog-name'}
    >
      {item ? (
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, scale: 0.88, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            duration: reducedMotion ? 0 : 0.32,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          <DialogTitle id="winner-dialog-title" sx={{ textAlign: 'center', pb: 1 }}>
            {SPIN_MESSAGES.winnerTitle}
          </DialogTitle>
          <DialogContent sx={{ textAlign: 'center' }}>
            {item.icon ? (
              <Typography aria-hidden sx={{ fontSize: '2rem', lineHeight: 1, mb: 1 }}>
                {item.icon}
              </Typography>
            ) : null}
            <Typography id="winner-dialog-name" variant="h4" component="p" sx={{ fontWeight: 700 }}>
              {item.name}
            </Typography>
            {hasChildren ? (
              <DialogContentText id="winner-dialog-extra" sx={{ mt: 1.5 }}>
                {SPIN_MESSAGES.additionalData}
              </DialogContentText>
            ) : null}
          </DialogContent>
          <DialogActions
            disableSpacing
            sx={{
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'center',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1,
              px: 3,
              pb: 2.5,
              '& > :not(style)': { m: 0, width: { xs: '100%', sm: 'auto' } },
            }}
          >
            {hasChildren ? (
              <>
                <Button variant="contained" autoFocus onClick={onSpinChild}>
                  {SPIN_MESSAGES.spinChild}
                </Button>
                <Button variant="outlined" onClick={onFinish}>
                  {SPIN_MESSAGES.finish}
                </Button>
                <Button onClick={onClose}>{SPIN_MESSAGES.close}</Button>
              </>
            ) : (
              <>
                <Button variant="outlined" onClick={onFinish}>
                  {SPIN_MESSAGES.finish}
                </Button>
                <Button variant="contained" autoFocus onClick={onSpinAgain}>
                  {SPIN_MESSAGES.spinAgain}
                </Button>
              </>
            )}
          </DialogActions>
        </motion.div>
      ) : null}
    </Dialog>
  );
}
