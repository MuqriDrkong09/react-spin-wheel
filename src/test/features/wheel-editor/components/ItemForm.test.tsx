import type { ComponentProps } from 'react';

import { ITEM_COLORS } from '@/constants/wheel';
import { ItemForm } from '@/features/wheel-editor/components/ItemForm';
import { EDITOR_MESSAGES } from '@/features/wheel-editor/constants';
import { CUSTOM_FIELD_MESSAGES } from '@/features/wheel-editor/constants/customFields';
import { childItemFormSchema, defaultItemFormValues } from '@/features/wheel-editor/schema';
import { CUSTOM_FIELD_TYPE, type CustomFieldDefinition } from '@/types/customFields';
import { renderWithProviders, screen, userEvent, waitFor, within } from '@/test/test-utils';

const pizzaFields: CustomFieldDefinition[] = [
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
    required: true,
  },
  {
    id: 'f-spicy',
    key: 'spicy',
    label: 'Spicy',
    type: CUSTOM_FIELD_TYPE.boolean,
  },
];

function renderForm(overrides: Partial<ComponentProps<typeof ItemForm>> = {}) {
  const props = {
    submitLabel: 'Save item',
    onSubmit: vi.fn(),
    ...overrides,
  };

  renderWithProviders(<ItemForm {...props} />);
  return props;
}

describe('ItemForm', () => {
  it('renders default fields without a cancel action', async () => {
    renderForm();

    expect(screen.getByLabelText(/^name/i)).toHaveValue('');
    expect(screen.getByLabelText(/^name/i)).toHaveFocus();
    expect(screen.getByLabelText(/^description/i)).toHaveValue('');
    expect(screen.getByLabelText(/^icon/i)).toHaveValue('');
    expect(screen.getByRole('combobox', { name: 'Color' })).toHaveTextContent(ITEM_COLORS[0]);
    expect(screen.getByRole('spinbutton', { name: /weight/i })).toHaveValue(1);
    expect(screen.getByRole('switch', { name: 'Enabled' })).toBeChecked();
    expect(screen.getByRole('button', { name: 'Save item' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
  });

  it('applies custom labels, ids, and default values', async () => {
    renderForm({
      nameLabel: 'Child name',
      ariaLabel: 'Add Child Data',
      formId: 'add-child-form',
      autoFocus: false,
      defaultValues: {
        ...defaultItemFormValues,
        name: 'Salmon',
        description: 'Fresh',
        icon: '🐟',
        weight: 2,
        enabled: false,
      },
    });

    const form = screen.getByRole('form', { name: 'Add Child Data' });
    expect(form).toHaveAttribute('id', 'add-child-form');
    expect(within(form).getByLabelText(/child name/i)).toHaveValue('Salmon');
    expect(within(form).getByLabelText(/child name/i)).not.toHaveFocus();
    expect(within(form).getByLabelText(/^description/i)).toHaveValue('Fresh');
    expect(within(form).getByLabelText(/^icon/i)).toHaveValue('🐟');
    expect(within(form).getByRole('spinbutton', { name: /weight/i })).toHaveValue(2);
    expect(within(form).getByRole('switch', { name: 'Enabled' })).not.toBeChecked();
  });

  it('closes from Cancel', async () => {
    const user = userEvent.setup();
    const { onCancel } = renderForm({ onCancel: vi.fn() });

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('rejects an empty name', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await user.click(screen.getByRole('button', { name: 'Save item' }));

    expect(await screen.findByText(EDITOR_MESSAGES.nameRequired)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('uses a custom schema for child names', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm({ schema: childItemFormSchema });

    await user.click(screen.getByRole('button', { name: 'Save item' }));

    expect(await screen.findByText(EDITOR_MESSAGES.childNameRequired)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits edited values including color, weight, and enabled', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await user.type(screen.getByLabelText(/^name/i), 'Taco');
    await user.type(screen.getByLabelText(/^description/i), 'Street food');
    await user.type(screen.getByLabelText(/^icon/i), '🌮');
    await user.click(screen.getByRole('combobox', { name: 'Color' }));
    await user.click(screen.getByRole('option', { name: ITEM_COLORS[1] }));
    await user.clear(screen.getByRole('spinbutton', { name: /weight/i }));
    await user.type(screen.getByRole('spinbutton', { name: /weight/i }), '3');
    await user.click(screen.getByRole('switch', { name: 'Enabled' }));
    await user.click(screen.getByRole('button', { name: 'Save item' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Taco',
      description: 'Street food',
      icon: '🌮',
      color: ITEM_COLORS[1],
      weight: 3,
      enabled: false,
      customFields: {},
    });
  });

  it('resets to defaults after submit when asked', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm({ resetOnSubmit: true, submitLabel: 'Add item' });

    await user.type(screen.getByLabelText(/^name/i), 'Taco');
    await user.click(screen.getByRole('button', { name: 'Add item' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.getByLabelText(/^name/i)).toHaveValue('');
    });
    expect(screen.getByRole('spinbutton', { name: /weight/i })).toHaveValue(1);
    expect(screen.getByRole('switch', { name: 'Enabled' })).toBeChecked();
  });

  it('rejects a weight below 1', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await user.type(screen.getByLabelText(/^name/i), 'Taco');
    await user.clear(screen.getByRole('spinbutton', { name: /weight/i }));
    await user.type(screen.getByRole('spinbutton', { name: /weight/i }), '0');
    await user.click(screen.getByRole('button', { name: 'Save item' }));

    expect(await screen.findByText(EDITOR_MESSAGES.weightMin)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits custom field values for defined fields', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm({
      fieldDefinitions: pizzaFields,
      defaultValues: {
        ...defaultItemFormValues,
        customFields: {
          'f-cuisine': '',
          'f-price': '',
          'f-spicy': false,
        },
      },
    });

    expect(screen.getByRole('heading', { name: CUSTOM_FIELD_MESSAGES.detailsHeading })).toBeInTheDocument();
    expect(screen.getByLabelText(/^cuisine/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^price/i)).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Spicy' })).toBeInTheDocument();

    await user.type(screen.getByLabelText(/^name/i), 'Pizza');
    await user.type(screen.getByLabelText(/^cuisine/i), 'Italian');
    await user.type(screen.getByLabelText(/^price/i), '25');
    await user.click(screen.getByRole('button', { name: 'Save item' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Pizza',
        customFields: {
          'f-cuisine': 'Italian',
          'f-price': '25',
          'f-spicy': false,
        },
      }),
    );
  });

  it('blocks submit when a required custom field is empty', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm({
      fieldDefinitions: pizzaFields,
      defaultValues: {
        ...defaultItemFormValues,
        customFields: {
          'f-cuisine': '',
          'f-price': '',
          'f-spicy': false,
        },
      },
    });

    await user.type(screen.getByLabelText(/^name/i), 'Pizza');
    await user.click(screen.getByRole('button', { name: 'Save item' }));

    expect(await screen.findByText('Price is required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows the icon placeholder', () => {
    renderForm();

    expect(screen.getByPlaceholderText('🍕')).toBeInTheDocument();
  });

  it('hides the custom fields section when there are no definitions', () => {
    renderForm({ fieldDefinitions: [] });

    expect(
      screen.queryByRole('heading', { name: CUSTOM_FIELD_MESSAGES.detailsHeading }),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^cuisine/i)).not.toBeInTheDocument();
  });

  it('rejects a name longer than 100 characters', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await user.type(screen.getByLabelText(/^name/i), 'A'.repeat(101));
    await user.click(screen.getByRole('button', { name: 'Save item' }));

    expect(await screen.findByText(EDITOR_MESSAGES.nameMax)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects a whitespace-only name', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await user.type(screen.getByLabelText(/^name/i), '   ');
    await user.click(screen.getByRole('button', { name: 'Save item' }));

    expect(await screen.findByText(EDITOR_MESSAGES.nameRequired)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows a custom field validation message for an invalid URL', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm({
      fieldDefinitions: [
        {
          id: 'f-url',
          key: 'menu_url',
          label: 'Menu URL',
          type: CUSTOM_FIELD_TYPE.url,
        },
      ],
      defaultValues: {
        ...defaultItemFormValues,
        customFields: {
          'f-url': '',
        },
      },
    });

    await user.type(screen.getByLabelText(/^name/i), 'Pizza');
    await user.type(screen.getByLabelText(/^menu url/i), 'not-a-url');
    await user.click(screen.getByRole('button', { name: 'Save item' }));

    expect(await screen.findByText('Menu URL must be a valid http(s) URL')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows a live custom fields preview when enabled', async () => {
    const user = userEvent.setup();
    const previewFields: CustomFieldDefinition[] = [
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

    renderForm({
      fieldDefinitions: previewFields,
      showDetailsPreview: true,
      defaultValues: {
        ...defaultItemFormValues,
        customFields: {
          'f-cuisine': '',
          'f-price': '',
        },
      },
    });

    expect(
      screen.getAllByRole('heading', { name: CUSTOM_FIELD_MESSAGES.detailsHeading }),
    ).toHaveLength(1);

    await user.type(screen.getByLabelText(/^cuisine/i), 'Italian');
    await user.type(screen.getByLabelText(/^price/i), '25');

    await waitFor(() => {
      expect(
        screen.getAllByRole('heading', { name: CUSTOM_FIELD_MESSAGES.detailsHeading }),
      ).toHaveLength(2);
    });
    expect(screen.getByText('Italian')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('preserves color and custom fields when resetting after submit', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm({
      resetOnSubmit: true,
      submitLabel: 'Add item',
      fieldDefinitions: pizzaFields,
      defaultValues: {
        ...defaultItemFormValues,
        color: ITEM_COLORS[2],
        customFields: {
          'f-cuisine': 'Italian',
          'f-price': '10',
          'f-spicy': true,
        },
      },
    });

    expect(screen.getByRole('combobox', { name: 'Color' })).toHaveTextContent(ITEM_COLORS[2]);
    expect(screen.getByLabelText(/^cuisine/i)).toHaveValue('Italian');
    expect(screen.getByLabelText(/^price/i)).toHaveValue(10);
    expect(screen.getByRole('switch', { name: 'Spicy' })).toBeChecked();

    await user.type(screen.getByLabelText(/^name/i), 'Calzone');
    await user.click(screen.getByRole('button', { name: 'Add item' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.getByLabelText(/^name/i)).toHaveValue('');
    });
    expect(screen.getByRole('combobox', { name: 'Color' })).toHaveTextContent(ITEM_COLORS[2]);
    expect(screen.getByLabelText(/^cuisine/i)).toHaveValue('Italian');
    expect(screen.getByLabelText(/^price/i)).toHaveValue(10);
    expect(screen.getByRole('switch', { name: 'Spicy' })).toBeChecked();
    expect(screen.getByRole('spinbutton', { name: /weight/i })).toHaveValue(1);
    expect(screen.getByRole('switch', { name: 'Enabled' })).toBeChecked();
  });

  it('submits a toggled boolean custom field', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm({
      fieldDefinitions: pizzaFields,
      defaultValues: {
        ...defaultItemFormValues,
        customFields: {
          'f-cuisine': '',
          'f-price': '12',
          'f-spicy': false,
        },
      },
    });

    await user.type(screen.getByLabelText(/^name/i), 'Pizza');
    await user.click(screen.getByRole('switch', { name: 'Spicy' }));
    await user.click(screen.getByRole('button', { name: 'Save item' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Pizza',
        customFields: {
          'f-cuisine': '',
          'f-price': '12',
          'f-spicy': true,
        },
      }),
    );
  });

  it('keeps field values after submit when reset is not requested', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await user.type(screen.getByLabelText(/^name/i), 'Taco');
    await user.type(screen.getByLabelText(/^description/i), 'Crunchy');
    await user.click(screen.getByRole('button', { name: 'Save item' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText(/^name/i)).toHaveValue('Taco');
    expect(screen.getByLabelText(/^description/i)).toHaveValue('Crunchy');
  });

  it('does not show the details preview unless asked', async () => {
    const user = userEvent.setup();
    renderForm({
      fieldDefinitions: [
        {
          id: 'f-cuisine',
          key: 'cuisine',
          label: 'Cuisine',
          type: CUSTOM_FIELD_TYPE.text,
        },
      ],
      showDetailsPreview: false,
      defaultValues: {
        ...defaultItemFormValues,
        customFields: { 'f-cuisine': '' },
      },
    });

    await user.type(screen.getByLabelText(/^cuisine/i), 'Italian');

    expect(
      screen.getAllByRole('heading', { name: CUSTOM_FIELD_MESSAGES.detailsHeading }),
    ).toHaveLength(1);
    expect(screen.queryByText('Italian')).not.toBeInTheDocument();
    expect(screen.getByLabelText(/^cuisine/i)).toHaveValue('Italian');
  });

  it('lists every palette color in the color select', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('combobox', { name: 'Color' }));

    for (const color of ITEM_COLORS) {
      expect(screen.getByRole('option', { name: color })).toBeInTheDocument();
    }
  });

  it('trims description and icon before submit', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await user.type(screen.getByLabelText(/^name/i), '  Taco  ');
    await user.type(screen.getByLabelText(/^description/i), '  Street food  ');
    await user.type(screen.getByLabelText(/^icon/i), '  🌮  ');
    await user.click(screen.getByRole('button', { name: 'Save item' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Taco',
        description: 'Street food',
        icon: '🌮',
      }),
    );
  });

  it('exposes min and step on the weight input', () => {
    renderForm();

    const weight = screen.getByRole('spinbutton', { name: /weight/i });
    expect(weight).toHaveAttribute('min', '1');
    expect(weight).toHaveAttribute('step', '1');
  });

  it('submits successfully with the child item schema', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm({
      schema: childItemFormSchema,
      nameLabel: 'Child name',
    });

    await user.type(screen.getByLabelText(/child name/i), 'Salmon');
    await user.click(screen.getByRole('button', { name: 'Save item' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Salmon',
      }),
    );
  });
});
