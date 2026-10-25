import { Box, Button, useTheme } from '@mui/material';
import { useMemo } from 'react';

import { EmptyState } from '@/components/feedback/EmptyState';
import { SPIN_MESSAGES } from '@/features/spin/constants';
import { buildWheelGeometry } from '@/features/spin/utils/wheelGeometry';
import type { WheelItem } from '@/types/wheel';

interface SpinWheelProps {
  items: WheelItem[];
  onSpin?: () => void;
  spinning?: boolean;
}

export function SpinWheel({ items, onSpin, spinning = false }: SpinWheelProps) {
  const theme = useTheme();
  const geometry = useMemo(() => buildWheelGeometry(items), [items]);

  if (geometry.segments.length === 0) {
    return (
      <EmptyState
        titleComponent="h2"
        title={SPIN_MESSAGES.emptyTitle}
        description={SPIN_MESSAGES.emptyDescription}
      />
    );
  }

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
      <Box sx={{ position: 'relative', width: '100%', aspectRatio: '1' }}>
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
          <circle
            cx={geometry.hub.cx}
            cy={geometry.hub.cy}
            r={geometry.hub.r}
            fill={theme.palette.background.paper}
          />
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
            fontSize: { xs: '0.8rem', sm: '0.95rem' },
          }}
        >
          Spin
        </Button>
      </Box>
    </Box>
  );
}
