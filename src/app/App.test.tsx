import { APP_NAME } from '@/shared/constants';
import { renderApp, screen } from '@/test/test-utils';

describe('App', () => {
  it('renders the application shell', () => {
    renderApp();

    expect(screen.getByRole('heading', { name: APP_NAME, level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /home/i })).toBeInTheDocument();
  });

  it('renders the not found page for unknown routes', () => {
    renderApp({ initialEntries: ['/missing-page'] });

    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument();
  });
});
