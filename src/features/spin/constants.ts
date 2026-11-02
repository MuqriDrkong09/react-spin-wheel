export const SPIN_MESSAGES = {
  noWheelTitle: 'No wheel selected',
  noWheelDescription: 'Create a wheel or open one from the dashboard to spin it.',
  chooseWheelDescription: 'Select a wheel to spin.',
  chooseWheelAction: (name: string) => `Spin ${name}`,
  changeWheel: 'Choose another wheel',
  itemCount: (count: number) => (count === 1 ? '1 item' : `${count} items`),
  missingWheelTitle: 'Wheel not found',
  missingWheelDescription:
    'This wheel is missing or was deleted. Create a new wheel or open one from the dashboard.',
  emptyTitle: 'Nothing to spin',
  emptyDescription: 'Add enabled items with a positive weight to build this wheel.',
  spinButton: 'Spin the wheel',
  pointerTitle: 'Wheel pointer',
  winner: (name: string) => `${name} wins!`,
  winnerTitle: '🎉 Winner!',
  additionalData: 'Additional data available',
  continuePrompt: 'Continue to the next wheel?',
  continueSelection: 'Continue',
  spinChild: 'Spin Child',
  selectionMode: 'Selection mode',
  selectionModeManual: 'Manual',
  selectionModeAutomatic: 'Automatic',
  selectionModeAsk: 'Ask',
  removeWinner: 'Remove Winner',
  restoreItems: 'Restore Items',
  finish: 'Finish',
  close: 'Close',
  spinAgain: 'Spin Again',
  finalResultTitle: '🎉 Final result',
  startNewSelection: 'Start New Selection',
  copyResult: 'Copy Result',
  saveResult: 'Save Result',
  resultCopied: 'Result copied',
  resultCopyFailed: 'Could not copy the result',
  resultSaved: 'Saved',
  spinning: 'Spinning',
  path: (names: string[]) => names.join(' → '),
  pathLabel: (names: string[]) =>
    names.length <= 1 ? names[0] ?? '' : `Selection path: ${names.join(' → ')}`,
  childWheelOf: (name: string) => `Children of ${name}`,
  wheelLabel: (names: string[]) =>
    names.length === 0 ? 'Empty spin wheel' : `Spin wheel with ${names.join(', ')}`,
  autoSpinTitle: 'Auto Spin',
  autoSpinCount: 'Number of spins',
  autoSpinDelay: 'Delay between spins',
  autoSpinDelayHint: 'Milliseconds to wait after each completed spin',
  autoSpinRemoveWinners: 'Remove winners',
  autoSpinSaveResults: 'Save results',
  autoSpinStart: 'Start Auto Spin',
  autoSpinStop: 'Stop',
  autoSpinStopping: 'Stopping',
  autoSpinProgress: (current: number, total: number) => `Spin ${current} of ${total}`,
  autoSpinResult: (index: number, labels: readonly string[]) =>
    `Spin ${index} → ${labels.join(' → ')}`,
  autoSpinNoItems: 'Nothing left to spin. Restore items or add more before auto spinning.',
  autoSpinInvalidCount: 'Enter a number of spins between 1 and 100.',
  autoSpinInvalidDelay: 'Enter a delay between 0 and 10,000 milliseconds.',
  autoSpinFailed: 'Auto Spin could not complete this spin.',
  autoSpinComplete: 'Auto Spin complete',
  autoSpinStopped: 'Auto Spin stopped',
} as const;

export const SPIN_STATUS = {
  idle: 'idle',
  spinning: 'spinning',
  completed: 'completed',
} as const;

export type SpinStatus = (typeof SPIN_STATUS)[keyof typeof SPIN_STATUS];

export const AUTO_SPIN_STATUS = {
  idle: 'idle',
  running: 'running',
  delaying: 'delaying',
  stopping: 'stopping',
  completed: 'completed',
  stopped: 'stopped',
  error: 'error',
} as const;

export type AutoSpinStatus = (typeof AUTO_SPIN_STATUS)[keyof typeof AUTO_SPIN_STATUS];

export const AUTO_SPIN_LIMITS = {
  minCount: 1,
  maxCount: 100,
  minDelayMs: 0,
  maxDelayMs: 10_000,
  defaultCount: 10,
  defaultDelayMs: 500,
} as const;

export const SPIN_ANIMATION_TYPE = {
  easeOut: 'easeOut',
  easeInOut: 'easeInOut',
  cubic: 'cubic',
} as const;

export type SpinAnimationType = (typeof SPIN_ANIMATION_TYPE)[keyof typeof SPIN_ANIMATION_TYPE];

export const SPIN_EASINGS: Record<SpinAnimationType, readonly [number, number, number, number]> = {
  easeOut: [0.16, 1, 0.3, 1],
  easeInOut: [0.42, 0, 0.58, 1],
  cubic: [0.33, 1, 0.68, 1],
};

export const DEFAULT_SPIN_ANIMATION = {
  spinDuration: 4000,
  rotations: 4,
  animationType: SPIN_ANIMATION_TYPE.easeInOut,
} as const;

export const FULL_TURN = Math.PI * 2;
export const POINTER_ANGLE = -Math.PI / 2;
export const DEFAULT_FULL_ROTATIONS = 4;
export const WHEEL_VIEWBOX_SIZE = 200;
export const WHEEL_RADIUS = 94;
export const WHEEL_INNER_RADIUS = 24;
export const WHEEL_HUB_COLOR = '#111827';
export const WHEEL_CENTER_BUTTON_RATIO = 0.96;
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
