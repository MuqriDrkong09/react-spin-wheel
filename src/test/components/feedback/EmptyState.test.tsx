import { Button } from '@mui/material';

import { EmptyState } from '@/components/feedback/EmptyState';
import { renderWithProviders, screen } from '@/test/test-utils';

describe('EmptyState', () => {
  it('renders the title as an h1 heading by default', () => {
    renderWithProviders(<EmptyState title="No wheels yet" />);

    const heading = screen.getByRole('heading', { name: 'No wheels yet', level: 1 });

    expect(heading).toHaveClass('MuiTypography-h5');
    expect(heading.parentElement).toHaveStyle({ textAlign: 'center' });
    expect(
      screen.queryByText('Create a wheel to start spinning names, meals, and decisions.'),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders an optional description', () => {
    renderWithProviders(
      <EmptyState
        title="No matching wheels"
        description="Try a different search, category, or sort order."
      />,
    );

    expect(screen.getByRole('heading', { name: 'No matching wheels', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('Try a different search, category, or sort order.')).toHaveStyle({
      maxWidth: '520px',
    });
  });

  it('renders an optional action under the copy', () => {
    renderWithProviders(
      <EmptyState title="No wheels yet" action={<Button>Create your first wheel</Button>} />,
    );

    const action = screen.getByRole('button', { name: 'Create your first wheel' });

    expect(screen.getByRole('heading', { name: 'No wheels yet', level: 1 })).toBeInTheDocument();
    expect(action).toBeInTheDocument();
    expect(action.parentElement).toHaveStyle({ marginTop: '24px' });
  });

  it('can render the title as an h2', () => {
    renderWithProviders(
      <EmptyState
        title="No matching wheels"
        description="Try a different search, category, or sort order."
        titleComponent="h2"
      />,
    );

    expect(screen.getByRole('heading', { name: 'No matching wheels', level: 2 })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
  });

  it('can render the title as an h3', () => {
    renderWithProviders(<EmptyState title="This wheel has no items" titleComponent="h3" />);

    expect(
      screen.getByRole('heading', { name: 'This wheel has no items', level: 3 }),
    ).toBeInTheDocument();
  });

  it('renders title, description, and action together', () => {
    renderWithProviders(
      <EmptyState
        title="Page not found"
        description="The page you are looking for does not exist yet."
        action={<Button>Back to dashboard</Button>}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Page not found', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('The page you are looking for does not exist yet.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to dashboard' })).toBeInTheDocument();
  });
});
