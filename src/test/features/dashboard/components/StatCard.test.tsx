import DonutLargeOutlinedIcon from '@mui/icons-material/DonutLargeOutlined';

import { StatCard } from '@/features/dashboard/components/StatCard';
import { renderWithProviders, screen } from '@/test/test-utils';

describe('StatCard', () => {
  it('renders the label and numeric value', () => {
    const { container } = renderWithProviders(<StatCard label="Total wheels" value={12} />);

    expect(screen.getByText('Total wheels')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(container.querySelector('.MuiCard-root')).toHaveClass('MuiPaper-outlined');
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  it('renders zero values', () => {
    renderWithProviders(<StatCard label="Total spins" value={0} />);

    expect(screen.getByText('Total spins')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('renders an optional icon above the label', () => {
    const { container } = renderWithProviders(
      <StatCard
        label="Favorite wheels"
        value={3}
        icon={<DonutLargeOutlinedIcon data-testid="stat-icon" color="primary" />}
      />,
    );

    expect(screen.getByTestId('stat-icon')).toBeInTheDocument();
    expect(screen.getByText('Favorite wheels')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('keeps the value as a paragraph for consistent card typography', () => {
    renderWithProviders(<StatCard label="Total winners" value={42} />);

    const value = screen.getByText('42');
    expect(value.tagName).toBe('P');
    expect(value).toHaveClass('MuiTypography-h4');
  });
});
