import {
  DEFAULT_TEAM_PARTICIPANTS,
  GENERATOR_LIMITS,
  GENERATOR_MESSAGES,
} from '@/features/random-generator/constants';
import {
  generateTeams,
  parseParticipants,
  teamLabel,
  uniqueParticipants,
} from '@/features/random-generator/utils/generateTeams';

const examplePeople = [...DEFAULT_TEAM_PARTICIPANTS];

describe('parseParticipants', () => {
  it('splits lines, trims names, and drops blanks', () => {
    expect(parseParticipants('Ahmad\n  Ali \n\nJohn\n')).toEqual(['Ahmad', 'Ali', 'John']);
  });
});

describe('uniqueParticipants', () => {
  it('keeps the first spelling of case-insensitive duplicates', () => {
    expect(uniqueParticipants(['Ahmad', 'Ali', 'ahmad', 'AHMAD', 'John'])).toEqual([
      'Ahmad',
      'Ali',
      'John',
    ]);
  });
});

describe('teamLabel', () => {
  it('labels teams A through Z then numbers', () => {
    expect(teamLabel(0)).toBe('Team A');
    expect(teamLabel(1)).toBe('Team B');
    expect(teamLabel(25)).toBe('Team Z');
    expect(teamLabel(26)).toBe('Team 27');
  });
});

describe('generateTeams', () => {
  it('assigns example participants into two balanced teams in input order', () => {
    const spy = vi.spyOn(Math, 'random');
    const result = generateTeams(
      {
        participants: examplePeople,
        teamCount: 2,
        balanced: true,
        random: false,
        preventDuplicates: true,
      },
      0,
    );

    expect(result).toEqual({
      ok: true,
      value: [
        { name: 'Team A', members: ['Ahmad', 'John', 'David'] },
        { name: 'Team B', members: ['Ali', 'Sarah', 'Lisa'] },
      ],
    });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('shuffles then deals round-robin when random assignment is on', () => {
    const result = generateTeams(
      {
        participants: examplePeople,
        teamCount: 2,
        balanced: true,
        random: true,
        preventDuplicates: true,
      },
      0,
    );

    expect(result).toEqual({
      ok: true,
      value: [
        { name: 'Team A', members: ['Ali', 'Sarah', 'Lisa'] },
        { name: 'Team B', members: ['John', 'David', 'Ahmad'] },
      ],
    });
  });

  it('never assigns the same participant to more than one team', () => {
    const result = generateTeams(
      {
        participants: examplePeople,
        teamCount: 3,
        balanced: true,
        random: true,
        preventDuplicates: true,
      },
      () => 0.4,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const members = result.value.flatMap((team) => team.members);
    expect(members).toHaveLength(examplePeople.length);
    expect(new Set(members)).toEqual(new Set(examplePeople));
    expect(result.value.every((team) => team.members.length === 2)).toBe(true);
  });

  it('fills earlier teams first when balanced is off', () => {
    const result = generateTeams(
      {
        participants: [...examplePeople, 'Omar'],
        teamCount: 3,
        balanced: false,
        random: false,
        preventDuplicates: true,
      },
      0,
    );

    expect(result).toEqual({
      ok: true,
      value: [
        { name: 'Team A', members: ['Ahmad', 'Ali', 'John'] },
        { name: 'Team B', members: ['Sarah', 'David', 'Lisa'] },
        { name: 'Team C', members: ['Omar'] },
      ],
    });
  });

  it('drops duplicate names before assigning when preventDuplicates is on', () => {
    const result = generateTeams(
      {
        participants: 'Ahmad\nAli\nahmad\nJohn',
        teamCount: 2,
        balanced: true,
        random: false,
        preventDuplicates: true,
      },
      0,
    );

    expect(result).toEqual({
      ok: true,
      value: [
        { name: 'Team A', members: ['Ahmad', 'John'] },
        { name: 'Team B', members: ['Ali'] },
      ],
    });
  });

  it('keeps duplicate name rows as separate people when preventDuplicates is off', () => {
    const result = generateTeams(
      {
        participants: ['Ahmad', 'Ali', 'Ahmad', 'John'],
        teamCount: 2,
        balanced: true,
        random: false,
        preventDuplicates: false,
      },
      0,
    );

    expect(result).toEqual({
      ok: true,
      value: [
        { name: 'Team A', members: ['Ahmad', 'Ahmad'] },
        { name: 'Team B', members: ['Ali', 'John'] },
      ],
    });
  });

  it('rejects too few people, too many teams, and invalid team counts', () => {
    expect(
      generateTeams(
        {
          participants: ['Ahmad'],
          teamCount: 2,
          balanced: true,
          random: false,
          preventDuplicates: true,
        },
        0,
      ),
    ).toEqual({ ok: false, error: GENERATOR_MESSAGES.participantsRequired });

    expect(
      generateTeams(
        {
          participants: examplePeople,
          teamCount: 7,
          balanced: true,
          random: false,
          preventDuplicates: true,
        },
        0,
      ),
    ).toEqual({ ok: false, error: GENERATOR_MESSAGES.tooManyTeams });

    expect(
      generateTeams(
        {
          participants: examplePeople,
          teamCount: 1,
          balanced: true,
          random: false,
          preventDuplicates: true,
        },
        0,
      ),
    ).toEqual({ ok: false, error: GENERATOR_MESSAGES.teamCountRequired });

    expect(
      generateTeams(
        {
          participants: examplePeople,
          teamCount: 2.5,
          balanced: true,
          random: false,
          preventDuplicates: true,
        },
        0,
      ),
    ).toEqual({ ok: false, error: GENERATOR_MESSAGES.teamCountRequired });

    expect(
      generateTeams(
        {
          participants: examplePeople,
          teamCount: GENERATOR_LIMITS.maxTeamCount + 1,
          balanced: true,
          random: false,
          preventDuplicates: true,
        },
        0,
      ),
    ).toEqual({ ok: false, error: GENERATOR_MESSAGES.teamCountRequired });
  });

  it('rejects oversized participant lists and names that are too long', () => {
    const tooMany = Array.from(
      { length: GENERATOR_LIMITS.maxParticipants + 1 },
      (_, index) => `Person ${index}`,
    );
    expect(
      generateTeams(
        {
          participants: tooMany,
          teamCount: 2,
          balanced: true,
          random: false,
          preventDuplicates: false,
        },
        0,
      ),
    ).toEqual({ ok: false, error: GENERATOR_MESSAGES.tooManyParticipants });

    expect(
      generateTeams(
        {
          participants: ['Ahmad', 'x'.repeat(GENERATOR_LIMITS.maxParticipantName + 1)],
          teamCount: 2,
          balanced: true,
          random: false,
          preventDuplicates: true,
        },
        0,
      ),
    ).toEqual({ ok: false, error: GENERATOR_MESSAGES.participantNameTooLong });
  });

  it('trims blank array entries before assigning teams', () => {
    const result = generateTeams(
      {
        participants: [' Ahmad ', '', '  ', 'Ali', 'John'],
        teamCount: 2,
        balanced: true,
        random: false,
        preventDuplicates: true,
      },
      0,
    );

    expect(result).toEqual({
      ok: true,
      value: [
        { name: 'Team A', members: ['Ahmad', 'John'] },
        { name: 'Team B', members: ['Ali'] },
      ],
    });
  });
});
