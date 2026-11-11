import { act, renderHook } from '@testing-library/react';
import { useRef, useState } from 'react';

import { AUTO_SPIN_STATUS, SPIN_MESSAGES, SPIN_STATUS } from '@/features/spin/constants';
import { useAutoSpin } from '@/features/spin/hooks/useAutoSpin';
import type { HierarchicalSelectionResult } from '@/features/spin/utils/selectionFlow';

const labels = ['Pizza', 'Burger', 'Sushi'] as const;

function useHarness(initialCount = 3) {
  const [spinStatus, setSpinStatus] = useState<(typeof SPIN_STATUS)[keyof typeof SPIN_STATUS]>(
    SPIN_STATUS.idle,
  );
  const [sessionId, setSessionId] = useState('s-1');
  const [result, setResult] = useState<HierarchicalSelectionResult>();
  const [itemCount, setItemCount] = useState(initialCount);
  const spinIndex = useRef(0);
  const saved = useRef<HierarchicalSelectionResult[]>([]);
  const sessionSeq = useRef(1);

  const auto = useAutoSpin({
    itemCount,
    spinStatus,
    willAutoAdvance: false,
    sessionId,
    result,
    startSpin: () => {
      const label = labels[spinIndex.current % labels.length] ?? 'Pizza';
      spinIndex.current += 1;
      setSpinStatus(SPIN_STATUS.completed);
      setResult({
        sessionId,
        wheelId: 'food',
        selectedItemId: label.toLowerCase(),
        path: [label.toLowerCase()],
        labels: [label],
        timestamp: `2026-01-01T00:00:0${spinIndex.current}.000Z`,
        durationMs: 1,
      });
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

  return { auto, saved, setItemCount, setCountInput: auto.setCountInput, setDelayInput: auto.setDelayInput };
}

describe('useAutoSpin', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('runs the configured number of spins, saves each result, and lists winners', async () => {
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
  });

  it('does not save history when Save results is off', async () => {
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
  });

  it('stops during the delay and leaves already saved spins in place', async () => {
    const { result } = renderHook(() => useHarness());

    act(() => {
      result.current.setCountInput('10');
      result.current.setDelayInput('1000');
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

  it('cancels the delay timer on unmount', async () => {
    const { result, unmount } = renderHook(() => useHarness());

    act(() => {
      result.current.setCountInput('5');
      result.current.setDelayInput('2000');
      result.current.auto.start();
    });
    expect(result.current.auto.status).toBe(AUTO_SPIN_STATUS.delaying);

    unmount();
    act(() => {
      vi.advanceTimersByTime(5_000);
    });
  });

  it('errors when no items remain to spin', async () => {
    const { result } = renderHook(() => useHarness(0));

    act(() => {
      result.current.auto.start();
    });

    expect(result.current.auto.status).toBe(AUTO_SPIN_STATUS.error);
    expect(result.current.auto.error).toBe(SPIN_MESSAGES.autoSpinNoItems);
  });

  it('rejects an invalid spin count', async () => {
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
});
