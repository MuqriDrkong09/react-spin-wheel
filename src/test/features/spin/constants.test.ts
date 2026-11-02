import {
  AUTO_SPIN_LIMITS,
  AUTO_SPIN_STATUS,
  DEFAULT_SPIN_ANIMATION,
  SPIN_ANIMATION_TYPE,
  SPIN_EASINGS,
  SPIN_MESSAGES,
  SPIN_STATUS,
} from '@/features/spin/constants';

describe('SPIN_MESSAGES', () => {
  it('builds action and winner copy from names', () => {
    expect(SPIN_MESSAGES.chooseWheelAction('Food Wheel')).toBe('Spin Food Wheel');
    expect(SPIN_MESSAGES.winner('Burger')).toBe('Burger wins!');
    expect(SPIN_MESSAGES.childWheelOf('Pizza')).toBe('Children of Pizza');
    expect(SPIN_MESSAGES.path(['Pizza', 'Pepperoni'])).toBe('Pizza → Pepperoni');
  });

  it('formats item counts in singular and plural', () => {
    expect(SPIN_MESSAGES.itemCount(1)).toBe('1 item');
    expect(SPIN_MESSAGES.itemCount(0)).toBe('0 items');
    expect(SPIN_MESSAGES.itemCount(3)).toBe('3 items');
  });

  it('labels a selection path for empty, single, and nested steps', () => {
    expect(SPIN_MESSAGES.pathLabel([])).toBe('');
    expect(SPIN_MESSAGES.pathLabel([undefined as unknown as string])).toBe('');
    expect(SPIN_MESSAGES.pathLabel(['Pizza'])).toBe('Pizza');
    expect(SPIN_MESSAGES.pathLabel(['Pizza', 'Pepperoni'])).toBe('Selection path: Pizza → Pepperoni');
  });

  it('labels the wheel for empty and populated slices', () => {
    expect(SPIN_MESSAGES.wheelLabel([])).toBe('Empty spin wheel');
    expect(SPIN_MESSAGES.wheelLabel(['Pizza', 'Burger'])).toBe('Spin wheel with Pizza, Burger');
  });

  it('formats auto spin progress and result lines', () => {
    expect(SPIN_MESSAGES.autoSpinProgress(1, 10)).toBe('Spin 1 of 10');
    expect(SPIN_MESSAGES.autoSpinResult(1, ['Pizza'])).toBe('Spin 1 → Pizza');
    expect(SPIN_MESSAGES.autoSpinResult(2, ['Pizza', 'Pepperoni'])).toBe(
      'Spin 2 → Pizza → Pepperoni',
    );
    expect(AUTO_SPIN_LIMITS.maxCount).toBe(100);
    expect(Object.values(AUTO_SPIN_STATUS)).toContain('stopping');
  });
});

describe('spin animation constants', () => {
  it('defines an easing for every animation type', () => {
    for (const type of Object.values(SPIN_ANIMATION_TYPE)) {
      expect(SPIN_EASINGS[type]).toHaveLength(4);
    }
  });

  it('defaults the spin animation to ease-in-out', () => {
    expect(DEFAULT_SPIN_ANIMATION.animationType).toBe(SPIN_ANIMATION_TYPE.easeInOut);
    expect(Object.values(SPIN_STATUS)).toEqual(['idle', 'spinning', 'completed']);
  });
});
