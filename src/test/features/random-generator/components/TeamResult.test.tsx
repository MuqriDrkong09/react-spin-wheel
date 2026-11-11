import { TeamResultCard } from '@/features/random-generator/components/TeamResult';
import { GENERATOR_MESSAGES } from '@/features/random-generator/constants';
import { renderWithProviders, screen } from '@/test/test-utils';

describe('TeamResultCard', () => {
  it('shows empty, success, and error states', async () => {
    const { rerender } = renderWithProviders(<TeamResultCard />);
    expect(screen.getByRole('status')).toHaveTextContent(GENERATOR_MESSAGES.emptyTeamResult);

    rerender(
      <TeamResultCard
        teams={[
          { name: 'Team A', members: ['Ahmad', 'Sarah', 'David'] },
          { name: 'Team B', members: ['Ali', 'John', 'Lisa'] },
        ]}
      />,
    );

    const result = screen.getByLabelText(GENERATOR_MESSAGES.teamResultLabel);
    expect(result).toHaveTextContent('Team A');
    expect(result).toHaveTextContent('- Ahmad');
    expect(result).toHaveTextContent('Team B');
    expect(result).toHaveTextContent('- Lisa');

    rerender(<TeamResultCard error={GENERATOR_MESSAGES.participantsRequired} />);
    expect(screen.getByRole('status')).toHaveTextContent(GENERATOR_MESSAGES.participantsRequired);
  });
});
