import { Box, Button, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import { useMemo } from 'react';

import { EmptyState } from '@/components/feedback/EmptyState';
import {
  DEFAULT_SPIN_ANIMATION,
  SPIN_EASINGS,
  SPIN_MESSAGES,
  type SpinAnimationType,
} from '@/features/spin/constants';
import { buildWheelGeometry } from '@/features/spin/utils/wheelGeometry';
import type { WheelItem } from '@/types/wheel';

interface SpinWheelProps {
  items: WheelItem[];
  onSpin?: () => void;
  spinning?: boolean;
  selectedColor?: string;
  rotationDegrees?: number;
  spinDuration?: number;
  animationType?: SpinAnimationType;
  reducedMotion?: boolean;
  onSpinComplete?: () => void;
}

export function SpinWheel({
  items,
  onSpin,
  spinning = false,
  selectedColor,
  rotationDegrees = 0,
  spinDuration = DEFAULT_SPIN_ANIMATION.spinDuration,
  animationType = DEFAULT_SPIN_ANIMATION.animationType,
  reducedMotion = false,
  onSpinComplete,
}: SpinWheelProps) {
  const theme = useTheme();
  const geometry = useMemo(() => buildWheelGeometry(items), [items]);
  const hubColor = selectedColor ?? theme.palette.primary.main;
  const hubContrast = theme.palette.getContrastText(hubColor);
  const duration = reducedMotion ? 0 : spinDuration / 1000;
  const ease = [...(SPIN_EASINGS[animationType] ?? SPIN_EASINGS.easeInOut)] as [
    number,
    number,
    number,
    number,
  ];

  if (geometry.segments.length === 0) {
    return (
      <EmptyState
        titleComponent="h2"
        title={SPIN_MESSAGES.emptyTitle}
        description={SPIN_MESSAGES.emptyDescription}
      />
    );
  }

  const disc = (
    <>
      <defs>
        {geometry.segments.map((segment) => (
          <clipPath key={segment.clipPathId} id={segment.clipPathId}>
            <path d={segment.path} />
          </clipPath>
        ))}
      </defs>
      {geometry.segments.map((segment) => (
        <g key={segment.id}>
          <path
            d={segment.path}
            fill={segment.color}
            stroke={theme.palette.background.paper}
            strokeWidth={1}
            title={segment.labelText}
          >
            <title>{segment.labelText}</title>
          </path>
          {segment.showLabel ? (
            <g clipPath={`url(#${segment.clipPathId})`}>
              <text
                fill={segment.labelFill}
                fontSize={segment.labelFontSize}
                fontWeight={600}
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`translate(${segment.labelX} ${segment.labelY}) rotate(${segment.labelRotation})`}
              >
                {segment.labelLines.map((line) => (
                  <tspan key={`${segment.id}-${line.y}`} x={0} y={line.y}>
                    {line.text}
                  </tspan>
                ))}
              </text>
            </g>
          ) : null}
        </g>
      ))}
      <circle cx={geometry.hub.cx} cy={geometry.hub.cy} r={geometry.hub.r} fill={hubColor} />
    </>
  );

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        maxWidth: { xs: 320, sm: 420, md: 520 },
        mx: 'auto',
        flexShrink: 0,
      }}
    >
      <Box
        sx={{ position: 'relative', width: '100%', aspectRatio: '1' }}
        aria-busy={spinning}
        aria-live="polite"
      >
        <motion.div
          initial={false}
          animate={{ rotate: rotationDegrees }}
          transition={{ duration, ease }}
          onAnimationComplete={() => {
            if (spinning) {
              onSpinComplete?.();
            }
          }}
          style={{ width: '100%', height: '100%', transformOrigin: '50% 50%' }}
        >
          <Box
            component="svg"
            viewBox={`0 0 ${geometry.size} ${geometry.size}`}
            role="img"
            aria-label={SPIN_MESSAGES.wheelLabel(geometry.segments.map((segment) => segment.name))}
            sx={{
              display: 'block',
              width: '100%',
              height: '100%',
              fontFamily: 'inherit',
            }}
          >
            {disc}
          </Box>
        </motion.div>
        <Box
          component="svg"
          viewBox={`0 0 ${geometry.size} ${geometry.size}`}
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            overflow: 'visible',
          }}
        >
          <polygon
            points={geometry.pointer.points}
            fill={theme.palette.primary.main}
            title={SPIN_MESSAGES.pointerTitle}
          >
            <title>{SPIN_MESSAGES.pointerTitle}</title>
          </polygon>
        </Box>
        <Button
          type="button"
          variant="contained"
          onClick={onSpin}
          disabled={spinning}
          aria-label={SPIN_MESSAGES.spinButton}
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: `${geometry.centerButtonPercent}%`,
            height: `${geometry.centerButtonPercent}%`,
            minWidth: 0,
            p: 0,
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1,
            fontSize: { xs: '0.7rem', sm: '0.8rem' },
            bgcolor: hubColor,
            color: hubContrast,
            boxShadow: 'none',
            '&:hover': {
              bgcolor: hubColor,
              boxShadow: 'none',
            },
            '&.Mui-disabled': {
              bgcolor: hubColor,
              color: hubContrast,
              opacity: 0.7,
            },
          }}
        >
          Spin
        </Button>
      </Box>
    </Box>
  );
}
