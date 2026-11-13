import { RandomNumberTool } from '@/features/random-generator/components/RandomNumberTool';
import { GENERATOR_MESSAGES } from '@/features/random-generator/constants';
import * as generateRandomNumber from '@/features/random-generator/utils/generateRandomNumber';
import { renderWithProviders, screen, userEvent, within } from '@/test/test-utils';

describe('RandomNumberTool', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders integer defaults with decimals hidden and an empty result', () => {
    renderWithProviders(<RandomNumberTool />);

    const form = screen.getByRole('form', { name: GENERATOR_MESSAGES.numberTab });
    expect(within(form).getByText(GENERATOR_MESSAGES.numberHint)).toBeInTheDocument();
    expect(within(form).getByLabelText(GENERATOR_MESSAGES.minLabel)).toHaveValue(1);
    expect(within(form).getByLabelText(GENERATOR_MESSAGES.maxLabel)).toHaveValue(100);
    expect(within(form).getByRole('radio', { name: GENERATOR_MESSAGES.integerLabel })).toBeChecked();
    expect(within(form).queryByLabelText(GENERATOR_MESSAGES.decimalsLabel)).not.toBeInTheDocument();
    expect(within(form).getByRole('status')).toHaveTextContent(GENERATOR_MESSAGES.emptyResult);
    expect(
      within(form).getByRole('button', { name: GENERATOR_MESSAGES.generateNumber }),
    ).toBeInTheDocument();
  });

  it('generates an integer in range and switches the submit label', async () => {
    const user = userEvent.setup();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    renderWithProviders(<RandomNumberTool />);

    const form = screen.getByRole('form', { name: GENERATOR_MESSAGES.numberTab });
    await user.clear(within(form).getByLabelText(GENERATOR_MESSAGES.minLabel));
    await user.type(within(form).getByLabelText(GENERATOR_MESSAGES.minLabel), '5');
    await user.clear(within(form).getByLabelText(GENERATOR_MESSAGES.maxLabel));
    await user.type(within(form).getByLabelText(GENERATOR_MESSAGES.maxLabel), '9');
    await user.click(within(form).getByRole('button', { name: GENERATOR_MESSAGES.generateNumber }));

    expect(within(form).getByRole('status')).toHaveTextContent('5');
    expect(
      within(form).getByRole('button', { name: GENERATOR_MESSAGES.generateAgain }),
    ).toBeInTheDocument();
  });

  it('shows the decimals field for decimal mode and generates a formatted value', async () => {
    const user = userEvent.setup();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    renderWithProviders(<RandomNumberTool />);

    const form = screen.getByRole('form', { name: GENERATOR_MESSAGES.numberTab });
    await user.click(within(form).getByRole('radio', { name: GENERATOR_MESSAGES.decimalLabel }));

    expect(within(form).getByLabelText(GENERATOR_MESSAGES.decimalsLabel)).toHaveValue(2);

    await user.click(within(form).getByRole('button', { name: GENERATOR_MESSAGES.generateNumber }));

    expect(within(form).getByRole('status')).toHaveTextContent('1.00');
  });

  it('hides the decimals field again when switching back to integer', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RandomNumberTool />);

    const form = screen.getByRole('form', { name: GENERATOR_MESSAGES.numberTab });
    await user.click(within(form).getByRole('radio', { name: GENERATOR_MESSAGES.decimalLabel }));
    expect(within(form).getByLabelText(GENERATOR_MESSAGES.decimalsLabel)).toBeInTheDocument();

    await user.click(within(form).getByRole('radio', { name: GENERATOR_MESSAGES.integerLabel }));
    expect(within(form).queryByLabelText(GENERATOR_MESSAGES.decimalsLabel)).not.toBeInTheDocument();
  });

  it('shows validation when minimum is greater than maximum', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RandomNumberTool />);

    const form = screen.getByRole('form', { name: GENERATOR_MESSAGES.numberTab });
    await user.clear(within(form).getByLabelText(GENERATOR_MESSAGES.minLabel));
    await user.type(within(form).getByLabelText(GENERATOR_MESSAGES.minLabel), '10');
    await user.clear(within(form).getByLabelText(GENERATOR_MESSAGES.maxLabel));
    await user.type(within(form).getByLabelText(GENERATOR_MESSAGES.maxLabel), '1');
    await user.click(within(form).getByRole('button', { name: GENERATOR_MESSAGES.generateNumber }));

    expect(
      await within(form).findByText(GENERATOR_MESSAGES.minGreaterThanMax),
    ).toBeInTheDocument();
  });

  it('surfaces a generator error without keeping a previous value', async () => {
    const user = userEvent.setup();
    vi.spyOn(generateRandomNumber, 'generateRandomNumber').mockReturnValue({
      ok: false,
      error: GENERATOR_MESSAGES.invalidIntegerRange,
    });
    renderWithProviders(<RandomNumberTool />);

    const form = screen.getByRole('form', { name: GENERATOR_MESSAGES.numberTab });
    await user.click(within(form).getByRole('button', { name: GENERATOR_MESSAGES.generateNumber }));

    expect(within(form).getByRole('alert')).toHaveTextContent(
      GENERATOR_MESSAGES.invalidIntegerRange,
    );
    expect(within(form).queryByLabelText(GENERATOR_MESSAGES.resultLabel)).not.toBeInTheDocument();
  });
});
