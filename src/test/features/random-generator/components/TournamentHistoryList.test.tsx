import type { ComponentProps } from 'react';

import { formatDateTime } from '@/features/dashboard/utils/formatDateTime';
import { HistoryConfirmDialog } from '@/features/history/components/HistoryConfirmDialog';
import { TournamentHistoryList } from '@/features/random-generator/components/TournamentHistoryList';
import { GENERATOR_MESSAGES } from '@/features/random-generator/constants';
import type { TournamentBracket } from '@/features/random-generator/types';
import { generateTournament } from '@/features/random-generator/utils/generateTournament';
import {
  formatTournamentHistoryLabel,
  formatTournamentRoundFlow,
  formatTournamentSettings,
} from '@/features/random-generator/utils/formatTournamentHistory';
import { selectTournamentWinner } from '@/features/random-generator/utils/selectTournamentWinner';
import { renderWithProviders, screen, userEvent, within } from '@/test/test-utils';

vi.mock('@/features/history/components/HistoryConfirmDialog', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/history/components/HistoryConfirmDialog')>();
  return {
    HistoryConfirmDialog: (props: ComponentProps<typeof HistoryConfirmDialog>) => {
      if (!props.open && props.title === GENERATOR_MESSAGES.deleteTournamentResultTitle) {
        return (
          <button type="button" onClick={props.onConfirm}>
            Force delete confirm
          </button>
        );
      }

      return <actual.HistoryConfirmDialog {...props} />;
    },
  };
});

const ids = {
  createBracketId: () => 't1',
  createParticipantId: (index: number) => `p${index}`,
  now: () => '2026-01-01T12:00:00.000Z',
};

function bracketOf(
  participants: string[],
  overrides: Partial<TournamentBracket> = {},
): TournamentBracket {
  const result = generateTournament({ participants, random: false }, 0, ids);
  if (!result.ok) {
    throw new Error(result.error);
  }
  return { ...result.value, ...overrides };
}

describe('TournamentHistoryList', () => {
  it('renders nothing when there are no entries', () => {
    const { container } = renderWithProviders(
      <TournamentHistoryList entries={[]} onDelete={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders saved tournaments with settings and hides clear when onClear is omitted', () => {
    const saved = bracketOf(['A', 'B', 'C', 'D']);
    renderWithProviders(<TournamentHistoryList entries={[saved]} onDelete={vi.fn()} />);

    expect(
      screen.getByRole('heading', { name: GENERATOR_MESSAGES.tournamentHistoryTitle, level: 2 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: GENERATOR_MESSAGES.tournamentHistoryAria }),
    ).toBeInTheDocument();
    expect(screen.getByText(formatTournamentRoundFlow(saved))).toBeInTheDocument();
    expect(
      screen.getByText(
        `${formatDateTime(saved.createdAt)} · ${formatTournamentSettings(saved)}`,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: `${GENERATOR_MESSAGES.deleteTournamentResult}: ${formatTournamentHistoryLabel(saved)}`,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: GENERATOR_MESSAGES.clearTournamentHistory }),
    ).not.toBeInTheDocument();
  });

  it('shows the winner in settings once a tournament is complete', () => {
    let complete = bracketOf(['A', 'B', 'C', 'D']);
    for (const [matchId, winnerId] of [
      ['0-0', 'p0'],
      ['0-1', 'p2'],
      ['1-0', 'p0'],
    ] as const) {
      const next = selectTournamentWinner(complete, matchId, winnerId);
      expect(next.ok).toBe(true);
      if (!next.ok) {
        return;
      }
      complete = next.value;
    }

    renderWithProviders(
      <TournamentHistoryList entries={[complete]} onDelete={vi.fn()} />,
    );

    expect(
      screen.getByText(
        `${formatDateTime(complete.createdAt)} · ${formatTournamentSettings(complete)}`,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/Winner: A/)).toBeInTheDocument();
  });

  it('cancels and confirms deleting a single entry', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const first = bracketOf(['A', 'B', 'C', 'D'], { id: 'tournament-1' });
    const second = bracketOf(['E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'], {
      id: 'tournament-2',
      createdAt: '2026-01-02T12:00:00.000Z',
    });
    expect(formatTournamentHistoryLabel(first)).not.toEqual(formatTournamentHistoryLabel(second));
    renderWithProviders(
      <TournamentHistoryList entries={[first, second]} onDelete={onDelete} />,
    );

    await user.click(
      screen.getByRole('button', {
        name: `${GENERATOR_MESSAGES.deleteTournamentResult}: ${formatTournamentHistoryLabel(first)}`,
      }),
    );

    const dialog = screen.getByRole('dialog', {
      name: GENERATOR_MESSAGES.deleteTournamentResultTitle,
    });
    expect(dialog).toHaveTextContent(GENERATOR_MESSAGES.deleteTournamentResultDescription);

    await user.click(within(dialog).getByRole('button', { name: /cancel/i }));
    expect(onDelete).not.toHaveBeenCalled();
    expect(
      screen.queryByRole('dialog', { name: GENERATOR_MESSAGES.deleteTournamentResultTitle }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', {
        name: `${GENERATOR_MESSAGES.deleteTournamentResult}: ${formatTournamentHistoryLabel(first)}`,
      }),
    );
    await user.click(
      within(
        screen.getByRole('dialog', { name: GENERATOR_MESSAGES.deleteTournamentResultTitle }),
      ).getByRole('button', { name: GENERATOR_MESSAGES.deleteTournamentResult }),
    );

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith('tournament-1');
  });

  it('confirms deleting a later history entry', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const first = bracketOf(['A', 'B', 'C', 'D'], { id: 'tournament-1' });
    const second = bracketOf(['E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'], {
      id: 'tournament-2',
      createdAt: '2026-01-02T12:00:00.000Z',
    });
    renderWithProviders(
      <TournamentHistoryList entries={[first, second]} onDelete={onDelete} />,
    );

    await user.click(
      screen.getByRole('button', {
        name: `${GENERATOR_MESSAGES.deleteTournamentResult}: ${formatTournamentHistoryLabel(second)}`,
      }),
    );
    await user.click(
      within(
        screen.getByRole('dialog', { name: GENERATOR_MESSAGES.deleteTournamentResultTitle }),
      ).getByRole('button', { name: GENERATOR_MESSAGES.deleteTournamentResult }),
    );

    expect(onDelete).toHaveBeenCalledWith('tournament-2');
  });

  it('ignores delete confirmation when no entry is pending', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    renderWithProviders(
      <TournamentHistoryList entries={[bracketOf(['A', 'B', 'C', 'D'])]} onDelete={onDelete} />,
    );

    await user.click(screen.getByRole('button', { name: 'Force delete confirm' }));

    expect(onDelete).not.toHaveBeenCalled();
  });

  it('cancels and confirms clearing all history when onClear is provided', async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    renderWithProviders(
      <TournamentHistoryList
        entries={[bracketOf(['A', 'B', 'C', 'D'])]}
        onDelete={vi.fn()}
        onClear={onClear}
      />,
    );

    expect(
      screen.getByRole('button', { name: GENERATOR_MESSAGES.clearTournamentHistory }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: GENERATOR_MESSAGES.clearTournamentHistory }),
    );

    const dialog = screen.getByRole('dialog', {
      name: GENERATOR_MESSAGES.clearTournamentHistoryTitle,
    });
    expect(dialog).toHaveTextContent(GENERATOR_MESSAGES.clearTournamentHistoryDescription);

    await user.click(within(dialog).getByRole('button', { name: /cancel/i }));
    expect(onClear).not.toHaveBeenCalled();
    expect(
      screen.queryByRole('dialog', { name: GENERATOR_MESSAGES.clearTournamentHistoryTitle }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: GENERATOR_MESSAGES.clearTournamentHistory }),
    );
    await user.click(
      within(
        screen.getByRole('dialog', { name: GENERATOR_MESSAGES.clearTournamentHistoryTitle }),
      ).getByRole('button', { name: GENERATOR_MESSAGES.clearTournamentHistory }),
    );

    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
