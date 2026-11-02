import {
  formatTeamAssignment,
  formatTeamHistoryLabel,
  formatTeamLine,
  formatTeamSettings,
} from '@/features/random-generator/utils/formatTeamHistory';

const teams = [
  { name: 'Team A', members: ['Ahmad', 'Sarah', 'David'] },
  { name: 'Team B', members: ['Ali', 'John', 'Lisa'] },
];

describe('formatTeamHistory', () => {
  it('formats team lines, assignments, settings, and labels', () => {
    expect(formatTeamLine(teams[0]!)).toBe('Team A — Ahmad, Sarah, David');
    expect(formatTeamAssignment(teams)).toBe(
      'Team A — Ahmad, Sarah, David · Team B — Ali, John, Lisa',
    );
    expect(
      formatTeamSettings({
        teamCount: 2,
        balanced: true,
        random: true,
        preventDuplicates: true,
      }),
    ).toBe('2 teams · Balanced · Random · No duplicates');
    expect(
      formatTeamSettings({
        teamCount: 3,
        balanced: false,
        random: false,
        preventDuplicates: false,
      }),
    ).toBe('3 teams');
    expect(formatTeamHistoryLabel({ id: 't1', createdAt: '2026-01-01T00:00:00.000Z', teamCount: 2, balanced: true, random: true, preventDuplicates: true, teams })).toBe(
      'Team A, Team B',
    );
  });
});
