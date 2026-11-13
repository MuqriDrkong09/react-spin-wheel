import { z } from 'zod';

import { softArraySchema, softRecordSchema } from '@/schemas/soft';

const numberSchema = z.number().finite();
const softNumbers = softArraySchema(numberSchema);
const softNumberRecord = softRecordSchema(numberSchema);

describe('softArraySchema', () => {
  it('keeps valid items and drops invalid ones', () => {
    expect(softNumbers.safeParse([1, 'bad', 2, null, 3]).success).toBe(true);
    expect(softNumbers.safeParse([1, 'bad', 2, null, 3]).data).toEqual([1, 2, 3]);
    expect(softNumbers.safeParse([]).data).toEqual([]);
  });

  it('fails when the value is not an array', () => {
    expect(softNumbers.safeParse(null).success).toBe(false);
    expect(softNumbers.safeParse({ a: 1 }).success).toBe(false);
  });
});

describe('softRecordSchema', () => {
  it('keeps valid entries and drops invalid ones', () => {
    const parsed = softNumberRecord.safeParse({
      a: 1,
      b: 'bad',
      c: 2,
      d: null,
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toEqual({ a: 1, c: 2 });
    }
  });

  it('fails when the value is not a plain object record', () => {
    expect(softNumberRecord.safeParse(null).success).toBe(false);
    expect(softNumberRecord.safeParse([1, 2]).success).toBe(false);
  });
});
