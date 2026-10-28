import { Box, Button } from '@mui/material';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef } from 'react';

import { EmptyState } from '@/components/feedback/EmptyState';
import { WHEEL_SIZE_MAX_WIDTH } from '@/constants/wheelAppearance';
import {
  DEFAULT_SPIN_ANIMATION,
  SPIN_EASINGS,
  SPIN_MESSAGES,
  type SpinAnimationType,
} from '@/features/spin/constants';
import { useSpinSounds } from '@/features/spin/hooks/useSpinSounds';
import { spinDiscDurationSeconds } from '@/features/spin/utils/spinAnimation';
import { buildWheelGeometry } from '@/features/spin/utils/wheelGeometry';
import { resolveAppearance } from '@/features/wheel-customization/utils/appearance';
import { CENTER_BUTTON_STYLE, type WheelAppearance, type WheelItem } from '@/types/wheel';

interface SpinWheelProps {
  items: WheelItem[];
  appearance?: Partial<WheelAppearance>;
  onSpin?: () => void;
  spinning?: boolean;
  rotationDegrees?: number;
  spinDuration?: number;
  animationType?: SpinAnimationType;
  reducedMotion?: boolean;
  soundEnabled?: boolean;
  onSpinComplete?: () => void;
}

export function SpinWheel({
  items,
  appearance: appearanceInput,
  onSpin,
  spinning = false,
  rotationDegrees = 0,
  spinDuration = DEFAULT_SPIN_ANIMATION.spinDuration,
  animationType = DEFAULT_SPIN_ANIMATION.animationType,
  reducedMotion = false,
  soundEnabled = true,
  onSpinComplete,
}: SpinWheelProps) {
  const appearance = useMemo(() => resolveAppearance(appearanceInput), [appearanceInput]);
  const geometry = useMemo(
    () =>
      buildWheelGeometry(items, undefined, {
        appearance: {
          segmentColors: appearance.segmentColors,
          textColor: appearance.textColor,
          fontSize: appearance.fontSize,
        },
      }),
    [appearance.fontSize, appearance.segmentColors, appearance.textColor, items],
  );
  const hubColor =
    appearance.centerButtonStyle === CENTER_BUTTON_STYLE.filled
      ? appearance.centerButtonColor
      : appearance.background;
  const duration = spinDiscDurationSeconds(spinDuration, { reducedMotion, spinning });
  const spinStartedAtRef = useRef<number | null>(null);
  const sounds = useSpinSounds({
    enabled: soundEnabled,
    spinning,
    segments: geometry.segments,
  });
  const ease = [...(SPIN_EASINGS[animationType] ?? SPIN_EASINGS.easeInOut)] as [
    number,
    number,
    number,
    number,
  ];

  useEffect(() => {
    spinStartedAtRef.current = spinning ? performance.now() : null;
  }, [spinning]);

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
            stroke={appearance.borderWidth > 0 ? appearance.borderColor : 'none'}
            strokeWidth={appearance.borderWidth}
            title={segment.labelText}
          >
            <title>{segment.labelText}</title>
          </path>
          {segment.showLabel ? (
            <g clipPath={`url(#${segment.clipPathId})`}>
              <text
                fill={segment.labelFill}
                fontSize={segment.labelFontSize}
                fontWeight={appearance.fontWeight}
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
        maxWidth: WHEEL_SIZE_MAX_WIDTH[appearance.size],
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
          onUpdate={(latest) => {
            if (typeof latest.rotate === 'number') {
              sounds.handleRotationFrame(latest.rotate);
            }
          }}
          onAnimationComplete={() => {
            if (!spinning) {
              return;
            }

            const startedAt = spinStartedAtRef.current;
            const minSpinMs =
              reducedMotion || duration <= 0 ? 0 : Math.max(32, Math.min(120, spinDuration * 0.05));
            if (minSpinMs > 0 && (startedAt == null || performance.now() - startedAt < minSpinMs)) {
              return;
            }

            sounds.handleSpinSettled();
            onSpinComplete?.();
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
            fill={appearance.pointerColor}
            title={SPIN_MESSAGES.pointerTitle}
          >
            <title>{SPIN_MESSAGES.pointerTitle}</title>
          </polygon>
        </Box>
        <Button
          type="button"
          variant={centerButtonVariant(appearance.centerButtonStyle)}
          onClick={() => {
            sounds.handleSpinPress();
            onSpin?.();
          }}
          disabled={spinning}
          aria-label={SPIN_MESSAGES.spinButton}
          sx={centerButtonSx(appearance, geometry.centerButtonPercent, hubColor)}
        >
          Spin
        </Button>
      </Box>
    </Box>
  );
}

function centerButtonVariant(style: WheelAppearance['centerButtonStyle']) {
  if (style === CENTER_BUTTON_STYLE.outlined) {
    return 'outlined' as const;
  }

  if (style === CENTER_BUTTON_STYLE.ghost) {
    return 'text' as const;
  }

  return 'contained' as const;
}

function centerButtonSx(
  appearance: WheelAppearance,
  percent: number,
  hubColor: string,
) {
  const filled = appearance.centerButtonStyle === CENTER_BUTTON_STYLE.filled;
  const bgcolor = filled ? appearance.centerButtonColor : 'transparent';
  const color = filled ? appearance.centerButtonTextColor : appearance.centerButtonColor;

  return {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    width: `${percent}%`,
    height: `${percent}%`,
    minWidth: 0,
    p: 0,
    borderRadius: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 1,
    fontSize: { xs: '0.7rem', sm: '0.8rem' },
    fontWeight: appearance.fontWeight,
    bgcolor,
    color,
    boxShadow: 'none',
    borderColor: appearance.centerButtonColor,
    '&:hover': {
      bgcolor: filled ? hubColor : 'transparent',
      boxShadow: 'none',
      borderColor: appearance.centerButtonColor,
    },
    '&.Mui-disabled': {
      bgcolor,
      color,
      opacity: 0.7,
      borderColor: appearance.centerButtonColor,
    },
  };
}
