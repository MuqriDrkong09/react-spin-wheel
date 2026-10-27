import {
  formatFinalResultCopy,
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
});
