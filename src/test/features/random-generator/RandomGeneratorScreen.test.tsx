import { ROUTES } from '@/constants/routes';
import { GENERATOR_MESSAGES } from '@/features/random-generator/constants';
import { FIRST_NAMES, LAST_NAMES } from '@/features/random-generator/data/names';
import { resetGeneratorHistoryStore } from '@/stores/generatorHistoryStore';
import { renderApp, screen, userEvent, within } from '@/test/test-utils';

describe('RandomGeneratorScreen', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    resetGeneratorHistoryStore();
  });

  it('renders the four tools and generates a random integer', async () => {
    const user = userEvent.setup();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    renderApp({ initialEntries: [ROUTES.randomGenerator] });

    expect(screen.getByRole('heading', { name: GENERATOR_MESSAGES.title, level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('tablist', { name: GENERATOR_MESSAGES.toolsLabel })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: GENERATOR_MESSAGES.numberTab })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    const form = screen.getByRole('form', { name: GENERATOR_MESSAGES.numberTab });
    await user.clear(within(form).getByLabelText(GENERATOR_MESSAGES.minLabel));
    await user.type(within(form).getByLabelText(GENERATOR_MESSAGES.minLabel), '5');
    await user.clear(within(form).getByLabelText(GENERATOR_MESSAGES.maxLabel));
    await user.type(within(form).getByLabelText(GENERATOR_MESSAGES.maxLabel), '9');
    await user.click(within(form).getByRole('button', { name: GENERATOR_MESSAGES.generateNumber }));

    expect(within(form).getByRole('status')).toHaveTextContent('5');
  });

  it('generates a decimal, a weighted item, a name, and a choice', async () => {
    const user = userEvent.setup();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    renderApp({ initialEntries: [ROUTES.randomGenerator] });

    const numberForm = screen.getByRole('form', { name: GENERATOR_MESSAGES.numberTab });
    await user.click(within(numberForm).getByRole('radio', { name: GENERATOR_MESSAGES.decimalLabel }));
    await user.click(within(numberForm).getByRole('button', { name: GENERATOR_MESSAGES.generateNumber }));
    expect(within(numberForm).getByRole('status')).toHaveTextContent('1.00');

    await user.click(screen.getByRole('tab', { name: GENERATOR_MESSAGES.itemTab }));
    const itemForm = screen.getByRole('form', { name: GENERATOR_MESSAGES.itemTab });
    await user.type(within(itemForm).getByLabelText('Item 1'), 'Pizza');
    await user.clear(within(itemForm).getByLabelText('Weight 1'));
    await user.type(within(itemForm).getByLabelText('Weight 1'), '1');
    await user.type(within(itemForm).getByLabelText('Item 2'), 'Burger');
    await user.clear(within(itemForm).getByLabelText('Weight 2'));
    await user.type(within(itemForm).getByLabelText('Weight 2'), '3');
    await user.click(within(itemForm).getByRole('button', { name: GENERATOR_MESSAGES.generateItem }));
    expect(within(itemForm).getByRole('status')).toHaveTextContent('Pizza');

    await user.click(screen.getByRole('tab', { name: GENERATOR_MESSAGES.nameTab }));
    const nameForm = screen.getByRole('form', { name: GENERATOR_MESSAGES.nameTab });
    await user.click(within(nameForm).getByRole('button', { name: GENERATOR_MESSAGES.generateName }));
    expect(within(nameForm).getByRole('status')).toHaveTextContent(`${FIRST_NAMES[0]} ${LAST_NAMES[0]}`);

    await user.click(screen.getByRole('tab', { name: GENERATOR_MESSAGES.choiceTab }));
    const choiceForm = screen.getByRole('form', { name: GENERATOR_MESSAGES.choiceTab });
    await user.click(within(choiceForm).getByRole('button', { name: GENERATOR_MESSAGES.generateChoice }));
    expect(within(choiceForm).getByRole('status')).toHaveTextContent('Yes');
  });

  it('shows validation for a custom choice list that is too short', async () => {
    const user = userEvent.setup();
    renderApp({ initialEntries: [ROUTES.randomGenerator] });

    await user.click(screen.getByRole('tab', { name: GENERATOR_MESSAGES.choiceTab }));
    const choiceForm = screen.getByRole('form', { name: GENERATOR_MESSAGES.choiceTab });
    await user.click(within(choiceForm).getByLabelText(GENERATOR_MESSAGES.choicePresetLabel));
    await user.click(await screen.findByRole('option', { name: GENERATOR_MESSAGES.customListLabel }));
    await user.type(within(choiceForm).getByLabelText('Option 1'), 'Stay in');
    await user.click(within(choiceForm).getByRole('button', { name: GENERATOR_MESSAGES.generateChoice }));

    expect(await within(choiceForm).findByText(GENERATOR_MESSAGES.choicesRequired)).toBeInTheDocument();
  });

  it('generates balanced teams, rerolls, and saves results to history', async () => {
    const user = userEvent.setup();
    renderApp({ initialEntries: [ROUTES.randomGenerator] });

    await user.click(screen.getByRole('tab', { name: GENERATOR_MESSAGES.teamTab }));
    const teamForm = screen.getByRole('form', { name: GENERATOR_MESSAGES.teamTab });

    expect(within(teamForm).getByLabelText(GENERATOR_MESSAGES.participantsLabel)).toHaveValue(
      'Ahmad\nAli\nJohn\nSarah\nDavid\nLisa',
    );

    await user.click(within(teamForm).getByRole('switch', { name: GENERATOR_MESSAGES.randomAssignmentLabel }));
    await user.click(within(teamForm).getByRole('button', { name: GENERATOR_MESSAGES.generateTeams }));

    const result = within(teamForm).getByLabelText(GENERATOR_MESSAGES.teamResultLabel);
    expect(result).toHaveTextContent('Team A');
    expect(result).toHaveTextContent('- Ahmad');
    expect(result).toHaveTextContent('- John');
    expect(result).toHaveTextContent('- David');
    expect(result).toHaveTextContent('Team B');
    expect(result).toHaveTextContent('- Ali');
    expect(result).toHaveTextContent('- Sarah');
    expect(result).toHaveTextContent('- Lisa');

    const saved = screen.getByRole('region', { name: GENERATOR_MESSAGES.teamHistoryAria });
    expect(saved).toHaveTextContent('Team A — Ahmad, John, David');
    expect(saved).toHaveTextContent('Team B — Ali, Sarah, Lisa');

    vi.spyOn(Math, 'random').mockReturnValue(0);
    await user.click(within(teamForm).getByRole('switch', { name: GENERATOR_MESSAGES.randomAssignmentLabel }));
    await user.click(within(teamForm).getByRole('button', { name: GENERATOR_MESSAGES.rerollTeams }));

    expect(result).toHaveTextContent('- Ali');
    expect(result).toHaveTextContent('- Sarah');
    expect(result).toHaveTextContent('- Lisa');
    expect(screen.getAllByText(/Team A —/).length).toBeGreaterThan(1);
  });
});
