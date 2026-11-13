import type { ComponentProps } from 'react';

import { formatDateTime } from '@/features/dashboard/utils/formatDateTime';
import { HistoryConfirmDialog } from '@/features/history/components/HistoryConfirmDialog';
import { TeamHistoryList } from '@/features/random-generator/components/TeamHistoryList';
import { GENERATOR_MESSAGES } from '@/features/random-generator/constants';
import type { TeamGeneratorHistoryEntry } from '@/features/random-generator/types';
import { formatTeamSettings } from '@/features/random-generator/utils/formatTeamHistory';
import { renderWithProviders, screen, userEvent, within } from '@/test/test-utils';

vi.mock('@/features/history/components/HistoryConfirmDialog', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/history/components/HistoryConfirmDialog')>();
  return {
    HistoryConfirmDialog: (props: ComponentProps<typeof HistoryConfirmDialog>) => {
      if (!props.open && props.title === GENERATOR_MESSAGES.deleteTeamResultTitle) {
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

function entry(
  overrides: Partial<TeamGeneratorHistoryEntry> & Pick<TeamGeneratorHistoryEntry, 'id'> = {
    id: 'team-1',
  },
): TeamGeneratorHistoryEntry {
  return {
    createdAt: '2026-01-01T12:00:00.000Z',
    teamCount: 2,
    balanced: true,
    random: true,
    preventDuplicates: true,
    teams: [
      { name: 'Team A', members: ['Ahmad', 'Sarah', 'David'] },
      { name: 'Team B', members: ['Ali', 'John', 'Lisa'] },
    ],
    ...overrides,
  };
}

describe('TeamHistoryList', () => {
  it('renders nothing when there are no entries', () => {
    const { container } = renderWithProviders(
      <TeamHistoryList entries={[]} onDelete={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders saved teams with settings and hides clear when onClear is omitted', () => {
    const saved = entry();
    renderWithProviders(<TeamHistoryList entries={[saved]} onDelete={vi.fn()} />);

    expect(
      screen.getByRole('heading', { name: GENERATOR_MESSAGES.teamHistoryTitle, level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('region', { name: GENERATOR_MESSAGES.teamHistoryAria })).toBeInTheDocument();
    expect(screen.getByText('Team A — Ahmad, Sarah, David')).toBeInTheDocument();
    expect(screen.getByText('Team B — Ali, John, Lisa')).toBeInTheDocument();
    expect(
      screen.getByText(
        `${formatDateTime(saved.createdAt)} · ${formatTeamSettings(saved)}`,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: `${GENERATOR_MESSAGES.deleteTeamResult}: Team A, Team B`,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: GENERATOR_MESSAGES.clearTeamHistory }),
    ).not.toBeInTheDocument();
  });

  it('renders empty-member teams and settings without optional flags', () => {
    const saved = entry({
      id: 'empty-team',
      teams: [{ name: 'Team A', members: [] }],
      teamCount: 1,
      balanced: false,
      random: false,
      preventDuplicates: false,
    });
    renderWithProviders(<TeamHistoryList entries={[saved]} onDelete={vi.fn()} />);

    expect(
      screen.getByText(`Team A — ${GENERATOR_MESSAGES.noTeamMembers}`),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        `${formatDateTime(saved.createdAt)} · ${formatTeamSettings(saved)}`,
      ),
    ).toBeInTheDocument();
    expect(formatTeamSettings(saved)).toBe('1 teams');
  });

  it('cancels and confirms deleting a single entry', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const first = entry({ id: 'team-1' });
    const second = entry({
      id: 'team-2',
      teams: [
        { name: 'Team C', members: ['Maya'] },
        { name: 'Team D', members: ['Noah'] },
      ],
    });
    renderWithProviders(<TeamHistoryList entries={[first, second]} onDelete={onDelete} />);

    await user.click(
      screen.getByRole('button', {
        name: `${GENERATOR_MESSAGES.deleteTeamResult}: Team A, Team B`,
      }),
    );

    const dialog = screen.getByRole('dialog', {
      name: GENERATOR_MESSAGES.deleteTeamResultTitle,
    });
    expect(dialog).toHaveTextContent(GENERATOR_MESSAGES.deleteTeamResultDescription);

    await user.click(within(dialog).getByRole('button', { name: /cancel/i }));
    expect(onDelete).not.toHaveBeenCalled();
    expect(
      screen.queryByRole('dialog', { name: GENERATOR_MESSAGES.deleteTeamResultTitle }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', {
        name: `${GENERATOR_MESSAGES.deleteTeamResult}: Team A, Team B`,
      }),
    );
    await user.click(
      within(
        screen.getByRole('dialog', { name: GENERATOR_MESSAGES.deleteTeamResultTitle }),
      ).getByRole('button', { name: GENERATOR_MESSAGES.deleteTeamResult }),
    );

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith('team-1');
  });

  it('confirms deleting a later history entry', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const first = entry({ id: 'team-1' });
    const second = entry({
      id: 'team-2',
      teams: [
        { name: 'Team C', members: ['Maya'] },
        { name: 'Team D', members: ['Noah'] },
      ],
    });
    renderWithProviders(<TeamHistoryList entries={[first, second]} onDelete={onDelete} />);

    await user.click(
      screen.getByRole('button', {
        name: `${GENERATOR_MESSAGES.deleteTeamResult}: Team C, Team D`,
      }),
    );
    await user.click(
      within(
        screen.getByRole('dialog', { name: GENERATOR_MESSAGES.deleteTeamResultTitle }),
      ).getByRole('button', { name: GENERATOR_MESSAGES.deleteTeamResult }),
    );

    expect(onDelete).toHaveBeenCalledWith('team-2');
  });

  it('ignores delete confirmation when no entry is pending', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    renderWithProviders(<TeamHistoryList entries={[entry()]} onDelete={onDelete} />);

    await user.click(screen.getByRole('button', { name: 'Force delete confirm' }));

    expect(onDelete).not.toHaveBeenCalled();
  });

  it('cancels and confirms clearing all history when onClear is provided', async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    renderWithProviders(
      <TeamHistoryList entries={[entry()]} onDelete={vi.fn()} onClear={onClear} />,
    );

    expect(
      screen.getByRole('button', { name: GENERATOR_MESSAGES.clearTeamHistory }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: GENERATOR_MESSAGES.clearTeamHistory }));

    const dialog = screen.getByRole('dialog', {
      name: GENERATOR_MESSAGES.clearTeamHistoryTitle,
    });
    expect(dialog).toHaveTextContent(GENERATOR_MESSAGES.clearTeamHistoryDescription);

    await user.click(within(dialog).getByRole('button', { name: /cancel/i }));
    expect(onClear).not.toHaveBeenCalled();
    expect(
      screen.queryByRole('dialog', { name: GENERATOR_MESSAGES.clearTeamHistoryTitle }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: GENERATOR_MESSAGES.clearTeamHistory }));
    await user.click(
      within(
        screen.getByRole('dialog', { name: GENERATOR_MESSAGES.clearTeamHistoryTitle }),
      ).getByRole('button', { name: GENERATOR_MESSAGES.clearTeamHistory }),
    );

    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
