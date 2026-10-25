export const SPIN_MESSAGES = {
  noWheelTitle: 'No wheel selected',
  noWheelDescription: 'Create a wheel or open one from the dashboard to spin it.',
  missingWheelTitle: 'Wheel not found',
  missingWheelDescription:
    'This wheel is missing or was deleted. Create a new wheel or open one from the dashboard.',
  emptyTitle: 'Nothing to spin',
  emptyDescription: 'Add enabled items with a positive weight to build this wheel.',
  spinButton: 'Spin the wheel',
  pointerTitle: 'Wheel pointer',
  wheelLabel: (names: string[]) =>
    names.length === 0 ? 'Empty spin wheel' : `Spin wheel with ${names.join(', ')}`,
} as const;

export const WHEEL_VIEWBOX_SIZE = 200;
export const WHEEL_RADIUS = 94;
export const WHEEL_INNER_RADIUS = 36;
export const WHEEL_LABEL_RADIUS_RATIO = 0.66;
export const WHEEL_LABEL_MIN_SWEEP = 0.28;
export const WHEEL_TANGENT_MIN_SWEEP = Math.PI / 3;
export const WHEEL_LABEL_FONT_RATIO = 0.045;
export const WHEEL_LABEL_MIN_FONT_RATIO = 0.028;
export const WHEEL_LABEL_CHAR_WIDTH_RATIO = 0.56;
export const WHEEL_LABEL_LINE_HEIGHT_RATIO = 1.15;
export const WHEEL_LABEL_PADDING = 4;
export const WHEEL_POINTER = {
  tipY: 2,
  baseY: 22,
  halfWidth: 11,
} as const;
