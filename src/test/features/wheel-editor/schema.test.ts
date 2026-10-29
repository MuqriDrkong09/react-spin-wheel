import { ITEM_COLORS } from '@/constants/wheel';
import { EDITOR_MESSAGES } from '@/features/wheel-editor/constants';
import { childItemFormSchema, defaultItemFormValues, itemFormSchema } from '@/features/wheel-editor/schema';

function parse(overrides: Record<string, unknown> = {}) {
  return itemFormSchema.safeParse({
    ...defaultItemFormValues,
    name: 'Pizza',
    ...overrides,
  });
}

function parseChild(overrides: Record<string, unknown> = {}) {
  return childItemFormSchema.safeParse({
    ...defaultItemFormValues,
    name: 'Salmon',
    ...overrides,
  });
}

function messages(result: ReturnType<typeof parse>): string[] {
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe('itemFormSchema', () => {
  it('accepts defaults with a name', () => {
    const result = parse();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.enabled).toBe(true);
      expect(result.data.weight).toBe(1);
      expect(result.data.description).toBe('');
      expect(result.data.icon).toBe('');
    }
  });

  it('trims optional text fields', () => {
    const result = parse({
      description: '  Oven baked  ',
      icon: '  🍕  ',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe('Oven baked');
      expect(result.data.icon).toBe('🍕');
    }
  });

  it('rejects an empty name', () => {
    expect(messages(parse({ name: '' }))).toContain(EDITOR_MESSAGES.nameRequired);
  });

  it('rejects a whitespace-only name', () => {
    expect(messages(parse({ name: '   ' }))).toContain(EDITOR_MESSAGES.nameRequired);
  });

  it('rejects names longer than 100 characters', () => {
    expect(messages(parse({ name: 'A'.repeat(101) }))).toContain(EDITOR_MESSAGES.nameMax);
  });

  it('accepts a name of 100 characters', () => {
    const name = 'A'.repeat(100);
    const result = parse({ name });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe(name);
    }
  });

  it('rejects an empty color', () => {
    const result = parse({ color: '   ' });

    expect(result.success).toBe(false);
  });

  it('rejects a weight below 1', () => {
    expect(messages(parse({ weight: 0 }))).toContain(EDITOR_MESSAGES.weightMin);
  });

  it('coerces numeric weight strings', () => {
    const result = parse({ weight: '3' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.weight).toBe(3);
    }
  });
});

describe('childItemFormSchema', () => {
  it('accepts a valid child item', () => {
    const result = parseChild();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Salmon');
    }
  });

  it('requires a child name with the child schema', () => {
    const result = parseChild({ name: '   ' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toContain(
        EDITOR_MESSAGES.childNameRequired,
      );
    }
  });

  it('rejects child names longer than 100 characters', () => {
    expect(messages(parseChild({ name: 'B'.repeat(101) }))).toContain(EDITOR_MESSAGES.nameMax);
  });
});

describe('defaultItemFormValues', () => {
  it('uses the first palette color', () => {
    expect(defaultItemFormValues).toEqual({
      name: '',
      description: '',
      icon: '',
      color: ITEM_COLORS[0],
      weight: 1,
      enabled: true,
    });
  });

  it('falls back to indigo when a palette slot is missing', async () => {
    vi.resetModules();
    vi.doMock('@/constants/wheel', async (importOriginal) => {
      const actual = await importOriginal<typeof import('@/constants/wheel')>();
      return { ...actual, ITEM_COLORS: [] };
    });

    const { defaultItemFormValues: fallbackValues } = await import('@/features/wheel-editor/schema');

    expect(fallbackValues.color).toBe('#4f46e5');
  });
});
