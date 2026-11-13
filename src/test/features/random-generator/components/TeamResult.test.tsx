import { TeamResultCard } from '@/features/random-generator/components/TeamResult';
import { GENERATOR_MESSAGES } from '@/features/random-generator/constants';
import { renderWithProviders, screen, within } from '@/test/test-utils';

describe('TeamResultCard', () => {
  it('shows the empty state by default', () => {
    renderWithProviders(<TeamResultCard />);

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveTextContent(GENERATOR_MESSAGES.emptyTeamResult);
    expect(screen.queryByLabelText(GENERATOR_MESSAGES.teamResultLabel)).not.toBeInTheDocument();
  });

  it('treats null and empty teams as empty results', () => {
    const { rerender } = renderWithProviders(<TeamResultCard teams={null} />);
    expect(screen.getByRole('status')).toHaveTextContent(GENERATOR_MESSAGES.emptyTeamResult);

    rerender(<TeamResultCard teams={[]} />);
    expect(screen.getByRole('status')).toHaveTextContent(GENERATOR_MESSAGES.emptyTeamResult);
  });

  it('renders generated teams and members', () => {
    renderWithProviders(
      <TeamResultCard
        teams={[
          { name: 'Team A', members: ['Ahmad', 'Sarah', 'David'] },
          { name: 'Team B', members: ['Ali', 'John', 'Lisa'] },
        ]}
      />,
    );

    const result = screen.getByLabelText(GENERATOR_MESSAGES.teamResultLabel);
    expect(within(result).getByRole('heading', { name: 'Team A', level: 3 })).toBeInTheDocument();
    expect(within(result).getByRole('heading', { name: 'Team B', level: 3 })).toBeInTheDocument();
    expect(result).toHaveTextContent('- Ahmad');
    expect(result).toHaveTextContent('- Sarah');
    expect(result).toHaveTextContent('- David');
    expect(result).toHaveTextContent('- Ali');
    expect(result).toHaveTextContent('- John');
    expect(result).toHaveTextContent('- Lisa');
  });

  it('shows a no-members placeholder for empty teams', () => {
    renderWithProviders(
      <TeamResultCard teams={[{ name: 'Team A', members: [] }, { name: 'Team B', members: ['Ali'] }]} />,
    );

    const result = screen.getByLabelText(GENERATOR_MESSAGES.teamResultLabel);
    expect(result).toHaveTextContent(GENERATOR_MESSAGES.noTeamMembers);
    expect(result).toHaveTextContent('- Ali');
  });

  it('prefers the error state over teams', () => {
    renderWithProviders(
      <TeamResultCard
        error={GENERATOR_MESSAGES.participantsRequired}
        teams={[{ name: 'Team A', members: ['Ahmad'] }]}
      />,
    );

    const status = screen.getByRole('status');
    expect(status).toHaveTextContent(GENERATOR_MESSAGES.participantsRequired);
    expect(screen.queryByLabelText(GENERATOR_MESSAGES.teamResultLabel)).not.toBeInTheDocument();
    expect(screen.queryByText('- Ahmad')).not.toBeInTheDocument();
  });
});
