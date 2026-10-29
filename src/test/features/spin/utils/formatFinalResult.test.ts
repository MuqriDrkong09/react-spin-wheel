import {
  formatFinalResultCopy,
  formatFinalResultPath,
  formatResultTimestamp,
  toSpinHistorySession,
} from '@/features/spin/utils/formatFinalResult';
import { SELECTION_MODE, SPIN_SESSION_STATUS } from '@/types/wheel';

const steps = [
  { id: 'pizza', name: 'Pizza', icon: '🍕' },
  { id: 'chicken-pepperoni', name: 'Chicken Pepperoni', icon: '🍗' },
  { id: 'large', name: 'Large', icon: '📏' },
];

describe('formatFinalResult', () => {
  it('formats the copy payload with icons, labels, wheel name, and timestamp', () => {
    const timestamp = '2026-10-27T01:20:00.000Z';

    expect(
      formatFinalResultCopy({
        wheelName: 'Pizza Night',
        steps,
        timestamp,
      }),
    ).toBe(
      [
        '🎉 Final result',
        'Pizza Night',
        '',
        '🍕 Pizza',
        '↓',
        '🍗 Chicken Pepperoni',
        '↓',
        '📏 Large',
        '',
        formatResultTimestamp(timestamp),
      ].join('\n'),
    );
  });

  it('maps a hierarchical result onto a completed history session', () => {
    expect(
      toSpinHistorySession({
        wheelName: 'Pizza Night',
        mode: SELECTION_MODE.ask,
        result: {
          sessionId: 'session-1',
          wheelId: 'pizza-night',
          selectedItemId: 'large',
          path: ['pizza', 'chicken-pepperoni', 'large'],
          labels: ['Pizza', 'Chicken Pepperoni', 'Large'],
          timestamp: '2026-10-27T01:20:00.000Z',
          durationMs: 4200,
        },
      }),
    ).toEqual({
      id: expect.any(String),
      wheelId: 'pizza-night',
      wheelName: 'Pizza Night',
      status: SPIN_SESSION_STATUS.completed,
      results: [
        {
          id: expect.any(String),
          sessionId: 'session-1',
          wheelId: 'pizza-night',
          itemId: 'large',
          itemName: 'Large',
          selectedItemId: 'large',
          selectedItemName: 'Large',
          parentItemId: 'chicken-pepperoni',
          path: ['pizza', 'chicken-pepperoni', 'large'],
          pathLabels: ['Pizza', 'Chicken Pepperoni', 'Large'],
          depth: 2,
          probability: 1,
          timestamp: '2026-10-27T01:20:00.000Z',
          spunAt: '2026-10-27T01:20:00.000Z',
          duration: 4200,
          mode: SELECTION_MODE.ask,
        },
      ],
      path: ['pizza', 'chicken-pepperoni', 'large'],
      startedAt: '2026-10-27T01:20:00.000Z',
      completedAt: '2026-10-27T01:20:00.000Z',
    });
  });

  it('keeps an unparseable timestamp as-is', () => {
    expect(formatResultTimestamp('not-a-date')).toBe('not-a-date');
  });

  it('formats a path without icons', () => {
    expect(formatFinalResultPath([{ id: 'pizza', name: 'Pizza' }, { id: 'large', name: 'Large' }])).toBe(
      ['Pizza', '↓', 'Large'].join('\n'),
    );
  });

  it('maps a root-only result with default mode and missing label', () => {
    const session = toSpinHistorySession({
      wheelName: 'Food',
      result: {
        sessionId: 'session-2',
        wheelId: 'food',
        selectedItemId: 'burger',
        path: ['burger'],
        labels: [],
        timestamp: '2026-10-27T02:00:00.000Z',
        durationMs: 0,
      },
    });

    expect(session.results[0]).toMatchObject({
      itemName: 'burger',
      selectedItemName: 'burger',
      parentItemId: null,
      depth: 0,
      mode: SELECTION_MODE.manual,
    });
  });

  it('uses a null parent when the previous path id is missing', () => {
    const session = toSpinHistorySession({
      wheelName: 'Food',
      result: {
        sessionId: 'session-3',
        wheelId: 'food',
        selectedItemId: 'large',
        path: [undefined as unknown as string, 'large'],
        labels: ['Pizza', 'Large'],
        timestamp: '2026-10-27T03:00:00.000Z',
        durationMs: 100,
      },
    });

    expect(session.results[0]?.parentItemId).toBeNull();
  });
});
