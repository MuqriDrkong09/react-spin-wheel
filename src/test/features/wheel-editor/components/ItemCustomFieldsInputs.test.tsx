import { Button } from '@mui/material';

import { Form } from '@/components/common/Form';
import { ItemCustomFieldsInputs } from '@/features/wheel-editor/components/ItemCustomFieldsInputs';
import {
  defaultItemFormValues,
  itemFormSchema,
  type ItemFormValues,
} from '@/features/wheel-editor/schema';
import { useAppForm } from '@/hooks/useAppForm';
import { CUSTOM_FIELD_TYPE, type CustomFieldDefinition } from '@/types/customFields';
import { defaultCustomFieldFormValues } from '@/utils/customFields';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';

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
    id: 'f-size',
    key: 'size',
    label: 'Size',
    type: CUSTOM_FIELD_TYPE.select,
    options: ['Small', 'Large'],
  },
  {
    id: 'f-tags',
    key: 'tags',
    label: 'Tags',
    type: CUSTOM_FIELD_TYPE.multiSelect,
    options: ['Spicy', 'Vegetarian'],
  },
  {
    id: 'f-date',
    key: 'served_on',
    label: 'Served on',
    type: CUSTOM_FIELD_TYPE.date,
  },
  {
    id: 'f-url',
    key: 'menu_url',
    label: 'Menu URL',
    type: CUSTOM_FIELD_TYPE.url,
  },
];

function Harness({
  fieldDefinitions = definitions,
  onSubmit = vi.fn(),
  customFields,
}: {
  fieldDefinitions?: readonly CustomFieldDefinition[];
  onSubmit?: (values: ItemFormValues) => void;
  customFields?: ItemFormValues['customFields'];
}) {
  const form = useAppForm(itemFormSchema, {
    defaultValues: {
      ...defaultItemFormValues,
      name: 'Pizza',
      customFields: customFields ?? defaultCustomFieldFormValues(fieldDefinitions),
    },
  });

  return (
    <Form form={form} aria-label="Custom fields form" onSubmit={onSubmit}>
      <ItemCustomFieldsInputs definitions={fieldDefinitions} />
      <Button type="submit">Save</Button>
      <Button
        type="button"
        onClick={() =>
          form.setError('customFields.f-tags', {
            type: 'manual',
            message: 'Tags is required',
          })
        }
      >
        Set tags error
      </Button>
    </Form>
  );
}

describe('ItemCustomFieldsInputs', () => {
  it('renders nothing when there are no definitions', () => {
    const { container } = renderWithProviders(<Harness fieldDefinitions={[]} />);

    expect(screen.queryByLabelText(/^cuisine/i)).not.toBeInTheDocument();
    expect(container.querySelector('form')?.querySelectorAll('input, select').length ?? 0).toBe(0);
  });

  it('renders inputs for every supported custom field type', () => {
    renderWithProviders(<Harness />);

    expect(screen.getByLabelText(/^cuisine/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^price/i)).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Spicy' })).toBeInTheDocument();
    expect(screen.getByLabelText(/^size/i)).toBeInTheDocument();
    expect(screen.getByText('Tags')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Spicy' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Vegetarian' })).toBeInTheDocument();
    expect(screen.getByLabelText(/^served on/i)).toHaveAttribute('type', 'date');
    expect(screen.getByLabelText(/^menu url/i)).toHaveAttribute('type', 'url');
    expect(screen.getByPlaceholderText('https://')).toBeInTheDocument();
  });

  it('toggles boolean and multi-select values', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithProviders(<Harness onSubmit={onSubmit} />);

    await user.click(screen.getByRole('switch', { name: 'Spicy' }));
    await user.click(screen.getByRole('checkbox', { name: 'Vegetarian' }));
    await user.click(screen.getByRole('checkbox', { name: 'Spicy' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSubmit.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        customFields: expect.objectContaining({
          'f-spicy': true,
          'f-tags': ['Vegetarian', 'Spicy'],
        }),
      }),
    );
  });

  it('unchecks a multi-select option after it was selected', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithProviders(
      <Harness
        onSubmit={onSubmit}
        customFields={{
          ...defaultCustomFieldFormValues(definitions),
          'f-tags': ['Spicy'],
        }}
      />,
    );

    expect(screen.getByRole('checkbox', { name: 'Spicy' })).toBeChecked();
    await user.click(screen.getByRole('checkbox', { name: 'Spicy' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSubmit.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        customFields: expect.objectContaining({
          'f-tags': [],
        }),
      }),
    );
  });

  it('submits text, number, select, date, and url values', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithProviders(<Harness onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/^cuisine/i), 'Italian');
    await user.type(screen.getByLabelText(/^price/i), '25');
    await user.click(screen.getByLabelText(/^size/i));
    await user.click(screen.getByRole('option', { name: 'Large' }));
    await user.type(screen.getByLabelText(/^served on/i), '2026-01-15');
    await user.type(screen.getByLabelText(/^menu url/i), 'https://example.com/menu');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSubmit.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        customFields: expect.objectContaining({
          'f-cuisine': 'Italian',
          'f-price': '25',
          'f-size': 'Large',
          'f-date': '2026-01-15',
          'f-url': 'https://example.com/menu',
        }),
      }),
    );
  });

  it('allows clearing a select value back to none', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithProviders(
      <Harness
        onSubmit={onSubmit}
        customFields={{
          ...defaultCustomFieldFormValues(definitions),
          'f-size': 'Small',
        }}
      />,
    );

    await user.click(screen.getByLabelText(/^size/i));
    await user.click(screen.getByRole('option', { name: 'None' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSubmit.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        customFields: expect.objectContaining({
          'f-size': '',
        }),
      }),
    );
  });

  it('renders a multi-select legend with no options when none are defined', () => {
    renderWithProviders(
      <Harness
        fieldDefinitions={[
          {
            id: 'f-empty',
            key: 'empty_tags',
            label: 'Empty tags',
            type: CUSTOM_FIELD_TYPE.multiSelect,
          },
        ]}
      />,
    );

    expect(screen.getByText('Empty tags')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('keeps multi-select selection empty when the stored value is not an array', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderWithProviders(
      <Harness
        onSubmit={onSubmit}
        customFields={{
          ...defaultCustomFieldFormValues(definitions),
          'f-tags': 'Spicy' as unknown as string[],
        }}
      />,
    );

    expect(screen.getByRole('checkbox', { name: 'Spicy' })).not.toBeChecked();
    await user.click(screen.getByRole('checkbox', { name: 'Spicy' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSubmit.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        customFields: expect.objectContaining({
          'f-tags': ['Spicy'],
        }),
      }),
    );
  });

  it('shows a multi-select helper when the field has an error', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness />);

    expect(screen.queryByText('Tags is required')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Set tags error' }));

    expect(await screen.findByText('Tags is required')).toBeInTheDocument();
  });

  it('renders a select with only the None option when no options are defined', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderWithProviders(
      <Harness
        onSubmit={onSubmit}
        fieldDefinitions={[
          {
            id: 'f-size',
            key: 'size',
            label: 'Size',
            type: CUSTOM_FIELD_TYPE.select,
          },
        ]}
      />,
    );

    await user.click(screen.getByLabelText(/^size/i));
    expect(screen.getByRole('option', { name: 'None' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Small' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('option', { name: 'None' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSubmit.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        customFields: expect.objectContaining({
          'f-size': '',
        }),
      }),
    );
  });

  it('falls back to a text input for an unknown field type', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderWithProviders(
      <Harness
        onSubmit={onSubmit}
        fieldDefinitions={[
          {
            id: 'f-mystery',
            key: 'mystery',
            label: 'Mystery',
            type: 'mystery' as CustomFieldDefinition['type'],
          },
        ]}
        customFields={{ 'f-mystery': '' }}
      />,
    );

    const input = screen.getByLabelText(/^mystery/i);
    expect(input).toHaveAttribute('type', 'text');
    await user.type(input, 'secret');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSubmit.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        customFields: expect.objectContaining({
          'f-mystery': 'secret',
        }),
      }),
    );
  });

  it('treats a truthy non-boolean value as checked on the switch', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderWithProviders(
      <Harness
        onSubmit={onSubmit}
        fieldDefinitions={[
          {
            id: 'f-spicy',
            key: 'spicy',
            label: 'Spicy',
            type: CUSTOM_FIELD_TYPE.boolean,
          },
        ]}
        customFields={{ 'f-spicy': 'yes' as unknown as boolean }}
      />,
    );

    expect(screen.getByRole('switch', { name: 'Spicy' })).toBeChecked();
    await user.click(screen.getByRole('switch', { name: 'Spicy' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSubmit.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        customFields: expect.objectContaining({
          'f-spicy': false,
        }),
      }),
    );
  });
});
