import { ROUTES } from '@/constants/routes';
import { EXPORT_MESSAGES } from '@/features/wheel-export/constants';
import { downloadJsonFile } from '@/features/wheel-export/utils/downloadJsonFile';
import { SHARE_MESSAGES } from '@/features/wheel-share/constants';
import { resetFavoritesStore, useFavoritesStore } from '@/stores/favoritesStore';
import { resetHistoryStore } from '@/stores/historyStore';
import { resetSettingsStore } from '@/stores/settingsStore';
import { resetWheelStore, useWheelStore } from '@/stores/wheelStore';
import { renderApp, screen, userEvent, waitFor, within } from '@/test/test-utils';

vi.mock('@/features/wheel-export/utils/downloadJsonFile', () => ({
  downloadJsonFile: vi.fn(),
}));

const downloadJsonFileMock = vi.mocked(downloadJsonFile);

function seedWheels() {
  useWheelStore.getState().createWheel({
    id: 'pizza',
    name: 'Pizza Night',
    description: 'Weekend dinner',
    category: 'Food',
  });
  useWheelStore.getState().createWheel({
    id: 'chores',
    name: 'Chores',
    category: 'Decisions',
  });
  useFavoritesStore.getState().addFavorite('pizza');
}

describe('WheelsScreen', () => {
  beforeEach(() => {
    resetWheelStore();
    resetHistoryStore();
    resetFavoritesStore();
    resetSettingsStore();
    downloadJsonFileMock.mockReset();
    downloadJsonFileMock.mockReturnValue(true);
  });

  it('shows an empty state and opens create wheel from the header', async () => {
    const user = userEvent.setup();
    await renderApp({ initialEntries: [ROUTES.wheels] });

    expect(screen.getByRole('heading', { name: 'Wheels', level: 1 })).toBeInTheDocument();
    expect(
      screen.getByText('Browse, organize, and open the wheels in your workspace.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'No wheels yet', level: 2 })).toBeInTheDocument();
    expect(
      screen.getByText('Create a wheel to start building your library.'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Create Wheel' }));
    expect(await screen.findByRole('heading', { name: 'Create wheel', level: 1 })).toBeInTheDocument();
  });

  it('opens create wheel from the empty-state action', async () => {
    const user = userEvent.setup();
    await renderApp({ initialEntries: [ROUTES.wheels] });

    await user.click(screen.getByRole('button', { name: 'Create your first wheel' }));
    expect(await screen.findByRole('heading', { name: 'Create wheel', level: 1 })).toBeInTheDocument();
  });

  it('lists wheels and shows a no-match empty state when filters exclude everything', async () => {
    const user = userEvent.setup();
    seedWheels();
    await renderApp({ initialEntries: [ROUTES.wheels] });

    expect(screen.getByRole('heading', { name: 'Pizza Night', level: 3 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Chores', level: 3 })).toBeInTheDocument();

    await user.type(screen.getByLabelText('Search wheels'), 'zzzzz');

    expect(await screen.findByRole('heading', { name: 'No matching wheels', level: 2 })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Try a different search, category, favorites, recently used filter, or sort order.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Pizza Night', level: 3 })).not.toBeInTheDocument();
  });

  it('opens a wheel on the spin page', async () => {
    const user = userEvent.setup();
    seedWheels();
    await renderApp({ initialEntries: [ROUTES.wheels] });

    await user.click(screen.getByRole('button', { name: 'Open Pizza Night' }));
    expect(await screen.findByRole('heading', { name: 'Spin', level: 1 })).toBeInTheDocument();
    expect(useWheelStore.getState().activeWheelId).toBe('pizza');
  });

  it('opens a wheel in the editor', async () => {
    const user = userEvent.setup();
    seedWheels();
    await renderApp({ initialEntries: [ROUTES.wheels] });

    await user.click(screen.getByRole('button', { name: 'Edit Pizza Night' }));
    expect(await screen.findByRole('heading', { name: 'Wheel editor', level: 1 })).toBeInTheDocument();
    expect(useWheelStore.getState().activeWheelId).toBe('pizza');
  });

  it('toggles favorites, cancels delete, and confirms delete', async () => {
    const user = userEvent.setup();
    seedWheels();
    await renderApp({ initialEntries: [ROUTES.wheels] });

    await user.click(screen.getByRole('button', { name: 'Remove Pizza Night from favorites' }));
    expect(useFavoritesStore.getState().favoriteWheelIds).not.toContain('pizza');
    await user.click(screen.getByRole('button', { name: 'Add Pizza Night to favorites' }));
    expect(useFavoritesStore.getState().favoriteWheelIds).toContain('pizza');

    await user.click(screen.getByRole('button', { name: 'Delete Chores' }));
    const dialog = screen.getByRole('dialog', { name: 'Delete wheel' });
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(useWheelStore.getState().getWheel('chores')).toBeDefined();

    await user.click(screen.getByRole('button', { name: 'Delete Chores' }));
    await user.click(
      within(screen.getByRole('dialog', { name: 'Delete wheel' })).getByRole('button', {
        name: 'Delete',
      }),
    );
    expect(useWheelStore.getState().getWheel('chores')).toBeUndefined();
  });

  it('exports a wheel and clears the export snackbar', async () => {
    const user = userEvent.setup();
    seedWheels();
    useWheelStore.getState().addItem('pizza', {
      name: 'Pepperoni',
      color: '#dc2626',
      enabled: true,
      weight: 1,
    });
    await renderApp({ initialEntries: [ROUTES.wheels] });

    await user.click(screen.getByRole('button', { name: 'Export Pizza Night' }));

    expect(downloadJsonFileMock).toHaveBeenCalledWith(
      'pizza-night-wheel.json',
      expect.stringContaining('"name": "Pizza Night"'),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      EXPORT_MESSAGES.success('Pizza Night', 'pizza-night-wheel.json'),
    );

    await user.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  it('copies a share link and clears the share snackbar', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });

    seedWheels();
    useWheelStore.getState().addItem('pizza', {
      name: 'Pepperoni',
      color: '#dc2626',
      enabled: true,
      weight: 1,
    });
    await renderApp({ initialEntries: [ROUTES.wheels] });

    await user.click(screen.getByRole('button', { name: 'Share Pizza Night' }));

    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('/share?s='));
    expect(await screen.findByRole('alert')).toHaveTextContent(SHARE_MESSAGES.copied('Pizza Night'));

    await user.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    vi.unstubAllGlobals();
  });
});
