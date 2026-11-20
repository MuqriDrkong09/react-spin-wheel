import {
  combinationPathParts,
  formatCombinationPath,
  hierarchyCsvHeaders,
  orderedFieldNames,
} from '@/features/test-data-generator/utils/formatCombinationPath';

const foodFields = [
  { name: 'Category', enabled: true },
  { name: 'Topping', enabled: true },
  { name: 'Size', enabled: true },
] as const;

describe('combinationPathParts', () => {
  it('returns selected values in field order', () => {
    expect(
      combinationPathParts(
        {
          Category: 'Pizza',
          Topping: 'Chicken Pepperoni',
          Size: 'Large',
        },
        foodFields,
      ),
    ).toEqual(['Pizza', 'Chicken Pepperoni', 'Large']);
  });

  it('skips omitted optional fields and disabled fields', () => {
    expect(
      combinationPathParts(
        { Category: 'Login', Environment: 'Staging', Notes: 'Legacy' },
        [
          { name: 'Category', enabled: true },
          { name: 'User Type', enabled: true },
          { name: 'Notes', enabled: false },
          { name: 'Environment', enabled: true },
        ],
      ),
    ).toEqual(['Login', 'Staging']);
  });

  it('falls back to sorted row keys when no enabled field values match', () => {
    expect(
      combinationPathParts(
        { Size: 'Large', Category: 'Pizza' },
        [
          { name: 'Topping', enabled: true },
          { name: 'Category', enabled: false },
        ],
      ),
    ).toEqual(['Pizza', 'Large']);
  });

  it('filters empty fallback values', () => {
    expect(
      combinationPathParts(
        { Category: 'Pizza', Blank: '' },
        [{ name: 'Missing', enabled: true }],
      ),
    ).toEqual(['Pizza']);
  });

  it('returns an empty list for an empty combination', () => {
    expect(combinationPathParts({}, foodFields)).toEqual([]);
  });
});

describe('formatCombinationPath', () => {
  it('joins values in field order with arrows', () => {
    expect(
      formatCombinationPath(
        {
          Category: 'Pizza',
          Topping: 'Chicken Pepperoni',
          Size: 'Large',
        },
        foodFields,
      ),
    ).toBe('Pizza → Chicken Pepperoni → Large');
  });

  it('skips omitted optional fields', () => {
    expect(
      formatCombinationPath(
        { Category: 'Login', Environment: 'Staging' },
        [
          { name: 'Category', enabled: true },
          { name: 'User Type', enabled: true },
          { name: 'Environment', enabled: true },
        ],
      ),
    ).toBe('Login → Staging');
  });

  it('returns a single value without an arrow separator', () => {
    expect(
      formatCombinationPath({ Category: 'Login' }, [{ name: 'Category', enabled: true }]),
    ).toBe('Login');
  });

  it('returns an empty string when there are no path parts', () => {
    expect(formatCombinationPath({}, foodFields)).toBe('');
  });
});

describe('orderedFieldNames', () => {
  it('returns only enabled field names in order', () => {
    expect(
      orderedFieldNames([
        { name: 'Category', enabled: true },
        { name: 'Notes', enabled: false },
        { name: 'Environment', enabled: true },
      ]),
    ).toEqual(['Category', 'Environment']);
  });

  it('returns an empty list when every field is disabled', () => {
    expect(orderedFieldNames([{ name: 'Category', enabled: false }])).toEqual([]);
  });
});

describe('hierarchyCsvHeaders', () => {
  it('returns no headers for zero or negative depth', () => {
    expect(hierarchyCsvHeaders(0)).toEqual([]);
    expect(hierarchyCsvHeaders(-3)).toEqual([]);
  });

  it('uses Parent/Child/Grandchild for shallow depths', () => {
    expect(hierarchyCsvHeaders(1)).toEqual(['Parent']);
    expect(hierarchyCsvHeaders(2)).toEqual(['Parent', 'Child']);
    expect(hierarchyCsvHeaders(3)).toEqual(['Parent', 'Child', 'Grandchild']);
  });

  it('floors fractional depths before choosing headers', () => {
    expect(hierarchyCsvHeaders(2.9)).toEqual(['Parent', 'Child']);
    expect(hierarchyCsvHeaders(3.2)).toEqual(['Parent', 'Child', 'Grandchild']);
  });

  it('uses Level N headers when depth exceeds three', () => {
    expect(hierarchyCsvHeaders(4)).toEqual(['Level 1', 'Level 2', 'Level 3', 'Level 4']);
    expect(hierarchyCsvHeaders(6)).toEqual([
      'Level 1',
      'Level 2',
      'Level 3',
      'Level 4',
      'Level 5',
      'Level 6',
    ]);
  });
});
