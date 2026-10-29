import { PRESET_ID, PRESET_MESSAGES } from '@/features/presets/constants';

describe('PRESET_ID', () => {
  it('identifies the built-in catalog entries', () => {
    expect(PRESET_ID).toEqual({
      food: 'food',
      movie: 'movie',
      workout: 'workout',
      team: 'team',
    });
  });
});

describe('PRESET_MESSAGES', () => {
  it('keeps the static copy used by the presets screen', () => {
    expect(PRESET_MESSAGES.title).toBe('Presets');
    expect(PRESET_MESSAGES.description).toContain('original preset never changes');
    expect(PRESET_MESSAGES.preview).toBe('Preview');
    expect(PRESET_MESSAGES.create).toBe('Create from preset');
    expect(PRESET_MESSAGES.modify).toBe('Modify');
    expect(PRESET_MESSAGES.saveAsOwn).toBe('Save as my wheel');
    expect(PRESET_MESSAGES.closePreview).toBe('Close');
    expect(PRESET_MESSAGES.previewHint).toContain('stays unchanged');
    expect(PRESET_MESSAGES.optionsHeading).toBe('Options');
  });

  it('builds preview titles from a preset name', () => {
    expect(PRESET_MESSAGES.previewTitle('Food')).toBe('Preview Food');
  });

  it('formats item counts in singular and plural', () => {
    expect(PRESET_MESSAGES.itemCount(1)).toBe('1 item');
    expect(PRESET_MESSAGES.itemCount(0)).toBe('0 items');
    expect(PRESET_MESSAGES.itemCount(4)).toBe('4 items');
  });

  it('formats nested counts', () => {
    expect(PRESET_MESSAGES.nestedCount(2)).toBe('2 nested');
  });
});
