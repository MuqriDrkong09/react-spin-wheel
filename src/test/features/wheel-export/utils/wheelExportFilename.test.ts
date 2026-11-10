import { toWheelExportFilename } from '@/features/wheel-export/utils/wheelExportFilename';

describe('toWheelExportFilename', () => {
  it('builds a slug with a wheel suffix', () => {
    expect(toWheelExportFilename('Food Picker')).toBe('food-picker-wheel.json');
    expect(toWheelExportFilename('  Pizza Night  ')).toBe('pizza-night-wheel.json');
  });

  it('does not duplicate a trailing wheel suffix', () => {
    expect(toWheelExportFilename('Food Picker Wheel')).toBe('food-picker-wheel.json');
    expect(toWheelExportFilename('wheel')).toBe('wheel.json');
  });

  it('strips accents and punctuation', () => {
    expect(toWheelExportFilename("Café Menu!")).toBe('cafe-menu-wheel.json');
  });

  it('falls back when the name has no usable characters', () => {
    expect(toWheelExportFilename('   ')).toBe('wheel.json');
    expect(toWheelExportFilename('***')).toBe('wheel.json');
  });

  it('truncates long names without leaving a trailing hyphen', () => {
    const longName = `${'Alpha '.repeat(20)}Wheel`;
    const filename = toWheelExportFilename(longName);

    expect(filename.endsWith('.json')).toBe(true);
    expect(filename.length).toBeLessThanOrEqual(60 + '-wheel.json'.length);
    expect(filename).not.toMatch(/-\.json$/);
    expect(filename.includes('--')).toBe(false);
  });
});
