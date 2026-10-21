import { ROUTES } from '@/constants/routes';
import { renderApp, screen } from '@/test/test-utils';

describe('App', () => {
  it('renders the dashboard shell', () => {
    renderApp();

    expect(screen.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('renders a feature page', () => {
    renderApp({ initialEntries: [ROUTES.wheels] });

    expect(screen.getByRole('heading', { name: 'Wheels', level: 1 })).toBeInTheDocument();
  });

  it('renders the not found page for unknown routes', () => {
    renderApp({ initialEntries: ['/missing-page'] });

    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument();
  });
});
