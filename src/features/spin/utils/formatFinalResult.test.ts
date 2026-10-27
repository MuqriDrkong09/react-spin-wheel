import {
  formatFinalResultCopy,
  formatResultTimestamp,
  toSpinHistorySession,
} from '@/features/spin/utils/formatFinalResult';
import { SPIN_SESSION_STATUS } from '@/types/wheel';

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
        result: {
          sessionId: 'session-1',
          wheelId: 'pizza-night',
          selectedItemId: 'large',
          path: ['pizza', 'chicken-pepperoni', 'large'],
          labels: ['Pizza', 'Chicken Pepperoni', 'Large'],
          timestamp: '2026-10-27T01:20:00.000Z',
        },
      }),
    ).toEqual({
      id: 'session-1',
      wheelId: 'pizza-night',
      wheelName: 'Pizza Night',
      status: SPIN_SESSION_STATUS.completed,
      results: [
        {
          id: 'session-1-pizza',
          sessionId: 'session-1',
          wheelId: 'pizza-night',
          itemId: 'pizza',
          itemName: 'Pizza',
          parentItemId: null,
          path: ['pizza'],
          depth: 0,
          probability: 1,
          spunAt: '2026-10-27T01:20:00.000Z',
        },
        {
          id: 'session-1-chicken-pepperoni',
          sessionId: 'session-1',
          wheelId: 'pizza-night',
          itemId: 'chicken-pepperoni',
          itemName: 'Chicken Pepperoni',
          parentItemId: 'pizza',
          path: ['pizza', 'chicken-pepperoni'],
          depth: 1,
          probability: 1,
          spunAt: '2026-10-27T01:20:00.000Z',
        },
        {
          id: 'session-1-large',
          sessionId: 'session-1',
          wheelId: 'pizza-night',
          itemId: 'large',
          itemName: 'Large',
          parentItemId: 'chicken-pepperoni',
          path: ['pizza', 'chicken-pepperoni', 'large'],
          depth: 2,
          probability: 1,
          spunAt: '2026-10-27T01:20:00.000Z',
        },
      ],
      path: ['pizza', 'chicken-pepperoni', 'large'],
      startedAt: '2026-10-27T01:20:00.000Z',
      completedAt: '2026-10-27T01:20:00.000Z',
    });
  });
});
