import { TournamentTool } from '@/features/random-generator/components/TournamentTool';
import {
  DEFAULT_TOURNAMENT_PARTICIPANTS,
  GENERATOR_MESSAGES,
} from '@/features/random-generator/constants';
import { formatTournamentHistoryLabel } from '@/features/random-generator/utils/formatTournamentHistory';
import { participantName } from '@/features/random-generator/utils/generateTournament';
import * as generateTournament from '@/features/random-generator/utils/generateTournament';
import { resetTournamentStore, useTournamentStore } from '@/stores/tournamentStore';
import { renderWithProviders, screen, userEvent, within } from '@/test/test-utils';

describe('TournamentTool', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    resetTournamentStore();
  });

  it('renders defaults with an empty bracket and no history', () => {
    renderWithProviders(<TournamentTool />);

    const form = screen.getByRole('form', { name: GENERATOR_MESSAGES.tournamentTab });
    expect(within(form).getByText(GENERATOR_MESSAGES.tournamentHint)).toBeInTheDocument();
    expect(within(form).getByLabelText(GENERATOR_MESSAGES.participantsLabel)).toHaveValue(
      DEFAULT_TOURNAMENT_PARTICIPANTS.join('\n'),
    );
    expect(within(form).getByText(GENERATOR_MESSAGES.emptyTournament)).toBeInTheDocument();
    expect(
      within(form).getByRole('button', { name: GENERATOR_MESSAGES.generateTournament }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: GENERATOR_MESSAGES.tournamentHistoryAria }),
    ).not.toBeInTheDocument();
  });

  it('generates a bracket, saves history, and switches to reroll', async () => {
    const user = userEvent.setup();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    renderWithProviders(<TournamentTool />);

    const form = screen.getByRole('form', { name: GENERATOR_MESSAGES.tournamentTab });
    await user.click(
      within(form).getByRole('button', { name: GENERATOR_MESSAGES.generateTournament }),
    );

    expect(
      within(form).getByLabelText(GENERATOR_MESSAGES.bracketLabel),
    ).toBeInTheDocument();
    expect(within(form).queryByText(GENERATOR_MESSAGES.emptyTournament)).not.toBeInTheDocument();
    expect(
      within(form).getByRole('button', { name: GENERATOR_MESSAGES.rerollTournament }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: GENERATOR_MESSAGES.tournamentHistoryAria }),
    ).toBeInTheDocument();
    expect(useTournamentStore.getState().tournamentHistory).toHaveLength(1);
    expect(useTournamentStore.getState().activeTournament).not.toBeNull();
  });

  it('rerolls and appends another history entry', async () => {
    const user = userEvent.setup();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    renderWithProviders(<TournamentTool />);

    const form = screen.getByRole('form', { name: GENERATOR_MESSAGES.tournamentTab });
    await user.click(
      within(form).getByRole('button', { name: GENERATOR_MESSAGES.generateTournament }),
    );

    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    await user.click(
      within(form).getByRole('button', { name: GENERATOR_MESSAGES.rerollTournament }),
    );

    expect(useTournamentStore.getState().tournamentHistory).toHaveLength(2);
    expect(
      within(form).getByLabelText(GENERATOR_MESSAGES.bracketLabel),
    ).toBeInTheDocument();
  });

  it('advances a match when a winner is selected', async () => {
    const user = userEvent.setup();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    renderWithProviders(<TournamentTool />);

    const form = screen.getByRole('form', { name: GENERATOR_MESSAGES.tournamentTab });
    await user.click(
      within(form).getByRole('button', { name: GENERATOR_MESSAGES.generateTournament }),
    );

    const active = useTournamentStore.getState().activeTournament;
    expect(active).not.toBeNull();
    if (!active) {
      return;
    }

    const match = active.rounds[0]?.matches[0];
    expect(match).toBeDefined();
    if (!match) {
      return;
    }

    const winnerId = match.slots[0]?.participantId;
    expect(winnerId).toBeTruthy();
    if (!winnerId) {
      return;
    }

    const winnerName = participantName(active, winnerId);
    await user.click(
      within(form).getByRole('button', {
        name: GENERATOR_MESSAGES.selectWinner(
          active.rounds[0]!.label,
          match.matchIndex + 1,
          winnerName,
        ),
      }),
    );

    const updated = useTournamentStore.getState().activeTournament;
    expect(updated?.rounds[0]?.matches[0]?.winnerId).toBe(winnerId);
    expect(useTournamentStore.getState().tournamentHistory[0]?.rounds[0]?.matches[0]?.winnerId).toBe(
      winnerId,
    );
  });

  it('shows validation when fewer than two participants are entered', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TournamentTool />);

    const form = screen.getByRole('form', { name: GENERATOR_MESSAGES.tournamentTab });
    const participants = within(form).getByLabelText(GENERATOR_MESSAGES.participantsLabel);
    await user.clear(participants);
    await user.type(participants, 'OnlyOne');
    await user.click(
      within(form).getByRole('button', { name: GENERATOR_MESSAGES.generateTournament }),
    );

    expect(await within(form).findByText(GENERATOR_MESSAGES.tournamentRequired)).toBeInTheDocument();
    expect(within(form).getByText(GENERATOR_MESSAGES.emptyTournament)).toBeInTheDocument();
    expect(useTournamentStore.getState().tournamentHistory).toHaveLength(0);
  });

  it('surfaces a generator error without starting a tournament', async () => {
    const user = userEvent.setup();
    vi.spyOn(generateTournament, 'generateTournament').mockReturnValue({
      ok: false,
      error: GENERATOR_MESSAGES.tournamentRequired,
    });
    renderWithProviders(<TournamentTool />);

    const form = screen.getByRole('form', { name: GENERATOR_MESSAGES.tournamentTab });
    await user.click(
      within(form).getByRole('button', { name: GENERATOR_MESSAGES.generateTournament }),
    );

    expect(within(form).getByRole('alert')).toHaveTextContent(
      GENERATOR_MESSAGES.tournamentRequired,
    );
    expect(within(form).getByText(GENERATOR_MESSAGES.emptyTournament)).toBeInTheDocument();
    expect(useTournamentStore.getState().activeTournament).toBeNull();
    expect(useTournamentStore.getState().tournamentHistory).toHaveLength(0);
  });

  it('deletes a saved tournament from history', async () => {
    const user = userEvent.setup();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    renderWithProviders(<TournamentTool />);

    const form = screen.getByRole('form', { name: GENERATOR_MESSAGES.tournamentTab });
    await user.click(
      within(form).getByRole('button', { name: GENERATOR_MESSAGES.generateTournament }),
    );

    const saved = useTournamentStore.getState().tournamentHistory[0];
    expect(saved).toBeDefined();
    if (!saved) {
      return;
    }

    const history = screen.getByRole('region', { name: GENERATOR_MESSAGES.tournamentHistoryAria });
    await user.click(
      within(history).getByRole('button', {
        name: `${GENERATOR_MESSAGES.deleteTournamentResult}: ${formatTournamentHistoryLabel(saved)}`,
      }),
    );
    await user.click(
      within(
        screen.getByRole('dialog', { name: GENERATOR_MESSAGES.deleteTournamentResultTitle }),
      ).getByRole('button', { name: GENERATOR_MESSAGES.deleteTournamentResult }),
    );

    expect(
      screen.queryByRole('region', { name: GENERATOR_MESSAGES.tournamentHistoryAria }),
    ).not.toBeInTheDocument();
    expect(within(form).getByText(GENERATOR_MESSAGES.emptyTournament)).toBeInTheDocument();
    expect(useTournamentStore.getState().tournamentHistory).toHaveLength(0);
    expect(useTournamentStore.getState().activeTournament).toBeNull();
  });
});
