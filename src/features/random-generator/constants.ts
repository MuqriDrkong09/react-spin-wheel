export const GENERATOR_TOOL = {
  number: 'number',
  item: 'item',
  name: 'name',
  choice: 'choice',
} as const;

export const NUMBER_MODE = {
  integer: 'integer',
  decimal: 'decimal',
} as const;

export const NAME_STYLE = {
  first: 'first',
  last: 'last',
  full: 'full',
} as const;

export const CHOICE_PRESET = {
  yesNo: 'yesNo',
  headsTails: 'headsTails',
  trueFalse: 'trueFalse',
  custom: 'custom',
} as const;

export const CHOICE_PRESETS = {
  yesNo: { label: 'Yes or no', options: ['Yes', 'No'] },
  headsTails: { label: 'Heads or tails', options: ['Heads', 'Tails'] },
  trueFalse: { label: 'True or false', options: ['True', 'False'] },
} as const;

export const GENERATOR_LIMITS = {
  minDecimals: 0,
  maxDecimals: 10,
  defaultDecimals: 2,
  minNameCount: 1,
  maxNameCount: 20,
  minChoiceOptions: 2,
  maxItemName: 100,
} as const;

export const GENERATOR_MESSAGES = {
  title: 'Random generator',
  description: 'Generate random numbers, weighted items, names, and choices.',
  toolsLabel: 'Generator tools',
  numberTab: 'Random number',
  itemTab: 'Random item',
  nameTab: 'Random name',
  choiceTab: 'Random choice',
  numberHint: 'Pick a number between a minimum and maximum, as an integer or decimal.',
  itemHint: 'Add a list of items and optional weights. Higher weights are more likely.',
  nameHint: 'Generate one or more names from the shared name lists.',
  choiceHint: 'Pick one option from a preset or your own list. Every option has equal chance.',
  generateNumber: 'Generate number',
  generateItem: 'Generate item',
  generateName: 'Generate name',
  generateChoice: 'Generate choice',
  generateAgain: 'Generate again',
  resultLabel: 'Result',
  emptyResult: 'Generate to see a result.',
  minLabel: 'Minimum',
  maxLabel: 'Maximum',
  numberTypeLabel: 'Number type',
  integerLabel: 'Integer',
  decimalLabel: 'Decimal',
  decimalsLabel: 'Decimal places',
  itemNameLabel: (index: number) => `Item ${index}`,
  weightLabel: (index: number) => `Weight ${index}`,
  addItem: 'Add item',
  removeItem: (index: number) => `Remove item ${index}`,
  nameStyleLabel: 'Name style',
  firstNameLabel: 'First name',
  lastNameLabel: 'Last name',
  fullNameLabel: 'Full name',
  nameCountLabel: 'How many names',
  choicePresetLabel: 'Choice set',
  customListLabel: 'Custom list',
  choiceOptionLabel: (index: number) => `Option ${index}`,
  addChoice: 'Add option',
  removeChoice: (index: number) => `Remove option ${index}`,
  minRequired: 'Enter a minimum.',
  maxRequired: 'Enter a maximum.',
  minGreaterThanMax: 'Minimum cannot be greater than maximum.',
  invalidIntegerRange: 'Integer range has no values between minimum and maximum.',
  decimalsRequired: 'Enter decimal places between 0 and 10.',
  itemNameRequired: 'Each item needs a name.',
  itemsRequired: 'Add at least one item.',
  invalidWeight: 'Each item weight must be a number of at least 1.',
  nameCountRequired: 'Enter a name count between 1 and 20.',
  choicesRequired: 'Add at least two named options.',
  choiceNameRequired: 'Each option needs a name.',
} as const;
