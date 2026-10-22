import { CREATE_WHEEL_MESSAGES } from '@/features/create-wheel/constants';
import { createWheelFormSchema, defaultCreateWheelValues } from '@/features/create-wheel/schema';

function parse(overrides: Record<string, unknown> = {}) {
  return createWheelFormSchema.safeParse({
    ...defaultCreateWheelValues,
    name: 'Pizza Night',
    items: [{ name: 'Pepperoni' }],
    ...overrides,
  });
}

function messages(result: ReturnType<typeof parse>): string[] {
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe('createWheelFormSchema', () => {
  it('accepts a valid wheel with optional fields omitted', () => {
    const result = parse({
      description: '',
      category: '',
      icon: '',
    });

    expect(result.success).toBe(true);
  });

  it('requires a wheel name', () => {
    expect(messages(parse({ name: '   ' }))).toContain(CREATE_WHEEL_MESSAGES.nameRequired);
  });

  it('requires the wheel name to be at least 2 characters', () => {
    expect(messages(parse({ name: 'A' }))).toContain(CREATE_WHEEL_MESSAGES.nameMin);
  });

  it('rejects wheel names longer than 100 characters', () => {
    expect(messages(parse({ name: 'A'.repeat(101) }))).toContain(CREATE_WHEEL_MESSAGES.nameMax);
  });

  it('allows description, category, and icon to be empty', () => {
    const result = parse({
      description: '  ',
      category: '',
      icon: '',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe('');
      expect(result.data.category).toBe('');
      expect(result.data.icon).toBe('');
    }
  });

  it('requires at least one option', () => {
    expect(messages(parse({ items: [] }))).toContain(CREATE_WHEEL_MESSAGES.itemsRequired);
  });

  it('requires each option to have a name', () => {
    expect(messages(parse({ items: [{ name: '  ' }] }))).toContain(
      CREATE_WHEEL_MESSAGES.optionRequired,
    );
  });
});
