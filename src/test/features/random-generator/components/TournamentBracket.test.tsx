import { TournamentBracketView } from '@/features/random-generator/components/TournamentBracket';
import {
  GENERATOR_MESSAGES,
  MATCH_STATUS,
  TOURNAMENT_ROUND,
  TOURNAMENT_STATUS,
} from '@/features/random-generator/constants';
import type { TournamentBracket } from '@/features/random-generator/types';
import { generateTournament } from '@/features/random-generator/utils/generateTournament';
import { selectTournamentWinner } from '@/features/random-generator/utils/selectTournamentWinner';
import { renderWithProviders, screen, userEvent, within } from '@/test/test-utils';

const ids = {
  createBracketId: () => 't1',
  createParticipantId: (index: number) => `p${index}`,
  now: () => '2026-01-01T00:00:00.000Z',
};

function bracketOf(participants: string[]): TournamentBracket {
  const result = generateTournament({ participants, random: false }, 0, ids);
  if (!result.ok) {
    throw new Error(result.error);
  }
  return result.value;
}

function customBracket(
  match: TournamentBracket['rounds'][number]['matches'][number],
): TournamentBracket {
  return {
    id: 'custom',
    createdAt: '2026-01-01T00:00:00.000Z',
    status: TOURNAMENT_STATUS.inProgress,
    participants: [
      { id: 'p0', name: 'A' },
      { id: 'p1', name: 'B' },
    ],
    rounds: [
      {
        index: 0,
        kind: TOURNAMENT_ROUND.final,
        label: GENERATOR_MESSAGES.finalLabel,
        matches: [match],
      },
    ],
    winnerId: null,
    eliminatedIds: [],
  };
}

describe('TournamentBracketView', () => {
  it('renders rounds with no winner or eliminated players yet', () => {
    renderWithProviders(
      <TournamentBracketView bracket={bracketOf(['A', 'B', 'C', 'D'])} onSelectWinner={vi.fn()} />,
    );

    const bracket = screen.getByLabelText(GENERATOR_MESSAGES.bracketLabel);
    expect(
      within(bracket).getByRole('heading', { name: GENERATOR_MESSAGES.semiFinalsLabel, level: 3 }),
    ).toBeInTheDocument();
    expect(
      within(bracket).getByRole('heading', { name: GENERATOR_MESSAGES.finalLabel, level: 3 }),
    ).toBeInTheDocument();
    expect(
      within(bracket).getByRole('heading', { name: GENERATOR_MESSAGES.winnerTitle, level: 3 }),
    ).toBeInTheDocument();
    expect(within(bracket).getByText(GENERATOR_MESSAGES.noWinner)).toBeInTheDocument();
    expect(within(bracket).getByText(GENERATOR_MESSAGES.eliminatedTitle)).toBeInTheDocument();
    expect(within(bracket).getByText(GENERATOR_MESSAGES.noEliminated)).toBeInTheDocument();
    expect(
      within(bracket).getByLabelText(`${GENERATOR_MESSAGES.semiFinalsLabel} match 1`),
    ).toHaveTextContent(GENERATOR_MESSAGES.vsLabel);
  });

  it('exposes winner buttons for ready matches and reports the selection', async () => {
    const user = userEvent.setup();
    const onSelectWinner = vi.fn();
    renderWithProviders(
      <TournamentBracketView bracket={bracketOf(['A', 'B', 'C', 'D'])} onSelectWinner={onSelectWinner} />,
    );

    await user.click(
      screen.getByRole('button', {
        name: GENERATOR_MESSAGES.selectWinner(GENERATOR_MESSAGES.semiFinalsLabel, 1, 'A'),
      }),
    );

    expect(onSelectWinner).toHaveBeenCalledWith('0-0', 'p0');
  });

  it('shows eliminated chips, strikethrough losers, and the champion when complete', () => {
    const first = selectTournamentWinner(bracketOf(['A', 'B', 'C', 'D']), '0-0', 'p0');
    expect(first.ok).toBe(true);
    if (!first.ok) {
      return;
    }
    const second = selectTournamentWinner(first.value, '0-1', 'p2');
    expect(second.ok).toBe(true);
    if (!second.ok) {
      return;
    }
    const champion = selectTournamentWinner(second.value, '1-0', 'p0');
    expect(champion.ok).toBe(true);
    if (!champion.ok) {
      return;
    }

    renderWithProviders(
      <TournamentBracketView bracket={champion.value} onSelectWinner={vi.fn()} />,
    );

    const winnerHeading = screen.getByRole('heading', { name: GENERATOR_MESSAGES.winnerTitle, level: 3 });
    expect(winnerHeading.parentElement).toHaveTextContent('A');
    expect(winnerHeading.parentElement).not.toHaveTextContent(GENERATOR_MESSAGES.noWinner);
    expect(screen.queryByText(GENERATOR_MESSAGES.noEliminated)).not.toBeInTheDocument();

    const eliminatedSection = screen.getByText(GENERATOR_MESSAGES.eliminatedTitle).parentElement;
    expect(eliminatedSection).not.toBeNull();
    expect(within(eliminatedSection!).getByText('B')).toBeInTheDocument();
    expect(within(eliminatedSection!).getByText('C')).toBeInTheDocument();
    expect(within(eliminatedSection!).getByText('D')).toBeInTheDocument();

    const completedMatch = screen.getByLabelText(`${GENERATOR_MESSAGES.semiFinalsLabel} match 1`);
    expect(within(completedMatch).queryByRole('button')).not.toBeInTheDocument();
    expect(within(completedMatch).getByText('B')).toHaveStyle({ textDecoration: 'line-through' });
    expect(within(completedMatch).getByText('A')).toHaveStyle({ fontWeight: '700' });
  });

  it('renders a bye slot for odd participant counts', () => {
    const bracket = bracketOf(['A', 'B', 'C', 'D', 'E']);
    expect(bracket.rounds[0]?.matches.some((match) => match.status === MATCH_STATUS.bye)).toBe(true);

    renderWithProviders(
      <TournamentBracketView bracket={bracket} onSelectWinner={vi.fn()} />,
    );

    const quarterBye = screen.getByLabelText(`${GENERATOR_MESSAGES.quarterFinalsLabel} match 3`);
    expect(within(quarterBye).getByText(GENERATOR_MESSAGES.byeLabel)).toBeInTheDocument();
    expect(within(quarterBye).getByText('E')).toBeInTheDocument();
  });

  it('shows TBD for unset later-round slots', () => {
    renderWithProviders(
      <TournamentBracketView bracket={bracketOf(['A', 'B', 'C', 'D'])} onSelectWinner={vi.fn()} />,
    );

    const finalMatch = screen.getByLabelText(`${GENERATOR_MESSAGES.finalLabel} match 1`);
    expect(within(finalMatch).getAllByText(GENERATOR_MESSAGES.tbdLabel).length).toBeGreaterThan(0);
  });

  it('treats a one-sided non-pending match as a bye slot', () => {
    renderWithProviders(
      <TournamentBracketView
        bracket={customBracket({
          id: '0-0',
          roundIndex: 0,
          matchIndex: 0,
          slots: [{ participantId: 'p0' }, { participantId: null }],
          winnerId: 'p0',
          status: MATCH_STATUS.complete,
        })}
        onSelectWinner={vi.fn()}
      />,
    );

    const match = screen.getByLabelText(`${GENERATOR_MESSAGES.finalLabel} match 1`);
    expect(within(match).getByText('A')).toBeInTheDocument();
    expect(within(match).getByText(GENERATOR_MESSAGES.byeLabel)).toBeInTheDocument();
    expect(within(match).queryByText(GENERATOR_MESSAGES.tbdLabel)).not.toBeInTheDocument();
  });

  it('marks the current winner with a contained button while the match is still selectable', async () => {
    const user = userEvent.setup();
    const onSelectWinner = vi.fn();
    renderWithProviders(
      <TournamentBracketView
        bracket={customBracket({
          id: '0-0',
          roundIndex: 0,
          matchIndex: 0,
          slots: [{ participantId: 'p0' }, { participantId: 'p1' }],
          winnerId: 'p0',
          status: MATCH_STATUS.ready,
        })}
        onSelectWinner={onSelectWinner}
      />,
    );

    const winnerButton = screen.getByRole('button', {
      name: GENERATOR_MESSAGES.selectWinner(GENERATOR_MESSAGES.finalLabel, 1, 'A'),
    });
    const challengerButton = screen.getByRole('button', {
      name: GENERATOR_MESSAGES.selectWinner(GENERATOR_MESSAGES.finalLabel, 1, 'B'),
    });

    expect(winnerButton).toHaveClass('MuiButton-contained');
    expect(challengerButton).toHaveClass('MuiButton-outlined');

    await user.click(challengerButton);
    expect(onSelectWinner).toHaveBeenCalledWith('0-0', 'p1');
  });
});
