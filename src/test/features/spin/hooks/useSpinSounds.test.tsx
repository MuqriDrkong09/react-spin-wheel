import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';

import { SoundContext } from '@/features/sound/soundContext';
import { useSpinSounds } from '@/features/spin/hooks/useSpinSounds';
import { calculateSegmentAngles, calculateTargetRotation } from '@/features/spin/engine/spinEngine';
import { radiansToDegrees } from '@/features/spin/utils/spinAnimation';
import { SOUND_ID } from '@/types/sound';
import type { WheelItem } from '@/types/wheel';

function item(name: string, extra?: Partial<WheelItem>): WheelItem {
  return {
    id: name.toLowerCase(),
    name,
    color: '#4f46e5',
    enabled: true,
    weight: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...extra,
  };
}

const segments = calculateSegmentAngles([item('Pizza'), item('Burger')]);
const burgerDegrees = radiansToDegrees(calculateTargetRotation(segments[1]!));

function wrapper(play: ReturnType<typeof vi.fn>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <SoundContext.Provider
        value={{
          play,
          unlock: async () => false,
          preview: () => undefined,
        }}
      >
        {children}
      </SoundContext.Provider>
    );
  };
}

function renderSounds(
  play: ReturnType<typeof vi.fn>,
  initialProps: { enabled: boolean; spinning: boolean; segments: typeof segments | [] } = {
    enabled: true,
    spinning: true,
    segments,
  },
) {
  return renderHook((props) => useSpinSounds(props), {
    wrapper: wrapper(play),
    initialProps,
  });
}

describe('useSpinSounds', () => {
  it('plays spin start only when sound is enabled', () => {
    const play = vi.fn();
    const { result, rerender } = renderSounds(play);

    act(() => {
      result.current.handleSpinPress();
    });
    expect(play).toHaveBeenCalledWith(SOUND_ID.spinStart);

    play.mockClear();
    rerender({ enabled: false, spinning: true, segments });
    act(() => {
      result.current.handleSpinPress();
    });
    expect(play).not.toHaveBeenCalled();
  });

  it('ticks when the pointer crosses into a new segment', () => {
    const play = vi.fn();
    const { result } = renderSounds(play);

    act(() => {
      result.current.handleRotationFrame(0);
    });
    expect(play).not.toHaveBeenCalled();

    act(() => {
      result.current.handleRotationFrame(0);
    });
    expect(play).not.toHaveBeenCalled();

    act(() => {
      result.current.handleRotationFrame(burgerDegrees);
    });
    expect(play).toHaveBeenCalledTimes(1);
    expect(play).toHaveBeenCalledWith(SOUND_ID.wheelTick);
  });

  it('ignores rotation frames when sound is off or the wheel is idle', () => {
    const play = vi.fn();
    const { result, rerender } = renderSounds(play, {
      enabled: false,
      spinning: true,
      segments,
    });

    act(() => {
      result.current.handleRotationFrame(burgerDegrees);
    });
    expect(play).not.toHaveBeenCalled();

    rerender({ enabled: true, spinning: false, segments });
    act(() => {
      result.current.handleRotationFrame(burgerDegrees);
    });
    expect(play).not.toHaveBeenCalled();
  });

  it('does not tick when the pointer index is invalid', () => {
    const play = vi.fn();
    const { result, rerender } = renderSounds(play);

    act(() => {
      result.current.handleRotationFrame(0);
    });

    rerender({ enabled: true, spinning: true, segments: [] });
    act(() => {
      result.current.handleRotationFrame(90);
    });

    expect(play).not.toHaveBeenCalled();
  });

  it('plays spin end when enabled and always clears the last segment', () => {
    const play = vi.fn();
    const { result, rerender } = renderSounds(play);

    act(() => {
      result.current.handleRotationFrame(0);
      result.current.handleSpinSettled();
    });
    expect(play).toHaveBeenCalledWith(SOUND_ID.spinEnd);

    play.mockClear();
    rerender({ enabled: false, spinning: true, segments });
    act(() => {
      result.current.handleSpinSettled();
    });
    expect(play).not.toHaveBeenCalled();

    rerender({ enabled: true, spinning: true, segments });
    act(() => {
      result.current.handleRotationFrame(0);
    });
    expect(play).not.toHaveBeenCalled();
  });

  it('resets the last segment when spinning stops so the next spin does not tick immediately', () => {
    const play = vi.fn();
    const { result, rerender } = renderSounds(play);

    act(() => {
      result.current.handleRotationFrame(0);
    });

    rerender({ enabled: true, spinning: false, segments });
    rerender({ enabled: true, spinning: true, segments });

    act(() => {
      result.current.handleRotationFrame(burgerDegrees);
    });
    expect(play).not.toHaveBeenCalled();
  });
});
