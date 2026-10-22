export const WHEEL_ICON_OPTIONS = [
  { value: '', label: 'None' },
  { value: '🎯', label: 'Target' },
  { value: '🍕', label: 'Food' },
  { value: '🎮', label: 'Games' },
  { value: '🎲', label: 'Dice' },
  { value: '⭐', label: 'Star' },
  { value: '🎵', label: 'Music' },
] as const;

export const CREATE_WHEEL_MESSAGES = {
  nameRequired: 'Enter a wheel name',
  nameMin: 'Name must be at least 2 characters',
  nameMax: 'Name must be at most 100 characters',
  optionRequired: 'Enter an option name',
  itemsRequired: 'Add at least one option',
} as const;
