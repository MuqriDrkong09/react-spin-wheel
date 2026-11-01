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
});
