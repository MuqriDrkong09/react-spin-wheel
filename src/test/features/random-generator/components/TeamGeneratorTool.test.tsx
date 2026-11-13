import { TeamGeneratorTool } from '@/features/random-generator/components/TeamGeneratorTool';
import { DEFAULT_TEAM_PARTICIPANTS, GENERATOR_MESSAGES } from '@/features/random-generator/constants';
import * as generateTeams from '@/features/random-generator/utils/generateTeams';
import { resetGeneratorHistoryStore, useGeneratorHistoryStore } from '@/stores/generatorHistoryStore';
import { renderWithProviders, screen, userEvent, within } from '@/test/test-utils';

describe('TeamGeneratorTool', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    resetGeneratorHistoryStore();
  });

  it('renders defaults with empty result and no history', () => {
    renderWithProviders(<TeamGeneratorTool />);

    const form = screen.getByRole('form', { name: GENERATOR_MESSAGES.teamTab });
    expect(within(form).getByText(GENERATOR_MESSAGES.teamHint)).toBeInTheDocument();
    expect(within(form).getByLabelText(GENERATOR_MESSAGES.participantsLabel)).toHaveValue(
      DEFAULT_TEAM_PARTICIPANTS.join('\n'),
    );
    expect(within(form).getByLabelText(GENERATOR_MESSAGES.teamCountLabel)).toHaveValue(2);
    expect(within(form).getByRole('switch', { name: GENERATOR_MESSAGES.balancedLabel })).toBeChecked();
    expect(
      within(form).getByRole('switch', { name: GENERATOR_MESSAGES.randomAssignmentLabel }),
    ).toBeChecked();
    expect(
      within(form).getByRole('switch', { name: GENERATOR_MESSAGES.preventDuplicatesLabel }),
    ).toBeChecked();
    expect(within(form).getByRole('status')).toHaveTextContent(GENERATOR_MESSAGES.emptyTeamResult);
    expect(
      within(form).getByRole('button', { name: GENERATOR_MESSAGES.generateTeams }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: GENERATOR_MESSAGES.teamHistoryAria }),
    ).not.toBeInTheDocument();
  });

  it('generates balanced teams, saves history, and switches to reroll', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TeamGeneratorTool />);

    const form = screen.getByRole('form', { name: GENERATOR_MESSAGES.teamTab });
    await user.click(
      within(form).getByRole('switch', { name: GENERATOR_MESSAGES.randomAssignmentLabel }),
    );
    await user.click(within(form).getByRole('button', { name: GENERATOR_MESSAGES.generateTeams }));

    const result = within(form).getByLabelText(GENERATOR_MESSAGES.teamResultLabel);
    expect(result).toHaveTextContent('Team A');
    expect(result).toHaveTextContent('- Ahmad');
    expect(result).toHaveTextContent('- John');
    expect(result).toHaveTextContent('- David');
    expect(result).toHaveTextContent('Team B');
    expect(result).toHaveTextContent('- Ali');
    expect(result).toHaveTextContent('- Sarah');
    expect(result).toHaveTextContent('- Lisa');

    expect(
      within(form).getByRole('button', { name: GENERATOR_MESSAGES.rerollTeams }),
    ).toBeInTheDocument();

    const saved = screen.getByRole('region', { name: GENERATOR_MESSAGES.teamHistoryAria });
    expect(saved).toHaveTextContent('Team A — Ahmad, John, David');
    expect(saved).toHaveTextContent('Team B — Ali, Sarah, Lisa');
    expect(useGeneratorHistoryStore.getState().generatorHistory).toHaveLength(1);
    expect(useGeneratorHistoryStore.getState().generatorHistory[0]).toMatchObject({
      teamCount: 2,
      balanced: true,
      random: false,
      preventDuplicates: true,
    });
  });

  it('generates unbalanced teams when balanced is turned off', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TeamGeneratorTool />);

    const form = screen.getByRole('form', { name: GENERATOR_MESSAGES.teamTab });
    await user.click(within(form).getByRole('switch', { name: GENERATOR_MESSAGES.balancedLabel }));
    await user.click(
      within(form).getByRole('switch', { name: GENERATOR_MESSAGES.randomAssignmentLabel }),
    );
    expect(within(form).getByRole('switch', { name: GENERATOR_MESSAGES.balancedLabel })).not.toBeChecked();

    await user.click(within(form).getByRole('button', { name: GENERATOR_MESSAGES.generateTeams }));

    const result = within(form).getByLabelText(GENERATOR_MESSAGES.teamResultLabel);
    expect(result).toHaveTextContent('- Ahmad');
    expect(result).toHaveTextContent('- Ali');
    expect(result).toHaveTextContent('- John');
    expect(result).toHaveTextContent('- Sarah');
    expect(result).toHaveTextContent('- David');
    expect(result).toHaveTextContent('- Lisa');
    expect(useGeneratorHistoryStore.getState().generatorHistory[0]).toMatchObject({
      balanced: false,
      random: false,
    });
  });

  it('allows duplicate names when prevent duplicates is turned off', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TeamGeneratorTool />);

    const form = screen.getByRole('form', { name: GENERATOR_MESSAGES.teamTab });
    const participants = within(form).getByLabelText(GENERATOR_MESSAGES.participantsLabel);
    await user.clear(participants);
    await user.type(participants, 'Ahmad\nAhmad');
    await user.click(
      within(form).getByRole('switch', { name: GENERATOR_MESSAGES.preventDuplicatesLabel }),
    );
    await user.click(
      within(form).getByRole('switch', { name: GENERATOR_MESSAGES.randomAssignmentLabel }),
    );

    await user.click(within(form).getByRole('button', { name: GENERATOR_MESSAGES.generateTeams }));

    const result = within(form).getByLabelText(GENERATOR_MESSAGES.teamResultLabel);
    expect(within(result).getAllByText('- Ahmad')).toHaveLength(2);
    expect(useGeneratorHistoryStore.getState().generatorHistory[0]).toMatchObject({
      preventDuplicates: false,
    });
  });

  it('rerolls teams and appends another history entry', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TeamGeneratorTool />);

    const form = screen.getByRole('form', { name: GENERATOR_MESSAGES.teamTab });
    await user.click(
      within(form).getByRole('switch', { name: GENERATOR_MESSAGES.randomAssignmentLabel }),
    );
    await user.click(within(form).getByRole('button', { name: GENERATOR_MESSAGES.generateTeams }));

    vi.spyOn(Math, 'random').mockReturnValue(0);
    await user.click(
      within(form).getByRole('switch', { name: GENERATOR_MESSAGES.randomAssignmentLabel }),
    );
    await user.click(within(form).getByRole('button', { name: GENERATOR_MESSAGES.rerollTeams }));

    const result = within(form).getByLabelText(GENERATOR_MESSAGES.teamResultLabel);
    expect(result).toHaveTextContent('- Ali');
    expect(result).toHaveTextContent('- Sarah');
    expect(result).toHaveTextContent('- Lisa');
    expect(useGeneratorHistoryStore.getState().generatorHistory).toHaveLength(2);
  });

  it('shows validation when team count exceeds participants', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TeamGeneratorTool />);

    const form = screen.getByRole('form', { name: GENERATOR_MESSAGES.teamTab });
    await user.clear(within(form).getByLabelText(GENERATOR_MESSAGES.teamCountLabel));
    await user.type(within(form).getByLabelText(GENERATOR_MESSAGES.teamCountLabel), '7');
    await user.click(within(form).getByRole('button', { name: GENERATOR_MESSAGES.generateTeams }));

    expect(await within(form).findByText(GENERATOR_MESSAGES.tooManyTeams)).toBeInTheDocument();
  });

  it('shows validation when fewer than two participants remain', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TeamGeneratorTool />);

    const form = screen.getByRole('form', { name: GENERATOR_MESSAGES.teamTab });
    const participants = within(form).getByLabelText(GENERATOR_MESSAGES.participantsLabel);
    await user.clear(participants);
    await user.type(participants, 'OnlyOne');
    await user.click(within(form).getByRole('button', { name: GENERATOR_MESSAGES.generateTeams }));

    expect(
      await within(form).findByText(GENERATOR_MESSAGES.participantsRequired),
    ).toBeInTheDocument();
    expect(useGeneratorHistoryStore.getState().generatorHistory).toHaveLength(0);
  });

  it('surfaces a generator error and clears any previous result', async () => {
    const user = userEvent.setup();
    const generateSpy = vi.spyOn(generateTeams, 'generateTeams').mockReturnValue({
      ok: true,
      value: [
        { name: 'Team A', members: ['Ahmad'] },
        { name: 'Team B', members: ['Ali'] },
      ],
    });
    renderWithProviders(<TeamGeneratorTool />);

    const form = screen.getByRole('form', { name: GENERATOR_MESSAGES.teamTab });
    await user.click(within(form).getByRole('button', { name: GENERATOR_MESSAGES.generateTeams }));

    expect(within(form).getByLabelText(GENERATOR_MESSAGES.teamResultLabel)).toHaveTextContent(
      'Team A',
    );
    expect(
      within(form).getByRole('button', { name: GENERATOR_MESSAGES.rerollTeams }),
    ).toBeInTheDocument();
    expect(useGeneratorHistoryStore.getState().generatorHistory).toHaveLength(1);

    generateSpy.mockReturnValue({
      ok: false,
      error: GENERATOR_MESSAGES.participantsRequired,
    });
    await user.click(within(form).getByRole('button', { name: GENERATOR_MESSAGES.rerollTeams }));

    expect(within(form).getByRole('status')).toHaveTextContent(
      GENERATOR_MESSAGES.participantsRequired,
    );
    expect(within(form).queryByLabelText(GENERATOR_MESSAGES.teamResultLabel)).not.toBeInTheDocument();
    expect(
      within(form).getByRole('button', { name: GENERATOR_MESSAGES.generateTeams }),
    ).toBeInTheDocument();
    expect(useGeneratorHistoryStore.getState().generatorHistory).toHaveLength(1);
  });

  it('deletes a saved team result from history', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TeamGeneratorTool />);

    const form = screen.getByRole('form', { name: GENERATOR_MESSAGES.teamTab });
    await user.click(
      within(form).getByRole('switch', { name: GENERATOR_MESSAGES.randomAssignmentLabel }),
    );
    await user.click(within(form).getByRole('button', { name: GENERATOR_MESSAGES.generateTeams }));

    const history = screen.getByRole('region', { name: GENERATOR_MESSAGES.teamHistoryAria });
    await user.click(
      within(history).getByRole('button', {
        name: new RegExp(GENERATOR_MESSAGES.deleteTeamResult),
      }),
    );
    await user.click(
      within(
        screen.getByRole('dialog', { name: GENERATOR_MESSAGES.deleteTeamResultTitle }),
      ).getByRole('button', { name: GENERATOR_MESSAGES.deleteTeamResult }),
    );

    expect(
      screen.queryByRole('region', { name: GENERATOR_MESSAGES.teamHistoryAria }),
    ).not.toBeInTheDocument();
    expect(useGeneratorHistoryStore.getState().generatorHistory).toHaveLength(0);
  });
});
