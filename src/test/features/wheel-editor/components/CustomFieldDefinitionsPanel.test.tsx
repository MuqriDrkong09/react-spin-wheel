import { CustomFieldDefinitionsPanel } from '@/features/wheel-editor/components/CustomFieldDefinitionsPanel';
import { CUSTOM_FIELD_MESSAGES } from '@/features/wheel-editor/constants/customFields';
import { CUSTOM_FIELD_TYPE } from '@/types/customFields';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';

describe('CustomFieldDefinitionsPanel', () => {
  it('adds a text field and reports it to onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithProviders(<CustomFieldDefinitionsPanel definitions={[]} onChange={onChange} />);

    expect(screen.getByText(CUSTOM_FIELD_MESSAGES.empty)).toBeInTheDocument();

    await user.type(screen.getByLabelText(CUSTOM_FIELD_MESSAGES.label), 'Cuisine');
    await user.click(screen.getByRole('button', { name: CUSTOM_FIELD_MESSAGES.addField }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]?.[0]).toEqual([
      expect.objectContaining({
        key: 'cuisine',
        label: 'Cuisine',
        type: CUSTOM_FIELD_TYPE.text,
      }),
    ]);
  });

  it('requires options for select fields', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithProviders(<CustomFieldDefinitionsPanel definitions={[]} onChange={onChange} />);

    await user.type(screen.getByLabelText(CUSTOM_FIELD_MESSAGES.label), 'Size');
    await user.click(screen.getByLabelText(CUSTOM_FIELD_MESSAGES.type));
    await user.click(screen.getByRole('option', { name: 'Select' }));
    await user.click(screen.getByRole('button', { name: CUSTOM_FIELD_MESSAGES.addField }));

    expect(screen.getByText(CUSTOM_FIELD_MESSAGES.optionsRequired)).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('removes an existing definition', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithProviders(
      <CustomFieldDefinitionsPanel
        definitions={[
          {
            id: 'f1',
            key: 'price',
            label: 'Price',
            type: CUSTOM_FIELD_TYPE.number,
          },
        ]}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: CUSTOM_FIELD_MESSAGES.removeField('Price') }));

    expect(onChange).toHaveBeenCalledWith([]);
  });
});
