import { LoadingState, PageLoadingSkeleton } from '@/components/feedback/LoadingState';
import { renderWithProviders, screen, within } from '@/test/test-utils';

describe('LoadingState', () => {
  it('announces a default Loading status with a centered spinner', () => {
    renderWithProviders(<LoadingState />);

    const status = screen.getByRole('status', { name: 'Loading' });

    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveStyle({ display: 'flex', justifyContent: 'center' });
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByText('Loading', { selector: 'p' })).not.toBeInTheDocument();
  });

  it('uses a custom accessible label', () => {
    renderWithProviders(<LoadingState label="Loading wheels" />);

    expect(screen.getByRole('status', { name: 'Loading wheels' })).toBeInTheDocument();
    expect(screen.queryByRole('status', { name: 'Loading' })).not.toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('keeps the caption hidden by default', () => {
    renderWithProviders(<LoadingState label="Loading page…" />);

    expect(screen.getByRole('status', { name: 'Loading page…' })).toBeInTheDocument();
    expect(screen.queryByText('Loading page…', { selector: 'p' })).not.toBeInTheDocument();
  });

  it('shows a visible caption when showLabel is enabled', () => {
    renderWithProviders(<LoadingState label="Loading page…" showLabel />);

    const status = screen.getByRole('status', { name: 'Loading page…' });
    expect(within(status).getByText('Loading page…')).toBeInTheDocument();
    expect(within(status).getByRole('progressbar')).toBeInTheDocument();
  });
});

describe('PageLoadingSkeleton', () => {
  it('announces loading with the default label and three card placeholders', () => {
    const { container } = renderWithProviders(<PageLoadingSkeleton />);

    expect(screen.getByRole('status', { name: 'Loading' })).toHaveAttribute('aria-live', 'polite');
    expect(container.querySelectorAll('.MuiSkeleton-root')).toHaveLength(5);
    expect(container.querySelectorAll('.MuiSkeleton-rounded')).toHaveLength(3);
  });

  it('uses a custom label and card count', () => {
    const { container } = renderWithProviders(
      <PageLoadingSkeleton label="Loading dashboard" cards={5} />,
    );

    expect(screen.getByRole('status', { name: 'Loading dashboard' })).toBeInTheDocument();
    expect(container.querySelectorAll('.MuiSkeleton-rounded')).toHaveLength(5);
  });

  it('renders zero card placeholders when cards is 0', () => {
    const { container } = renderWithProviders(<PageLoadingSkeleton cards={0} />);

    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
    expect(container.querySelectorAll('.MuiSkeleton-rounded')).toHaveLength(0);
    expect(container.querySelectorAll('.MuiSkeleton-text')).toHaveLength(2);
  });
});
