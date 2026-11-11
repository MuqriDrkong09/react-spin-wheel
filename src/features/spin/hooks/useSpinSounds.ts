import { useCallback, useEffect, useRef } from 'react';

import { useSound } from '@/features/sound/useSound';
import { degreesToRadians, pointerSegmentIndex } from '@/features/spin/utils/pointerSegmentIndex';
import { SOUND_ID } from '@/types/sound';

interface AngleSpan {
  startAngle: number;
  endAngle: number;
}

interface UseSpinSoundsOptions {
  enabled: boolean;
  spinning: boolean;
  segments: readonly AngleSpan[];
}

export function useSpinSounds({ enabled, spinning, segments }: UseSpinSoundsOptions) {
  const { play } = useSound();
  const lastSegmentRef = useRef<number | null>(null);
  const enabledRef = useRef(enabled);
  const spinningRef = useRef(spinning);
  const segmentsRef = useRef(segments);

  enabledRef.current = enabled;
  spinningRef.current = spinning;
  segmentsRef.current = segments;

  useEffect(() => {
    if (!spinning) {
      lastSegmentRef.current = null;
    }
  }, [spinning]);

  const handleSpinPress = useCallback(() => {
    if (!enabledRef.current) {
      return;
    }

    play(SOUND_ID.spinStart);
  }, [play]);

  const handleRotationFrame = useCallback(
    (rotationDegrees: number) => {
      if (!enabledRef.current || !spinningRef.current) {
        return;
      }

      const index = pointerSegmentIndex(degreesToRadians(rotationDegrees), segmentsRef.current);
      if (lastSegmentRef.current === null) {
        lastSegmentRef.current = index;
        return;
      }

      if (index !== lastSegmentRef.current && index >= 0) {
        lastSegmentRef.current = index;
        play(SOUND_ID.wheelTick);
      }
    },
    [play],
  );

  const handleSpinSettled = useCallback(() => {
    if (enabledRef.current) {
      play(SOUND_ID.spinEnd);
    }

    lastSegmentRef.current = null;
  }, [play]);

  return {
    handleSpinPress,
    handleRotationFrame,
    handleSpinSettled,
  };
}
