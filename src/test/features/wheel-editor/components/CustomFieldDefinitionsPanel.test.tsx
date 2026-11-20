import { useState } from 'react';

import { CustomFieldDefinitionsPanel } from '@/features/wheel-editor/components/CustomFieldDefinitionsPanel';
import {
  CUSTOM_FIELD_MESSAGES,
  CUSTOM_FIELD_TYPE_LABELS,
} from '@/features/wheel-editor/constants/customFields';
import { CUSTOM_FIELD_TYPE, type CustomFieldDefinition } from '@/types/customFields';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';

function StatefulPanel({
  initial = [],
  onChange,
}: {
  initial?: CustomFieldDefinition[];
  onChange?: (definitions: CustomFieldDefinition[]) => void;
}) {
  const [definitions, setDefinitions] = useState(initial);

  return (
    <CustomFieldDefinitionsPanel
      definitions={definitions}
      onChange={(next) => {
        setDefinitions(next);
        onChange?.(next);
      }}
    />
  );
}

async function chooseType(user: ReturnType<typeof userEvent.setup>, label: string) {
  await user.click(screen.getByLabelText(CUSTOM_FIELD_MESSAGES.type));
  await user.click(screen.getByRole('option', { name: label }));
}

describe('CustomFieldDefinitionsPanel', () => {
  it('renders the empty state copy', () => {
    renderWithProviders(<CustomFieldDefinitionsPanel definitions={[]} onChange={vi.fn()} />);

    expect(screen.getByRole('heading', { name: CUSTOM_FIELD_MESSAGES.title, level: 2 })).toBeInTheDocument();
    expect(screen.getByText(CUSTOM_FIELD_MESSAGES.description)).toBeInTheDocument();
    expect(screen.getByText(CUSTOM_FIELD_MESSAGES.empty)).toBeInTheDocument();
  });

  it('adds a text field and reports it to onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithProviders(<CustomFieldDefinitionsPanel definitions={[]} onChange={onChange} />);

    await user.type(screen.getByLabelText(CUSTOM_FIELD_MESSAGES.label), 'Cuisine');
    await user.click(screen.getByRole('button', { name: CUSTOM_FIELD_MESSAGES.addField }));

    expect(onChange).toHaveBeenCalledTimes(1);
    const created = onChange.mock.calls[0]?.[0][0];
    expect(created).toEqual(
      expect.objectContaining({
        key: 'cuisine',
        label: 'Cuisine',
        type: CUSTOM_FIELD_TYPE.text,
      }),
    );
    expect(created.required).toBeFalsy();
    expect(created.options).toBeUndefined();
  });

  it('requires a non-empty label', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithProviders(<CustomFieldDefinitionsPanel definitions={[]} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: CUSTOM_FIELD_MESSAGES.addField }));
    expect(screen.getByText(CUSTOM_FIELD_MESSAGES.labelRequired)).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText(CUSTOM_FIELD_MESSAGES.label), '   ');
    await user.click(screen.getByRole('button', { name: CUSTOM_FIELD_MESSAGES.addField }));
    expect(screen.getByText(CUSTOM_FIELD_MESSAGES.labelRequired)).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('requires options for select fields', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithProviders(<CustomFieldDefinitionsPanel definitions={[]} onChange={onChange} />);

    await user.type(screen.getByLabelText(CUSTOM_FIELD_MESSAGES.label), 'Size');
    await chooseType(user, CUSTOM_FIELD_TYPE_LABELS[CUSTOM_FIELD_TYPE.select]);
    expect(screen.getByLabelText(CUSTOM_FIELD_MESSAGES.options)).toBeInTheDocument();
    expect(screen.getByText(CUSTOM_FIELD_MESSAGES.optionsHint)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: CUSTOM_FIELD_MESSAGES.addField }));

    expect(screen.getByText(CUSTOM_FIELD_MESSAGES.optionsRequired)).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('adds a required select field with trimmed options', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithProviders(<StatefulPanel onChange={onChange} />);

    await user.type(screen.getByLabelText(CUSTOM_FIELD_MESSAGES.label), 'Size');
    await chooseType(user, CUSTOM_FIELD_TYPE_LABELS[CUSTOM_FIELD_TYPE.select]);
    await user.type(screen.getByLabelText(CUSTOM_FIELD_MESSAGES.options), ' Small , Medium,  Large ');
    await user.click(screen.getByRole('checkbox', { name: CUSTOM_FIELD_MESSAGES.required }));
    await user.click(screen.getByRole('button', { name: CUSTOM_FIELD_MESSAGES.addField }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]?.[0]).toEqual([
      expect.objectContaining({
        key: 'size',
        label: 'Size',
        type: CUSTOM_FIELD_TYPE.select,
        required: true,
        options: ['Small', 'Medium', 'Large'],
      }),
    ]);
    expect(screen.getByText('Size *')).toBeInTheDocument();
    expect(screen.getByText(/size · Select · Small, Medium, Large/)).toBeInTheDocument();
    expect(screen.queryByText(CUSTOM_FIELD_MESSAGES.empty)).not.toBeInTheDocument();
    expect(screen.getByLabelText(CUSTOM_FIELD_MESSAGES.label)).toHaveValue('');
  });

  it('adds a multi-select field and hides options for non-option types', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithProviders(<CustomFieldDefinitionsPanel definitions={[]} onChange={onChange} />);

    await user.type(screen.getByLabelText(CUSTOM_FIELD_MESSAGES.label), 'Tags');
    await chooseType(user, CUSTOM_FIELD_TYPE_LABELS[CUSTOM_FIELD_TYPE.multiSelect]);
    expect(screen.getByLabelText(CUSTOM_FIELD_MESSAGES.options)).toBeInTheDocument();

    await user.type(screen.getByLabelText(CUSTOM_FIELD_MESSAGES.options), 'Spicy, Vegetarian');
    await user.click(screen.getByRole('button', { name: CUSTOM_FIELD_MESSAGES.addField }));

    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({
        key: 'tags',
        label: 'Tags',
        type: CUSTOM_FIELD_TYPE.multiSelect,
        options: ['Spicy', 'Vegetarian'],
      }),
    ]);

    await chooseType(user, CUSTOM_FIELD_TYPE_LABELS[CUSTOM_FIELD_TYPE.number]);
    expect(screen.queryByLabelText(CUSTOM_FIELD_MESSAGES.options)).not.toBeInTheDocument();
  });

  it('generates a unique key when labels collide', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithProviders(
      <CustomFieldDefinitionsPanel
        definitions={[
          {
            id: 'f1',
            key: 'cuisine',
            label: 'Cuisine',
            type: CUSTOM_FIELD_TYPE.text,
          },
        ]}
        onChange={onChange}
      />,
    );

    await user.type(screen.getByLabelText(CUSTOM_FIELD_MESSAGES.label), 'Cuisine');
    await user.click(screen.getByRole('button', { name: CUSTOM_FIELD_MESSAGES.addField }));

    expect(onChange.mock.calls[0]?.[0][1]).toEqual(
      expect.objectContaining({
        key: 'cuisine_2',
        label: 'Cuisine',
      }),
    );
  });

  it('lists existing definitions and removes one', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithProviders(
      <StatefulPanel
        initial={[
          {
            id: 'f1',
            key: 'price',
            label: 'Price',
            type: CUSTOM_FIELD_TYPE.number,
            required: true,
          },
          {
            id: 'f2',
            key: 'size',
            label: 'Size',
            type: CUSTOM_FIELD_TYPE.select,
            options: ['S', 'L'],
          },
        ]}
        onChange={onChange}
      />,
    );

    expect(screen.getByText('Price *')).toBeInTheDocument();
    expect(screen.getByText(/price · Number/)).toBeInTheDocument();
    expect(screen.getByText(/size · Select · S, L/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: CUSTOM_FIELD_MESSAGES.removeField('Price') }));

    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'f2', key: 'size', label: 'Size' }),
    ]);
    expect(screen.queryByText('Price *')).not.toBeInTheDocument();
    expect(screen.getByText('Size')).toBeInTheDocument();
  });

  it('clears a validation error after a successful add', async () => {
    const user = userEvent.setup();

    renderWithProviders(<StatefulPanel />);

    await user.click(screen.getByRole('button', { name: CUSTOM_FIELD_MESSAGES.addField }));
    expect(screen.getByText(CUSTOM_FIELD_MESSAGES.labelRequired)).toBeInTheDocument();

    await user.type(screen.getByLabelText(CUSTOM_FIELD_MESSAGES.label), 'Notes');
    await user.click(screen.getByRole('button', { name: CUSTOM_FIELD_MESSAGES.addField }));

    expect(screen.queryByText(CUSTOM_FIELD_MESSAGES.labelRequired)).not.toBeInTheDocument();
    expect(screen.getByText('Notes')).toBeInTheDocument();
  });

  it('marks the label field in error when a blank label is submitted', async () => {
    const user = userEvent.setup();

    renderWithProviders(<CustomFieldDefinitionsPanel definitions={[]} onChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: CUSTOM_FIELD_MESSAGES.addField }));

    expect(screen.getByLabelText(CUSTOM_FIELD_MESSAGES.label)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText(CUSTOM_FIELD_MESSAGES.labelRequired)).toBeInTheDocument();
  });
});
