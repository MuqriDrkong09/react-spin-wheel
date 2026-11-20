import { ShareItemTree } from '@/features/wheel-share/components/ShareItemTree';
import type { WheelExportItem } from '@/features/wheel-export/types';
import { CUSTOM_FIELD_TYPE, type CustomFieldDefinition } from '@/types/customFields';
import { renderWithProviders, screen, within } from '@/test/test-utils';

const fieldDefinitions: CustomFieldDefinition[] = [
  {
    id: 'f-cuisine',
    key: 'cuisine',
    label: 'Cuisine',
    type: CUSTOM_FIELD_TYPE.text,
  },
  {
    id: 'f-price',
    key: 'price',
    label: 'Price',
    type: CUSTOM_FIELD_TYPE.number,
  },
];

function item(extra?: Partial<WheelExportItem> & { children?: WheelExportItem[] }): WheelExportItem {
  return {
    name: 'Item',
    color: '#ea580c',
    enabled: true,
    weight: 1,
    ...extra,
  };
}

describe('ShareItemTree', () => {
  it('renders an empty list when there are no items', () => {
    renderWithProviders(<ShareItemTree items={[]} />);

    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });

  it('renders nested item names with and without icons', () => {
    renderWithProviders(
      <ShareItemTree
        items={[
          item({
            name: 'Pizza',
            icon: '🍕',
            children: [item({ name: 'Pepperoni', color: '#dc2626' })],
          }),
        ]}
      />,
    );

    expect(screen.getByText('🍕 Pizza')).toBeInTheDocument();
    expect(screen.getByText('Pepperoni')).toBeInTheDocument();
    expect(screen.getAllByRole('list')).toHaveLength(2);
  });

  it('treats an empty icon as missing', () => {
    renderWithProviders(<ShareItemTree items={[item({ name: 'Plain', icon: '' })]} />);

    expect(screen.getByText('Plain')).toBeInTheDocument();
    expect(screen.queryByText(/🍕/)).not.toBeInTheDocument();
  });

  it('renders sibling items at the same level', () => {
    renderWithProviders(
      <ShareItemTree
        items={[
          item({ name: 'Pizza', icon: '🍕' }),
          item({ name: 'Sushi', color: '#0f766e' }),
        ]}
      />,
    );

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(within(items[0]!).getByText('🍕 Pizza')).toBeInTheDocument();
    expect(within(items[1]!).getByText('Sushi')).toBeInTheDocument();
  });

  it('does not nest when children is an empty array', () => {
    renderWithProviders(<ShareItemTree items={[item({ name: 'Leaf', children: [] })]} />);

    expect(screen.getByText('Leaf')).toBeInTheDocument();
    expect(screen.getAllByRole('list')).toHaveLength(1);
  });

  it('shows compact custom fields when definitions are provided', () => {
    renderWithProviders(
      <ShareItemTree
        fieldDefinitions={fieldDefinitions}
        items={[
          item({
            name: 'Pizza',
            icon: '🍕',
            customFields: {
              'f-cuisine': 'Italian',
              'f-price': 18,
            },
          }),
        ]}
      />,
    );

    expect(screen.getByText('🍕 Pizza')).toBeInTheDocument();
    expect(screen.getByText('cuisine: Italian · price: 18')).toBeInTheDocument();
  });

  it('hides compact custom fields when values are empty', () => {
    renderWithProviders(
      <ShareItemTree
        fieldDefinitions={fieldDefinitions}
        items={[
          item({
            name: 'Pizza',
            customFields: {
              'f-cuisine': '',
              'f-price': '',
            },
          }),
        ]}
      />,
    );

    expect(screen.getByText('Pizza')).toBeInTheDocument();
    expect(screen.queryByText(/cuisine:/)).not.toBeInTheDocument();
  });

  it('does not show custom fields when definitions are omitted', () => {
    renderWithProviders(
      <ShareItemTree
        items={[
          item({
            name: 'Pizza',
            customFields: { 'f-cuisine': 'Italian' },
          }),
        ]}
      />,
    );

    expect(screen.getByText('Pizza')).toBeInTheDocument();
    expect(screen.queryByText(/cuisine:/)).not.toBeInTheDocument();
  });

  it('passes field definitions into nested children', () => {
    renderWithProviders(
      <ShareItemTree
        fieldDefinitions={fieldDefinitions}
        items={[
          item({
            name: 'Pizza',
            icon: '🍕',
            customFields: { 'f-cuisine': 'Italian' },
            children: [
              item({
                name: 'Pepperoni',
                color: '#dc2626',
                customFields: { 'f-price': 12 },
              }),
            ],
          }),
        ]}
      />,
    );

    expect(screen.getByText('cuisine: Italian')).toBeInTheDocument();
    expect(screen.getByText('price: 12')).toBeInTheDocument();
    expect(screen.getByText('Pepperoni')).toBeInTheDocument();
  });

  it('supports duplicate sibling names with distinct keys', () => {
    renderWithProviders(
      <ShareItemTree
        items={[item({ name: 'Copy' }), item({ name: 'Copy', color: '#0f766e' })]}
      />,
    );

    expect(screen.getAllByText('Copy')).toHaveLength(2);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });
});
