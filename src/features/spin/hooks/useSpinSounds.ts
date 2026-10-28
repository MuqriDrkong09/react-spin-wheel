import { useEffect, useRef } from 'react';

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

  useEffect(() => {
    if (!spinning) {
      lastSegmentRef.current = null;
    }
  }, [spinning]);

  function handleSpinPress() {
    if (!enabled) {
      return;
    }

    play(SOUND_ID.spinStart);
  }

  function handleRotationFrame(rotationDegrees: number) {
    if (!enabled || !spinning) {
      return;
    }

    const index = pointerSegmentIndex(degreesToRadians(rotationDegrees), segments);
    if (lastSegmentRef.current === null) {
      lastSegmentRef.current = index;
      return;
    }

    if (index !== lastSegmentRef.current && index >= 0) {
      lastSegmentRef.current = index;
      play(SOUND_ID.wheelTick);
    }
  }

  function handleSpinSettled() {
    if (enabled) {
      play(SOUND_ID.spinEnd);
    }

    lastSegmentRef.current = null;
  }

  return {
    handleSpinPress,
    handleRotationFrame,
    handleSpinSettled,
  };
}
