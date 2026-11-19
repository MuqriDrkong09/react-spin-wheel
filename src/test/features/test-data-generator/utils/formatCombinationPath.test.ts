import { formatCombinationPath } from '@/features/test-data-generator/utils/formatCombinationPath';

describe('formatCombinationPath', () => {
  it('joins values in field order with arrows', () => {
    expect(
      formatCombinationPath(
        {
          Category: 'Pizza',
          Topping: 'Chicken Pepperoni',
          Size: 'Large',
        },
        [
          { name: 'Category', enabled: true },
          { name: 'Topping', enabled: true },
          { name: 'Size', enabled: true },
        ],
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
});
