import { EDITOR_MESSAGES } from '@/features/wheel-editor/constants';
import { childItemFormSchema, defaultItemFormValues, itemFormSchema } from '@/features/wheel-editor/schema';

function parse(overrides: Record<string, unknown> = {}) {
  return itemFormSchema.safeParse({
    ...defaultItemFormValues,
    name: 'Pizza',
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
    }
  });

  it('rejects an empty name', () => {
    expect(messages(parse({ name: '' }))).toContain(EDITOR_MESSAGES.nameRequired);
  });

  it('rejects a whitespace-only name', () => {
    expect(messages(parse({ name: '   ' }))).toContain(EDITOR_MESSAGES.nameRequired);
  });

  it('rejects a weight below 1', () => {
    expect(messages(parse({ weight: 0 }))).toContain(EDITOR_MESSAGES.weightMin);
  });

  it('requires a child name with the child schema', () => {
    const result = childItemFormSchema.safeParse({
      ...defaultItemFormValues,
      name: '   ',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toContain(
        EDITOR_MESSAGES.childNameRequired,
      );
    }
  });

  it('coerces numeric weight strings', () => {
    const result = parse({ weight: '3' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.weight).toBe(3);
    }
  });
});
