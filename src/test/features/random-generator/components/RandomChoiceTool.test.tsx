import { CHOICE_PRESETS, GENERATOR_MESSAGES } from '@/features/random-generator/constants';
import { RandomChoiceTool } from '@/features/random-generator/components/RandomChoiceTool';
import * as generateRandomChoice from '@/features/random-generator/utils/generateRandomChoice';
import { renderWithProviders, screen, userEvent, within } from '@/test/test-utils';

async function selectPreset(user: ReturnType<typeof userEvent.setup>, label: string) {
  const form = screen.getByRole('form', { name: GENERATOR_MESSAGES.choiceTab });
  await user.click(within(form).getByLabelText(GENERATOR_MESSAGES.choicePresetLabel));
  await user.click(await screen.findByRole('option', { name: label }));
  return form;
}

describe('RandomChoiceTool', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the default yes/no preset with a preview and empty result', () => {
    renderWithProviders(<RandomChoiceTool />);

    const form = screen.getByRole('form', { name: GENERATOR_MESSAGES.choiceTab });
    expect(within(form).getByText(GENERATOR_MESSAGES.choiceHint)).toBeInTheDocument();
    expect(within(form).getByLabelText(GENERATOR_MESSAGES.choicePresetLabel)).toBeInTheDocument();
    expect(within(form).getByText(CHOICE_PRESETS.yesNo.options.join(' · '))).toBeInTheDocument();
    expect(within(form).getByRole('status')).toHaveTextContent(GENERATOR_MESSAGES.emptyResult);
    expect(
      within(form).getByRole('button', { name: GENERATOR_MESSAGES.generateChoice }),
    ).toBeInTheDocument();
    expect(within(form).queryByRole('group', { name: GENERATOR_MESSAGES.customListLabel })).not.toBeInTheDocument();
  });

  it('generates from the default preset and switches the submit label', async () => {
    const user = userEvent.setup();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    renderWithProviders(<RandomChoiceTool />);

    const form = screen.getByRole('form', { name: GENERATOR_MESSAGES.choiceTab });
    await user.click(within(form).getByRole('button', { name: GENERATOR_MESSAGES.generateChoice }));

    expect(within(form).getByRole('status')).toHaveTextContent('Yes');
    expect(
      within(form).getByRole('button', { name: GENERATOR_MESSAGES.generateAgain }),
    ).toBeInTheDocument();
  });

  it('updates the preset preview for heads/tails and true/false', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RandomChoiceTool />);

    let form = await selectPreset(user, CHOICE_PRESETS.headsTails.label);
    expect(within(form).getByText(CHOICE_PRESETS.headsTails.options.join(' · '))).toBeInTheDocument();

    form = await selectPreset(user, CHOICE_PRESETS.trueFalse.label);
    expect(within(form).getByText(CHOICE_PRESETS.trueFalse.options.join(' · '))).toBeInTheDocument();
  });

  it('shows custom options, keeps remove disabled at two rows, and can add another option', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RandomChoiceTool />);

    const form = await selectPreset(user, GENERATOR_MESSAGES.customListLabel);
    const group = within(form).getByRole('group', { name: GENERATOR_MESSAGES.customListLabel });

    expect(within(group).getByLabelText('Option 1')).toBeInTheDocument();
    expect(within(group).getByLabelText('Option 2')).toBeInTheDocument();
    expect(within(group).getByRole('button', { name: GENERATOR_MESSAGES.removeChoice(1) })).toBeDisabled();
    expect(within(group).getByRole('button', { name: GENERATOR_MESSAGES.removeChoice(2) })).toBeDisabled();

    await user.click(within(group).getByRole('button', { name: GENERATOR_MESSAGES.addChoice }));

    expect(within(group).getByLabelText('Option 3')).toBeInTheDocument();
    expect(within(group).getByRole('button', { name: GENERATOR_MESSAGES.removeChoice(1) })).toBeEnabled();

    await user.click(within(group).getByRole('button', { name: GENERATOR_MESSAGES.removeChoice(3) }));
    expect(within(group).queryByLabelText('Option 3')).not.toBeInTheDocument();
  });

  it('validates a custom list that is too short', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RandomChoiceTool />);

    const form = await selectPreset(user, GENERATOR_MESSAGES.customListLabel);
    await user.type(within(form).getByLabelText('Option 1'), 'Stay in');
    await user.click(within(form).getByRole('button', { name: GENERATOR_MESSAGES.generateChoice }));

    expect(await within(form).findByRole('alert')).toHaveTextContent(GENERATOR_MESSAGES.choicesRequired);
  });

  it('generates from a valid custom list', async () => {
    const user = userEvent.setup();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    renderWithProviders(<RandomChoiceTool />);

    const form = await selectPreset(user, GENERATOR_MESSAGES.customListLabel);
    await user.type(within(form).getByLabelText('Option 1'), 'Stay in');
    await user.type(within(form).getByLabelText('Option 2'), 'Go out');
    await user.click(within(form).getByRole('button', { name: GENERATOR_MESSAGES.generateChoice }));

    expect(within(form).getByRole('status')).toHaveTextContent('Stay in');
  });

  it('surfaces a generator error without keeping a previous value', async () => {
    const user = userEvent.setup();
    vi.spyOn(generateRandomChoice, 'generateRandomChoice').mockReturnValue({
      ok: false,
      error: GENERATOR_MESSAGES.choicesRequired,
    });
    renderWithProviders(<RandomChoiceTool />);

    const form = screen.getByRole('form', { name: GENERATOR_MESSAGES.choiceTab });
    await user.click(within(form).getByRole('button', { name: GENERATOR_MESSAGES.generateChoice }));

    expect(within(form).getByRole('alert')).toHaveTextContent(GENERATOR_MESSAGES.choicesRequired);
    expect(within(form).queryByLabelText(GENERATOR_MESSAGES.resultLabel)).not.toBeInTheDocument();
  });
});
