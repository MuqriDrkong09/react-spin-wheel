import { ItemCustomFieldsDetails } from '@/features/wheel-editor/components/ItemCustomFieldsDetails';
import { CUSTOM_FIELD_MESSAGES } from '@/features/wheel-editor/constants/customFields';
import { CUSTOM_FIELD_TYPE, type CustomFieldDefinition } from '@/types/customFields';
import { renderWithProviders, screen } from '@/test/test-utils';

const definitions: CustomFieldDefinition[] = [
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
  {
    id: 'f-spicy',
    key: 'spicy',
    label: 'Spicy',
    type: CUSTOM_FIELD_TYPE.boolean,
  },
  {
    id: 'f-tags',
    key: 'tags',
    label: 'Tags',
    type: CUSTOM_FIELD_TYPE.multiSelect,
    options: ['Spicy', 'Vegetarian'],
  },
  {
    id: 'f-url',
    key: 'menu_url',
    label: 'Menu URL',
    type: CUSTOM_FIELD_TYPE.url,
  },
];

describe('ItemCustomFieldsDetails', () => {
  it('renders nothing when there are no definitions', () => {
    const { container } = renderWithProviders(
      <ItemCustomFieldsDetails definitions={[]} values={{ 'f-cuisine': 'Italian' }} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing in compact mode when every value is empty', () => {
    const { container } = renderWithProviders(
      <ItemCustomFieldsDetails
        compact
        definitions={definitions}
        values={{
          'f-cuisine': '  ',
          'f-tags': [],
        }}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the details heading and all definition rows including empty placeholders', () => {
    renderWithProviders(
      <ItemCustomFieldsDetails
        definitions={definitions}
        values={{
          'f-cuisine': 'Italian',
          'f-price': 12,
          'f-spicy': true,
          'f-tags': ['Spicy', 'Vegetarian'],
        }}
      />,
    );

    expect(
      screen.getByRole('heading', { name: CUSTOM_FIELD_MESSAGES.detailsHeading, level: 3 }),
    ).toBeInTheDocument();
    expect(screen.getByText('Cuisine')).toBeInTheDocument();
    expect(screen.getByText('Italian')).toBeInTheDocument();
    expect(screen.getByText('Price')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Spicy')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('Tags')).toBeInTheDocument();
    expect(screen.getByText('Spicy, Vegetarian')).toBeInTheDocument();
    expect(screen.getByText('Menu URL')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('formats boolean false and numeric zero in the full details list', () => {
    renderWithProviders(
      <ItemCustomFieldsDetails
        definitions={[
          definitions[1]!,
          definitions[2]!,
        ]}
        values={{
          'f-price': 0,
          'f-spicy': false,
        }}
      />,
    );

    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  it('renders a compact summary of only populated values', () => {
    renderWithProviders(
      <ItemCustomFieldsDetails
        compact
        definitions={definitions}
        values={{
          'f-cuisine': 'Italian',
          'f-price': 18,
          'f-spicy': false,
          'f-tags': [],
          'f-url': '',
        }}
      />,
    );

    expect(screen.getByText('cuisine: Italian · price: 18 · spicy: No')).toBeInTheDocument();
    expect(screen.queryByText(/tags:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/menu_url:/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: CUSTOM_FIELD_MESSAGES.detailsHeading }),
    ).not.toBeInTheDocument();
  });

  it('renders nothing when every definition value is missing', () => {
    const { container: full } = renderWithProviders(
      <ItemCustomFieldsDetails definitions={[definitions[0]!]} />,
    );
    expect(full).toBeEmptyDOMElement();

    const { container: compact } = renderWithProviders(
      <ItemCustomFieldsDetails compact definitions={[definitions[0]!]} />,
    );
    expect(compact).toBeEmptyDOMElement();
  });

  it('still shows empty placeholders beside populated fields in full mode', () => {
    renderWithProviders(
      <ItemCustomFieldsDetails
        definitions={[definitions[0]!, definitions[4]!]}
        values={{ 'f-cuisine': 'Italian' }}
      />,
    );

    expect(screen.getByText('Cuisine')).toBeInTheDocument();
    expect(screen.getByText('Italian')).toBeInTheDocument();
    expect(screen.getByText('Menu URL')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
