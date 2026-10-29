import { Form } from '@/components/common/Form';
import { InitialOptionsField } from '@/features/create-wheel/components/InitialOptionsField';
import { CREATE_WHEEL_MESSAGES } from '@/features/create-wheel/constants';
import {
  createWheelFormSchema,
  defaultCreateWheelValues,
  type CreateWheelFormValues,
} from '@/features/create-wheel/schema';
import { useAppForm } from '@/hooks/useAppForm';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';

function OptionsHarness({
  items = [{ name: '' }],
}: {
  items?: CreateWheelFormValues['items'];
}) {
  const form = useAppForm(createWheelFormSchema, {
    defaultValues: {
      ...defaultCreateWheelValues,
      items,
    },
  });

  return (
    <Form form={form} onSubmit={() => undefined}>
      <InitialOptionsField />
      <button type="submit">Submit options</button>
      <button
        type="button"
        onClick={() =>
          form.setError('items', { type: 'manual', message: 'Items-level error' })
        }
      >
        Set items error
      </button>
      <button
        type="button"
        onClick={() =>
          form.setError('items.root', { type: 'manual', message: 'Items root error' })
        }
      >
        Set items root error
      </button>
    </Form>
  );
}

describe('InitialOptionsField', () => {
  it('renders the helper copy and the first option', () => {
    renderWithProviders(<OptionsHarness />);

    expect(screen.getByRole('heading', { name: 'Initial options', level: 2 })).toBeInTheDocument();
    expect(screen.getByText('Add at least one option for the wheel to land on.')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /option 1/i })).toBeRequired();
    expect(screen.getByRole('button', { name: 'Remove option 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add option' })).toBeInTheDocument();
  });

  it('adds and removes option rows', async () => {
    const user = userEvent.setup();
    renderWithProviders(<OptionsHarness />);

    await user.click(screen.getByRole('button', { name: 'Add option' }));

    expect(screen.getByRole('textbox', { name: /option 1/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /option 2/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remove option 1' }));

    expect(screen.getByRole('textbox', { name: /option 1/i })).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: /option 2/i })).not.toBeInTheDocument();
  });

  it('shows the array-level error after the last option is removed', async () => {
    const user = userEvent.setup();
    renderWithProviders(<OptionsHarness />);

    await user.click(screen.getByRole('button', { name: 'Remove option 1' }));
    await user.click(screen.getByRole('button', { name: 'Submit options' }));

    expect(await screen.findByText(CREATE_WHEEL_MESSAGES.itemsRequired)).toBeInTheDocument();
    expect(
      screen.queryByText('Add at least one option for the wheel to land on.'),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: /option 1/i })).not.toBeInTheDocument();
  });

  it('prefers the items error message over the helper copy', async () => {
    const user = userEvent.setup();
    renderWithProviders(<OptionsHarness />);

    await user.click(screen.getByRole('button', { name: 'Set items error' }));

    expect(await screen.findByText('Items-level error')).toBeInTheDocument();
    expect(
      screen.queryByText('Add at least one option for the wheel to land on.'),
    ).not.toBeInTheDocument();
  });

  it('falls back to the items root error message', async () => {
    const user = userEvent.setup();
    renderWithProviders(<OptionsHarness />);

    await user.click(screen.getByRole('button', { name: 'Set items root error' }));

    expect(await screen.findByText('Items root error')).toBeInTheDocument();
    expect(
      screen.queryByText('Add at least one option for the wheel to land on.'),
    ).not.toBeInTheDocument();
  });
});
