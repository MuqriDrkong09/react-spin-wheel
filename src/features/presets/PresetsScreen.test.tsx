import { ROUTES } from '@/constants/routes';
import { PRESET_MESSAGES } from '@/features/presets/constants';
import { getFrozenPresetCatalog } from '@/features/presets/data/catalog';
import { loadPersistedState } from '@/services/storage/persistedState';
import { storageService } from '@/services/storage/storageService';
import { resetWheelStore, useWheelStore } from '@/stores/wheelStore';
import { renderApp, screen, userEvent, within } from '@/test/test-utils';

describe('PresetsScreen', () => {
  beforeEach(() => {
    window.localStorage.clear();
    storageService.clearMemory();
    resetWheelStore();
  });

  it('lists built-in presets and previews hierarchical food options', async () => {
    const user = userEvent.setup();
    renderApp({ initialEntries: [ROUTES.presets] });

    expect(screen.getByRole('heading', { name: PRESET_MESSAGES.title, level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Food/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Movie/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Workout/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Team/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Preview Food' }));
    const dialog = screen.getByRole('dialog', { name: PRESET_MESSAGES.previewTitle('Food') });
    expect(within(dialog).getByText(/Pizza/)).toBeInTheDocument();
    expect(within(dialog).getByText('Chicken Pepperoni')).toBeInTheDocument();
    expect(within(dialog).getByText('Beef Pepperoni')).toBeInTheDocument();
    expect(within(dialog).getByText(PRESET_MESSAGES.previewHint)).toBeInTheDocument();
  });

  it('creates a copy from a preset and opens spin without changing the catalog', async () => {
    const user = userEvent.setup();
    renderApp({ initialEntries: [ROUTES.presets] });

    await user.click(screen.getByRole('button', { name: 'Create Food from preset' }));

    const created = useWheelStore.getState().wheels[0];
    expect(created?.name).toBe('Food');
    expect(created?.items.map((item) => item.name)).toEqual(['Pizza', 'Burger', 'Noodles', 'Sushi']);
    expect(created?.items[0]?.children?.map((item) => item.name)).toEqual([
      'Chicken Pepperoni',
      'Beef Pepperoni',
    ]);
    expect(useWheelStore.getState().activeWheelId).toBe(created?.id);
    expect(loadPersistedState().wheels[0]?.name).toBe('Food');
    expect(screen.getByRole('heading', { name: 'Spin', level: 1 })).toBeInTheDocument();
    expect(getFrozenPresetCatalog()[0]?.items[0]?.name).toBe('Pizza');
  });

  it('opens a copy in the editor when modifying a preset', async () => {
    const user = userEvent.setup();
    renderApp({ initialEntries: [ROUTES.presets] });

    await user.click(screen.getByRole('button', { name: 'Modify Food' }));

    expect(useWheelStore.getState().wheels[0]?.name).toBe('Food');
    expect(
      await screen.findByRole('heading', { name: 'Wheel editor', level: 1 }, { timeout: 5000 }),
    ).toBeInTheDocument();
    expect(getFrozenPresetCatalog()[0]?.name).toBe('Food');
  });

  it('saves a previewed preset as a user wheel', async () => {
    const user = userEvent.setup();
    renderApp({ initialEntries: [ROUTES.presets] });

    await user.click(screen.getByRole('button', { name: 'Preview Team' }));
    await user.click(screen.getByRole('button', { name: 'Save Team as my wheel' }));

    expect(useWheelStore.getState().wheels[0]?.name).toBe('Team');
    expect(useWheelStore.getState().wheels[0]?.items.map((item) => item.name)).toEqual([
      'Alex Rivera',
      'Jordan Lee',
      'Sam Okonkwo',
      'Taylor Chen',
    ]);
    expect(await screen.findByRole('heading', { name: 'Dashboard', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Team', level: 3 })).toBeInTheDocument();
  });
});
