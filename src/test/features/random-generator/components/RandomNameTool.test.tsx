import { RandomNameTool } from '@/features/random-generator/components/RandomNameTool';
import { GENERATOR_MESSAGES } from '@/features/random-generator/constants';
import { FIRST_NAMES, LAST_NAMES } from '@/features/random-generator/data/names';
import * as generateRandomName from '@/features/random-generator/utils/generateRandomName';
import { renderWithProviders, screen, userEvent, within } from '@/test/test-utils';

describe('RandomNameTool', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the default full-name style with an empty result', () => {
    renderWithProviders(<RandomNameTool />);

    const form = screen.getByRole('form', { name: GENERATOR_MESSAGES.nameTab });
    expect(within(form).getByText(GENERATOR_MESSAGES.nameHint)).toBeInTheDocument();
    expect(within(form).getByRole('radiogroup', { name: GENERATOR_MESSAGES.nameStyleLabel })).toBeInTheDocument();
    expect(within(form).getByRole('radio', { name: GENERATOR_MESSAGES.fullNameLabel })).toBeChecked();
    expect(within(form).getByLabelText(GENERATOR_MESSAGES.nameCountLabel)).toHaveValue(1);
    expect(within(form).getByRole('status')).toHaveTextContent(GENERATOR_MESSAGES.emptyResult);
    expect(within(form).getByRole('button', { name: GENERATOR_MESSAGES.generateName })).toBeInTheDocument();
  });

  it('generates a full name and switches the submit label', async () => {
    const user = userEvent.setup();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    renderWithProviders(<RandomNameTool />);

    const form = screen.getByRole('form', { name: GENERATOR_MESSAGES.nameTab });
    await user.click(within(form).getByRole('button', { name: GENERATOR_MESSAGES.generateName }));

    expect(within(form).getByRole('status')).toHaveTextContent(
      `${FIRST_NAMES[0]} ${LAST_NAMES[0]}`,
    );
    expect(
      within(form).getByRole('button', { name: GENERATOR_MESSAGES.generateAgain }),
    ).toBeInTheDocument();
  });

  it('generates a first name and a last name when those styles are selected', async () => {
    const user = userEvent.setup();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    renderWithProviders(<RandomNameTool />);

    const form = screen.getByRole('form', { name: GENERATOR_MESSAGES.nameTab });

    await user.click(within(form).getByRole('radio', { name: GENERATOR_MESSAGES.firstNameLabel }));
    await user.click(within(form).getByRole('button', { name: GENERATOR_MESSAGES.generateName }));
    expect(within(form).getByRole('status')).toHaveTextContent(FIRST_NAMES[0]!);

    await user.click(within(form).getByRole('radio', { name: GENERATOR_MESSAGES.lastNameLabel }));
    await user.click(within(form).getByRole('button', { name: GENERATOR_MESSAGES.generateAgain }));
    expect(within(form).getByRole('status')).toHaveTextContent(LAST_NAMES[0]!);
  });

  it('generates multiple names from the count field', async () => {
    const user = userEvent.setup();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    renderWithProviders(<RandomNameTool />);

    const form = screen.getByRole('form', { name: GENERATOR_MESSAGES.nameTab });
    await user.clear(within(form).getByLabelText(GENERATOR_MESSAGES.nameCountLabel));
    await user.type(within(form).getByLabelText(GENERATOR_MESSAGES.nameCountLabel), '3');
    await user.click(within(form).getByRole('button', { name: GENERATOR_MESSAGES.generateName }));

    const result = within(form).getByLabelText(GENERATOR_MESSAGES.resultLabel);
    expect(within(result).getAllByText(`${FIRST_NAMES[0]} ${LAST_NAMES[0]}`)).toHaveLength(3);
  });

  it('shows validation for an out-of-range name count', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RandomNameTool />);

    const form = screen.getByRole('form', { name: GENERATOR_MESSAGES.nameTab });
    await user.clear(within(form).getByLabelText(GENERATOR_MESSAGES.nameCountLabel));
    await user.type(within(form).getByLabelText(GENERATOR_MESSAGES.nameCountLabel), '21');
    await user.click(within(form).getByRole('button', { name: GENERATOR_MESSAGES.generateName }));

    expect(
      await within(form).findByText(GENERATOR_MESSAGES.nameCountRequired),
    ).toBeInTheDocument();
  });

  it('surfaces a generator error without keeping a previous value', async () => {
    const user = userEvent.setup();
    vi.spyOn(generateRandomName, 'generateRandomName').mockReturnValue({
      ok: false,
      error: GENERATOR_MESSAGES.nameCountRequired,
    });
    renderWithProviders(<RandomNameTool />);

    const form = screen.getByRole('form', { name: GENERATOR_MESSAGES.nameTab });
    await user.click(within(form).getByRole('button', { name: GENERATOR_MESSAGES.generateName }));

    expect(within(form).getByRole('alert')).toHaveTextContent(GENERATOR_MESSAGES.nameCountRequired);
    expect(within(form).queryByLabelText(GENERATOR_MESSAGES.resultLabel)).not.toBeInTheDocument();
  });
});
