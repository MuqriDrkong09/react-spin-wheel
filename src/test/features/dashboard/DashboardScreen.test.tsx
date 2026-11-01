import { fireEvent } from '@testing-library/react';

import { APP_DESCRIPTION } from '@/constants/app';
import { DEFAULT_WHEEL_SETTINGS } from '@/constants/wheel';
import { EXPORT_MESSAGES } from '@/features/wheel-export/constants';
import { WHEEL_EXPORT_FORMAT, WHEEL_EXPORT_VERSION } from '@/features/wheel-export/constants';
import { downloadJsonFile } from '@/features/wheel-export/utils/downloadJsonFile';
import { IMPORT_MESSAGES } from '@/features/wheel-import/constants';
import { resetFavoritesStore, useFavoritesStore } from '@/stores/favoritesStore';
import { resetHistoryStore, useHistoryStore } from '@/stores/historyStore';
import { resetSettingsStore, useSettingsStore } from '@/stores/settingsStore';
import { resetWheelStore, useWheelStore } from '@/stores/wheelStore';
import { renderApp, screen, userEvent, waitFor, within } from '@/test/test-utils';
import { SPIN_SESSION_STATUS } from '@/types/wheel';

vi.mock('@/features/wheel-export/utils/downloadJsonFile', () => ({
  downloadJsonFile: vi.fn(),
}));

const downloadJsonFileMock = vi.mocked(downloadJsonFile);

function seedDashboard() {
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
  useHistoryStore.getState().addSpinSession({
    id: 's1',
    wheelId: 'pizza',
    wheelName: 'Pizza Night',
    status: SPIN_SESSION_STATUS.completed,
    results: [
      {
        id: 'r1',
        sessionId: 's1',
        wheelId: 'pizza',
        itemId: 'pepperoni',
        itemName: 'Pepperoni',
        selectedItemId: 'pepperoni',
        selectedItemName: 'Pepperoni',
        parentItemId: null,
        path: ['pepperoni'],
        pathLabels: ['Pepperoni'],
        depth: 0,
        probability: 1,
        timestamp: '2026-01-04T00:00:00.000Z',
        spunAt: '2026-01-04T00:00:00.000Z',
        duration: 1200,
        mode: 'manual',
      },
    ],
    path: ['pepperoni'],
    startedAt: '2026-01-04T00:00:00.000Z',
    completedAt: '2026-01-04T00:00:01.000Z',
  });
}

describe('DashboardScreen', () => {
  beforeEach(() => {
    resetWheelStore();
    resetHistoryStore();
    resetFavoritesStore();
    resetSettingsStore();
    downloadJsonFileMock.mockReset();
  });

  it('shows an empty state when there are no wheels', () => {
    renderApp();

    expect(screen.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeInTheDocument();
    expect(screen.getByText(APP_DESCRIPTION)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'No wheels yet', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Wheel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Import' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Import wheel JSON' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create your first wheel' })).toBeInTheDocument();
    expect(screen.getByText('No favorite wheels yet.')).toBeInTheDocument();
    expect(screen.getByText('No recently used wheels yet.')).toBeInTheDocument();
    expect(screen.getByText('No selected results yet.')).toBeInTheDocument();
  });

  it('opens the create wheel page', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole('button', { name: 'Create Wheel' }));

    expect(await screen.findByRole('heading', { name: 'Create wheel', level: 1 })).toBeInTheDocument();
  });

  it('opens create wheel from the empty-state action', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole('button', { name: 'Create your first wheel' }));

    expect(await screen.findByRole('heading', { name: 'Create wheel', level: 1 })).toBeInTheDocument();
  });

  it('shows an empty state when filters match no wheels', async () => {
    const user = userEvent.setup();
    seedDashboard();
    renderApp();

    await user.type(screen.getByLabelText('Search wheels'), 'zzzzz');

    expect(await screen.findByRole('heading', { name: 'No matching wheels', level: 2 })).toBeInTheDocument();
    expect(
      screen.getByText('Try a different search, category, favorites, recently used filter, or sort order.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Pizza Night', level: 3 })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Chores', level: 3 })).not.toBeInTheDocument();
  });

  it('renders stats, lists, search, filter, favorite, open, edit, and delete', async () => {
    const user = userEvent.setup();
    seedDashboard();
    renderApp();

    expect(screen.getByText('Total wheels').nextElementSibling).toHaveTextContent('2');
    expect(screen.getByText('Total spins').nextElementSibling).toHaveTextContent('1');
    expect(screen.getByText('Total winners').nextElementSibling).toHaveTextContent('1');
    expect(
      screen.getAllByText('Favorite wheels').find((node) => node.tagName.toLowerCase() === 'p')
        ?.nextElementSibling,
    ).toHaveTextContent('1');
    expect(screen.getByRole('heading', { name: 'Pizza Night', level: 3 })).toBeInTheDocument();
    expect(screen.getByText('Pepperoni')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Search wheels'), 'chore');
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Pizza Night', level: 3 })).not.toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: 'Chores', level: 3 })).toBeInTheDocument();

    await user.clear(screen.getByLabelText('Search wheels'));
    await user.type(screen.getByLabelText('Search wheels'), 'food');
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Chores', level: 3 })).not.toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: 'Pizza Night', level: 3 })).toBeInTheDocument();

    await user.clear(screen.getByLabelText('Search wheels'));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Chores', level: 3 })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('combobox', { name: 'Category' }));
    await user.click(screen.getByRole('option', { name: 'Food' }));
    expect(screen.getByRole('heading', { name: 'Pizza Night', level: 3 })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Chores', level: 3 })).not.toBeInTheDocument();

    await user.click(screen.getByRole('combobox', { name: 'Category' }));
    await user.click(screen.getByRole('option', { name: 'All categories' }));
    await user.click(screen.getByRole('combobox', { name: 'Sort' }));
    await user.click(screen.getByRole('option', { name: 'Name' }));
    expect(screen.getByRole('heading', { name: 'Chores', level: 3 })).toBeInTheDocument();

    await user.click(screen.getByRole('combobox', { name: 'Sort' }));
    await user.click(screen.getByRole('option', { name: 'Created date' }));
    await user.click(screen.getByRole('combobox', { name: 'Sort' }));
    await user.click(screen.getByRole('option', { name: 'Most used' }));
    await user.click(screen.getByRole('combobox', { name: 'Recently used' }));
    await user.click(screen.getByRole('option', { name: 'Recently used' }));
    expect(screen.getByRole('heading', { name: 'Pizza Night', level: 3 })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Chores', level: 3 })).not.toBeInTheDocument();

    await user.click(screen.getByRole('combobox', { name: 'Recently used' }));
    await user.click(screen.getByRole('option', { name: 'All wheels' }));

    await user.click(screen.getByRole('combobox', { name: 'Favorites' }));
    await user.click(screen.getByRole('option', { name: 'Favorites only' }));
    expect(screen.getByRole('heading', { name: 'Pizza Night', level: 3 })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Chores', level: 3 })).not.toBeInTheDocument();

    await user.click(screen.getByRole('combobox', { name: 'Favorites' }));
    await user.click(screen.getByRole('option', { name: 'All wheels' }));
    await user.click(screen.getAllByRole('button', { name: 'Remove Pizza Night from favorites' })[0]!);
    expect(useFavoritesStore.getState().favoriteWheelIds).not.toContain('pizza');
    await user.click(screen.getByRole('button', { name: 'Add Pizza Night to favorites' }));
    expect(useFavoritesStore.getState().favoriteWheelIds).toContain('pizza');

    await user.click(screen.getByRole('button', { name: 'Delete Chores' }));
    const dialog = screen.getByRole('dialog', { name: 'Delete wheel' });
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));
    expect(useWheelStore.getState().getWheel('chores')).toBeUndefined();
  });

  it('opens a wheel on the spin page', async () => {
    const user = userEvent.setup();
    seedDashboard();
    renderApp();

    await user.click(screen.getByRole('button', { name: 'Open Pizza Night' }));
    expect(screen.getByRole('heading', { name: 'Spin', level: 1 })).toBeInTheDocument();
    expect(useWheelStore.getState().activeWheelId).toBe('pizza');
  });

  it('opens a wheel in the editor', async () => {
    const user = userEvent.setup();
    seedDashboard();
    renderApp();

    await user.click(screen.getByRole('button', { name: 'Edit Pizza Night' }));
    expect(screen.getByRole('heading', { name: 'Wheel editor', level: 1 })).toBeInTheDocument();
    expect(useWheelStore.getState().activeWheelId).toBe('pizza');
  });

  it('opens a favorite wheel from the side card', async () => {
    const user = userEvent.setup();
    seedDashboard();
    renderApp();

    await user.click(screen.getByRole('button', { name: 'Open favorite Pizza Night' }));

    expect(screen.getByRole('heading', { name: 'Spin', level: 1 })).toBeInTheDocument();
    expect(useWheelStore.getState().activeWheelId).toBe('pizza');
  });

  it('unfavorites a wheel from the favorite section', async () => {
    const user = userEvent.setup();
    seedDashboard();
    renderApp();

    const favoriteHeading = screen.getByRole('heading', { name: 'Favorite wheels', level: 2 });
    const favoriteCard = favoriteHeading.parentElement;
    expect(favoriteCard).toBeTruthy();
    await user.click(
      within(favoriteCard as HTMLElement).getByRole('button', {
        name: 'Remove Pizza Night from favorites',
      }),
    );

    expect(useFavoritesStore.getState().favoriteWheelIds).not.toContain('pizza');
    expect(screen.getByText('No favorite wheels yet.')).toBeInTheDocument();
  });

  it('cancels a pending delete', async () => {
    const user = userEvent.setup();
    seedDashboard();
    renderApp();

    await user.click(screen.getByRole('button', { name: 'Delete Chores' }));
    const dialog = screen.getByRole('dialog', { name: 'Delete wheel' });
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    expect(useWheelStore.getState().getWheel('chores')).toBeDefined();
    expect(screen.queryByRole('dialog', { name: 'Delete wheel' })).not.toBeInTheDocument();
  });

  it('deletes immediately when confirmation is disabled', async () => {
    const user = userEvent.setup();
    useSettingsStore.getState().updateSettings({ confirmBeforeDelete: false });
    seedDashboard();
    renderApp();

    await user.click(screen.getByRole('button', { name: 'Delete Chores' }));
    expect(useWheelStore.getState().getWheel('chores')).toBeUndefined();
    expect(screen.queryByRole('dialog', { name: 'Delete wheel' })).not.toBeInTheDocument();
  });

  it('exports a valid wheel as json', async () => {
    const user = userEvent.setup();
    seedDashboard();
    useWheelStore.getState().addItem('pizza', {
      name: 'Pepperoni',
      color: '#dc2626',
      enabled: true,
      weight: 1,
    });
    renderApp();

    await user.click(screen.getByRole('button', { name: 'Export Pizza Night' }));

    expect(downloadJsonFileMock).toHaveBeenCalledWith(
      'pizza-night-wheel.json',
      expect.stringContaining('"name": "Pizza Night"'),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      EXPORT_MESSAGES.success('Pizza Night', 'pizza-night-wheel.json'),
    );
  });

  it('does not export a wheel with no items', async () => {
    const user = userEvent.setup();
    seedDashboard();
    renderApp();

    await user.click(screen.getByRole('button', { name: 'Export Pizza Night' }));

    expect(downloadJsonFileMock).not.toHaveBeenCalled();
    expect(await screen.findByRole('alert')).toHaveTextContent(EXPORT_MESSAGES.itemsRequired);
  });

  it('imports a valid json file after the user confirms a name', async () => {
    const user = userEvent.setup();
    renderApp();
    const file = new File(
      [
        JSON.stringify({
          format: WHEEL_EXPORT_FORMAT,
          version: WHEEL_EXPORT_VERSION,
          id: 'imported-wheel',
          name: 'Food Picker',
          items: [
            {
              id: 'pizza',
              name: 'Pizza',
              color: '#ea580c',
              enabled: true,
              weight: 1,
              children: [{ id: 'pepperoni', name: 'Pepperoni', color: '#dc2626', enabled: true, weight: 2 }],
            },
          ],
          settings: DEFAULT_WHEEL_SETTINGS,
        }),
      ],
      'food-picker-wheel.json',
      { type: 'application/json' },
    );

    await user.upload(screen.getByLabelText('Choose wheel JSON file'), file);

    const dialog = await screen.findByRole('dialog', { name: 'Import wheel' });
    const nameField = within(dialog).getByRole('textbox', { name: 'Wheel name' });
    expect(nameField).toHaveValue('Food Picker');
    await user.clear(nameField);
    await user.type(nameField, 'Dinner Wheel');
    await user.click(within(dialog).getByRole('button', { name: 'Import wheel' }));

    const imported = useWheelStore.getState().wheels.find((wheel) => wheel.name === 'Dinner Wheel');
    expect(imported).toBeDefined();
    expect(imported?.id).not.toBe('imported-wheel');
    expect(imported?.items[0]?.id).not.toBe('pizza');
    expect(imported?.items[0]?.children?.[0]?.name).toBe('Pepperoni');
    expect(await screen.findByRole('alert')).toHaveTextContent(IMPORT_MESSAGES.success('Dinner Wheel'));
    expect(screen.getByRole('heading', { name: 'Dinner Wheel', level: 3 })).toBeInTheDocument();
  });

  it('shows an error for malformed json and does not import', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.upload(
      screen.getByLabelText('Choose wheel JSON file'),
      new File(['{'], 'bad.json', { type: 'application/json' }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(IMPORT_MESSAGES.malformed);
    expect(screen.queryByRole('dialog', { name: 'Import wheel' })).not.toBeInTheDocument();
    expect(useWheelStore.getState().wheels).toHaveLength(0);
  });

  it('imports from a dropped json file', async () => {
    const user = userEvent.setup();
    renderApp();
    const file = new File(
      [
        JSON.stringify({
          format: WHEEL_EXPORT_FORMAT,
          version: WHEEL_EXPORT_VERSION,
          name: 'Dropped Wheel',
          items: [{ name: 'Yes', color: '#16a34a', enabled: true, weight: 1 }],
          settings: DEFAULT_WHEEL_SETTINGS,
        }),
      ],
      'dropped-wheel.json',
      { type: 'application/json' },
    );

    fireEvent.drop(screen.getByLabelText('Import wheel JSON'), {
      dataTransfer: { files: [file] },
    });

    const dialog = await screen.findByRole('dialog', { name: 'Import wheel' });
    expect(within(dialog).getByRole('textbox', { name: 'Wheel name' })).toHaveValue('Dropped Wheel');
    await user.click(within(dialog).getByRole('button', { name: 'Import wheel' }));

    expect(useWheelStore.getState().wheels.some((wheel) => wheel.name === 'Dropped Wheel')).toBe(true);
    expect(await screen.findByRole('alert')).toHaveTextContent(IMPORT_MESSAGES.success('Dropped Wheel'));
  });
});

