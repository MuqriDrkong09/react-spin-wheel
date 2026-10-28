export const PRESET_ID = {
  food: 'food',
  movie: 'movie',
  workout: 'workout',
  team: 'team',
} as const;

export const PRESET_MESSAGES = {
  title: 'Presets',
  description:
    'Start from a template, including nested options. Preview it, then create or edit a copy. The original preset never changes.',
  preview: 'Preview',
  create: 'Create from preset',
  modify: 'Modify',
  saveAsOwn: 'Save as my wheel',
  closePreview: 'Close',
  previewTitle: (name: string) => `Preview ${name}`,
  previewHint: 'This template stays unchanged. Saving creates a new wheel you can edit.',
  itemCount: (count: number) => (count === 1 ? '1 item' : `${count} items`),
  nestedCount: (count: number) => `${count} nested`,
  optionsHeading: 'Options',
} as const;
