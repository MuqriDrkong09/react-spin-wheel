import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { storageService } from '@/services/storage/storageService';

import { useLocalStorage } from '@/hooks/useLocalStorage';

function ThemeProbe() {
  const [theme, setTheme] = useLocalStorage('probe-theme', 'light');

  return (
    <div>
      <p>Theme {theme}</p>
      <button type="button" onClick={() => setTheme('dark')}>
        Dark
      </button>
    </div>
  );
}

describe('useLocalStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    storageService.clearMemory();
  });

  it('uses the default value when nothing is stored', () => {
    render(<ThemeProbe />);
    expect(screen.getByText('Theme light')).toBeInTheDocument();
  });

  it('persists updates through the storage service', async () => {
    const user = userEvent.setup();
    render(<ThemeProbe />);

    await user.click(screen.getByRole('button', { name: 'Dark' }));

    expect(screen.getByText('Theme dark')).toBeInTheDocument();
    expect(storageService.readJson('probe-theme')).toBe('dark');
  });

  it('reads an existing stored value', () => {
    storageService.writeJson('probe-theme', 'dark');
    render(<ThemeProbe />);
    expect(screen.getByText('Theme dark')).toBeInTheDocument();
  });
});
