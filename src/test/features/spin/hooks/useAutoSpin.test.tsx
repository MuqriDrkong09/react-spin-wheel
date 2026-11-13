import { act, renderHook } from '@testing-library/react';
import { useRef, useState } from 'react';

import { AUTO_SPIN_STATUS, SPIN_MESSAGES, SPIN_STATUS } from '@/features/spin/constants';
import { useAutoSpin } from '@/features/spin/hooks/useAutoSpin';
import * as autoSpinUtils from '@/features/spin/utils/autoSpin';
import type { HierarchicalSelectionResult } from '@/features/spin/utils/selectionFlow';

const labels = ['Pizza', 'Burger', 'Sushi'] as const;

function useHarness(
  options: {
    initialCount?: number;
    autoComplete?: boolean;
    willAutoAdvance?: boolean;
  } = {},
) {
  const { initialCount = 3, autoComplete = true, willAutoAdvance = false } = options;
  const [spinStatus, setSpinStatus] = useState<(typeof SPIN_STATUS)[keyof typeof SPIN_STATUS]>(
    SPIN_STATUS.idle,
  );
  const [sessionId, setSessionId] = useState('s-1');
  const [result, setResult] = useState<HierarchicalSelectionResult>();
  const [itemCount, setItemCount] = useState(initialCount);
  const spinIndex = useRef(0);
  const saved = useRef<HierarchicalSelectionResult[]>([]);
  const sessionSeq = useRef(1);
  const lastResult = useRef<HierarchicalSelectionResult>();
  const sessionIdRef = useRef(sessionId);
  sessionIdRef.current = sessionId;

  const completeCurrentSpin = () => {
    const label = labels[spinIndex.current % labels.length] ?? 'Pizza';
    spinIndex.current += 1;
    const next: HierarchicalSelectionResult = {
      sessionId: sessionIdRef.current,
      wheelId: 'food',
      selectedItemId: label.toLowerCase(),
      path: [label.toLowerCase()],
      labels: [label],
      timestamp: `2026-01-01T00:00:0${spinIndex.current}.000Z`,
      durationMs: 1,
    };
    lastResult.current = next;
    setSpinStatus(SPIN_STATUS.completed);
    setResult(next);
  };

  const auto = useAutoSpin({
    itemCount,
    spinStatus,
    willAutoAdvance,
    sessionId,
    result,
    startSpin: () => {
      if (!autoComplete) {
        setSpinStatus(SPIN_STATUS.spinning);
        return;
      }
      completeCurrentSpin();
    },
    startNewSelection: () => {
      sessionSeq.current += 1;
      setSessionId(`s-${sessionSeq.current}`);
      setSpinStatus(SPIN_STATUS.idle);
      setResult(undefined);
    },
    onSave: (entry) => {
      saved.current.push(entry);
    },
  });

  return {
    auto,
    saved,
    lastResult,
    setItemCount,
    setSpinStatus,
    setResult,
    setSessionId,
    completeCurrentSpin,
    setCountInput: auto.setCountInput,
    setDelayInput: auto.setDelayInput,
  };
}

describe('useAutoSpin', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('runs the configured number of spins, saves each result, and lists winners', () => {
    const { result } = renderHook(() => useHarness());

    act(() => {
      result.current.setCountInput('3');
      result.current.setDelayInput('0');
    });
    act(() => {
      result.current.auto.start();
    });

    expect(result.current.auto.results).toHaveLength(1);
    expect(result.current.auto.results[0]?.labels).toEqual(['Pizza']);
    expect(result.current.saved.current).toHaveLength(1);

    act(() => {
      vi.runOnlyPendingTimers();
    });
    expect(result.current.auto.results.map((entry) => entry.labels[0])).toEqual(['Pizza', 'Burger']);

    act(() => {
      vi.runOnlyPendingTimers();
    });
    expect(result.current.auto.results.map((entry) => entry.labels[0])).toEqual([
      'Pizza',
      'Burger',
      'Sushi',
    ]);
    expect(result.current.auto.status).toBe(AUTO_SPIN_STATUS.completed);
    expect(result.current.saved.current).toHaveLength(3);
    expect(result.current.auto.controlsLocked).toBe(false);
    expect(result.current.auto.progressPercent).toBe(100);
    expect(result.current.auto.currentIndex).toBe(3);
  });

  it('does not save history when Save results is off', () => {
    const { result } = renderHook(() => useHarness());

    act(() => {
      result.current.auto.setSaveResults(false);
      result.current.setCountInput('1');
      result.current.setDelayInput('0');
    });
    act(() => {
      result.current.auto.start();
    });

    expect(result.current.auto.results).toHaveLength(1);
    expect(result.current.saved.current).toHaveLength(0);
    expect(result.current.auto.status).toBe(AUTO_SPIN_STATUS.completed);
  });

  it('stops during the delay and leaves already saved spins in place', () => {
    const { result } = renderHook(() => useHarness());

    act(() => {
      result.current.setCountInput('10');
      result.current.setDelayInput('1000');
    });
    act(() => {
      result.current.auto.start();
    });

    expect(result.current.auto.status).toBe(AUTO_SPIN_STATUS.delaying);
    expect(result.current.saved.current).toHaveLength(1);

    act(() => {
      result.current.auto.stop();
    });

    expect(result.current.auto.status).toBe(AUTO_SPIN_STATUS.stopped);
    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(result.current.auto.results).toHaveLength(1);
    expect(result.current.saved.current).toHaveLength(1);
  });

  it('cancels the delay timer on unmount', () => {
    const { result, unmount } = renderHook(() => useHarness());

    act(() => {
      result.current.setCountInput('5');
      result.current.setDelayInput('2000');
    });
    act(() => {
      result.current.auto.start();
    });
    expect(result.current.auto.status).toBe(AUTO_SPIN_STATUS.delaying);

    unmount();
    act(() => {
      vi.advanceTimersByTime(5_000);
    });
  });

  it('errors when no items remain to spin', () => {
    const { result } = renderHook(() => useHarness({ initialCount: 0 }));

    act(() => {
      result.current.auto.start();
    });

    expect(result.current.auto.status).toBe(AUTO_SPIN_STATUS.error);
    expect(result.current.auto.error).toBe(SPIN_MESSAGES.autoSpinNoItems);
  });

  it('rejects an invalid spin count', () => {
    const { result } = renderHook(() => useHarness());

    act(() => {
      result.current.setCountInput('0');
    });
    act(() => {
      result.current.auto.start();
    });

    expect(result.current.auto.error).toBe(SPIN_MESSAGES.autoSpinInvalidCount);
    expect(result.current.auto.status).toBe(AUTO_SPIN_STATUS.error);
  });

  it('rejects an invalid delay', () => {
    const { result } = renderHook(() => useHarness());

    act(() => {
      result.current.setCountInput('2');
      result.current.setDelayInput('-1');
    });
    act(() => {
      result.current.auto.start();
    });

    expect(result.current.auto.error).toBe(SPIN_MESSAGES.autoSpinInvalidDelay);
    expect(result.current.auto.status).toBe(AUTO_SPIN_STATUS.error);
  });

  it('ignores start while spinning or already locked, and ignores stop while idle', () => {
    const { result } = renderHook(() => useHarness({ autoComplete: false }));

    act(() => {
      result.current.auto.stop();
    });
    expect(result.current.auto.status).toBe(AUTO_SPIN_STATUS.idle);

    act(() => {
      result.current.setCountInput('2');
      result.current.setDelayInput('1000');
    });
    act(() => {
      result.current.auto.start();
    });
    expect(result.current.auto.status).toBe(AUTO_SPIN_STATUS.running);
    expect(result.current.auto.controlsLocked).toBe(true);

    act(() => {
      result.current.auto.start();
    });
    expect(result.current.auto.results).toHaveLength(0);

    act(() => {
      result.current.setSpinStatus(SPIN_STATUS.spinning);
    });
    act(() => {
      result.current.auto.start();
    });
    expect(result.current.auto.status).toBe(AUTO_SPIN_STATUS.running);
  });

  it('waits for an in-flight spin before kickoff, then records the winner', () => {
    const { result } = renderHook(() => useHarness({ autoComplete: false }));

    act(() => {
      result.current.setCountInput('1');
      result.current.setDelayInput('0');
    });
    act(() => {
      result.current.auto.start();
      // Keep kickoff pending until the in-flight spin settles.
      result.current.setSpinStatus(SPIN_STATUS.spinning);
    });
    expect(result.current.auto.status).toBe(AUTO_SPIN_STATUS.running);
    expect(result.current.auto.results).toHaveLength(0);

    act(() => {
      result.current.setSpinStatus(SPIN_STATUS.idle);
    });
    expect(result.current.auto.status).toBe(AUTO_SPIN_STATUS.running);

    act(() => {
      result.current.completeCurrentSpin();
    });

    expect(result.current.auto.results).toHaveLength(1);
    expect(result.current.auto.status).toBe(AUTO_SPIN_STATUS.completed);
  });

  it('errors on kickoff when items are depleted after start', () => {
    const { result } = renderHook(() => useHarness({ autoComplete: false }));

    act(() => {
      result.current.setCountInput('2');
      result.current.setDelayInput('0');
    });
    act(() => {
      result.current.auto.start();
      result.current.setItemCount(0);
    });

    expect(result.current.auto.status).toBe(AUTO_SPIN_STATUS.error);
    expect(result.current.auto.error).toBe(SPIN_MESSAGES.autoSpinNoItems);
  });

  it('errors when the delay elapses with no items left', () => {
    const { result } = renderHook(() => useHarness());

    act(() => {
      result.current.setCountInput('3');
      result.current.setDelayInput('500');
    });
    act(() => {
      result.current.auto.start();
    });
    expect(result.current.auto.status).toBe(AUTO_SPIN_STATUS.delaying);

    act(() => {
      result.current.setItemCount(0);
    });
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.auto.status).toBe(AUTO_SPIN_STATUS.error);
    expect(result.current.auto.error).toBe(SPIN_MESSAGES.autoSpinNoItems);
  });

  it('finishes through the stopping path when stop is pressed mid-spin', () => {
    const { result } = renderHook(() => useHarness({ autoComplete: false }));

    act(() => {
      result.current.setCountInput('3');
      result.current.setDelayInput('0');
    });
    act(() => {
      result.current.auto.start();
    });
    expect(result.current.auto.status).toBe(AUTO_SPIN_STATUS.running);

    act(() => {
      result.current.auto.stop();
    });
    expect(result.current.auto.status).toBe(AUTO_SPIN_STATUS.stopping);

    act(() => {
      result.current.completeCurrentSpin();
    });

    expect(result.current.auto.results).toHaveLength(1);
    expect(result.current.auto.status).toBe(AUTO_SPIN_STATUS.stopped);
  });

  it('ignores a duplicate completed session id', () => {
    const { result } = renderHook(() => useHarness());

    act(() => {
      result.current.setCountInput('1');
      result.current.setDelayInput('0');
    });
    act(() => {
      result.current.auto.start();
    });
    expect(result.current.auto.results).toHaveLength(1);
    const first = result.current.lastResult.current;
    expect(first).toBeDefined();
    if (!first) {
      return;
    }

    // Status is already completed; force the record gate open to hit the
    // session-id dedupe branch in the hook.
    vi.spyOn(autoSpinUtils, 'shouldRecordCompletedSpin').mockReturnValue(true);

    act(() => {
      result.current.setSpinStatus(SPIN_STATUS.completed);
      result.current.setResult({ ...first });
    });

    expect(result.current.auto.results).toHaveLength(1);
    expect(result.current.saved.current).toHaveLength(1);
  });

  it('skips recording while the selection will auto-advance', () => {
    const { result } = renderHook(() =>
      useHarness({ autoComplete: false, willAutoAdvance: true }),
    );

    act(() => {
      result.current.setCountInput('1');
      result.current.setDelayInput('0');
    });
    act(() => {
      result.current.auto.start();
    });
    act(() => {
      result.current.completeCurrentSpin();
    });

    expect(result.current.auto.results).toHaveLength(0);
    expect(result.current.auto.status).toBe(AUTO_SPIN_STATUS.running);
  });

  it('errors when a completed spin has no winner result', () => {
    vi.spyOn(autoSpinUtils, 'shouldRecordCompletedSpin').mockReturnValue(true);

    const { result } = renderHook(() => useHarness({ autoComplete: false }));

    act(() => {
      result.current.setCountInput('1');
      result.current.setDelayInput('0');
    });
    act(() => {
      result.current.auto.start();
    });
    act(() => {
      result.current.setSpinStatus(SPIN_STATUS.completed);
      result.current.setResult(undefined);
    });

    expect(result.current.auto.status).toBe(AUTO_SPIN_STATUS.error);
    expect(result.current.auto.error).toBe(SPIN_MESSAGES.autoSpinFailed);
  });

  it('ignores start while the wheel is already spinning before auto-spin begins', () => {
    const { result } = renderHook(() => useHarness({ autoComplete: false }));

    act(() => {
      result.current.setSpinStatus(SPIN_STATUS.spinning);
    });
    act(() => {
      result.current.setCountInput('2');
      result.current.setDelayInput('0');
    });
    act(() => {
      result.current.auto.start();
    });

    expect(result.current.auto.status).toBe(AUTO_SPIN_STATUS.idle);
    expect(result.current.auto.results).toHaveLength(0);
  });
});
