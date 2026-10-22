import { resetFavoritesStore, useFavoritesStore } from '@/stores/favoritesStore';
import { resetHistoryStore, useHistoryStore } from '@/stores/historyStore';
import { resetSettingsStore, useSettingsStore } from '@/stores/settingsStore';
import { resetWheelStore, useWheelStore } from '@/stores/wheelStore';
import { renderApp, screen, userEvent, within } from '@/test/test-utils';
import { SPIN_SESSION_STATUS } from '@/types/wheel';

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
        parentItemId: null,
        path: ['pepperoni'],
        depth: 0,
        probability: 1,
        spunAt: '2026-01-04T00:00:00.000Z',
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
  });

  it('shows an empty state when there are no wheels', () => {
    renderApp();

    expect(screen.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'No wheels yet' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Wheel' })).toBeInTheDocument();
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
    expect(screen.queryByRole('heading', { name: 'Pizza Night', level: 3 })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Chores', level: 3 })).toBeInTheDocument();

    await user.clear(screen.getByLabelText('Search wheels'));
    await user.click(screen.getByLabelText('Category'));
    await user.click(screen.getByRole('option', { name: 'Food' }));
    expect(screen.getByRole('heading', { name: 'Pizza Night', level: 3 })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Chores', level: 3 })).not.toBeInTheDocument();

    await user.click(screen.getByLabelText('Category'));
    await user.click(screen.getByRole('option', { name: 'All categories' }));
    await user.click(screen.getByLabelText('Sort'));
    await user.click(screen.getByRole('option', { name: 'Name A-Z' }));
    expect(screen.getByRole('heading', { name: 'Chores', level: 3 })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remove Pizza Night from favorites' }));
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

  it('deletes immediately when confirmation is disabled', async () => {
    const user = userEvent.setup();
    useSettingsStore.getState().updateSettings({ confirmBeforeDelete: false });
    seedDashboard();
    renderApp();

    await user.click(screen.getByRole('button', { name: 'Delete Chores' }));
    expect(useWheelStore.getState().getWheel('chores')).toBeUndefined();
    expect(screen.queryByRole('dialog', { name: 'Delete wheel' })).not.toBeInTheDocument();
  });
});
