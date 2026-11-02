import { resetGeneratorHistoryStore, useGeneratorHistoryStore } from '@/stores/generatorHistoryStore';

const entry = {
  id: 'team-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  teamCount: 2,
  balanced: true,
  random: true,
  preventDuplicates: true,
  teams: [
    { name: 'Team A', members: ['Ahmad', 'Sarah', 'David'] },
    { name: 'Team B', members: ['Ali', 'John', 'Lisa'] },
  ],
} as const;

describe('generatorHistoryStore', () => {
  beforeEach(() => {
    resetGeneratorHistoryStore();
  });

  it('adds, deletes, and clears saved team results', () => {
    useGeneratorHistoryStore.getState().addTeamGeneration(entry);
    expect(useGeneratorHistoryStore.getState().generatorHistory).toHaveLength(1);

    useGeneratorHistoryStore.getState().deleteTeamGeneration('team-1');
    expect(useGeneratorHistoryStore.getState().generatorHistory).toEqual([]);

    useGeneratorHistoryStore.getState().addTeamGeneration(entry);
    useGeneratorHistoryStore.getState().addTeamGeneration({ ...entry, id: 'team-2' });
    expect(useGeneratorHistoryStore.getState().generatorHistory.map((item) => item.id)).toEqual([
      'team-2',
      'team-1',
    ]);

    useGeneratorHistoryStore.getState().clearTeamHistory();
    expect(useGeneratorHistoryStore.getState().generatorHistory).toEqual([]);
  });
});
