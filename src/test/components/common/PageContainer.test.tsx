import { PageContainer } from '@/components/common/PageContainer';
import { renderWithProviders, screen } from '@/test/test-utils';

describe('PageContainer', () => {
  it('renders children in a gutterless large container with no default padding', () => {
    renderWithProviders(
      <PageContainer>
        <h1>Dashboard</h1>
      </PageContainer>,
    );

    const heading = screen.getByRole('heading', { name: 'Dashboard' });
    const container = heading.parentElement;

    expect(container).toHaveClass('MuiContainer-root');
    expect(container).toHaveClass('MuiContainer-maxWidthLg');
    expect(container).toHaveClass('MuiContainer-disableGutters');
    expect(container).toHaveStyle({ padding: '0px' });
  });

  it('merges a single sx value after the default padding', () => {
    renderWithProviders(
      <PageContainer sx={{ mt: 2 }} data-testid="page">
        Content
      </PageContainer>,
    );

    expect(screen.getByTestId('page')).toHaveStyle({ padding: '0px', marginTop: '16px' });
  });

  it('merges an sx array after the default padding', () => {
    renderWithProviders(
      <PageContainer sx={[{ mt: 1 }, { px: 2 }]} data-testid="page">
        Content
      </PageContainer>,
    );

    expect(screen.getByTestId('page')).toHaveStyle({
      marginTop: '8px',
      paddingLeft: '16px',
      paddingRight: '16px',
    });
  });

  it('forwards extra container props', () => {
    renderWithProviders(
      <PageContainer component="section" aria-label="Page">
        Content
      </PageContainer>,
    );

    expect(screen.getByRole('region', { name: 'Page' })).toHaveTextContent('Content');
  });
});
