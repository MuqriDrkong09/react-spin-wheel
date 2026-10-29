import { LoadingState } from '@/components/feedback/LoadingState';
import { renderWithProviders, screen } from '@/test/test-utils';

describe('LoadingState', () => {
  it('announces a default Loading status with a centered spinner', () => {
    renderWithProviders(<LoadingState />);

    const status = screen.getByRole('status', { name: 'Loading' });

    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveStyle({ display: 'flex', justifyContent: 'center' });
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('uses a custom accessible label', () => {
    renderWithProviders(<LoadingState label="Loading wheels" />);

    expect(screen.getByRole('status', { name: 'Loading wheels' })).toBeInTheDocument();
    expect(screen.queryByRole('status', { name: 'Loading' })).not.toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
