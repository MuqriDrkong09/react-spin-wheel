import { ROUTES } from '@/constants/routes';
import { CREATE_WHEEL_MESSAGES } from '@/features/create-wheel/constants';
import { loadPersistedState } from '@/services/storage/persistedState';
import { storageService } from '@/services/storage/storageService';
import { resetWheelStore, useWheelStore } from '@/stores/wheelStore';
import { renderApp, screen, userEvent } from '@/test/test-utils';

describe('CreateWheelScreen', () => {
  beforeEach(() => {
    window.localStorage.clear();
    storageService.clearMemory();
    resetWheelStore();
  });

  it('shows validation errors for an empty submission', async () => {
    const user = userEvent.setup();
    renderApp({ initialEntries: [ROUTES.createWheel] });

    await user.click(screen.getByRole('button', { name: 'Create wheel' }));

    expect(await screen.findByText(CREATE_WHEEL_MESSAGES.nameRequired)).toBeInTheDocument();
    expect(screen.getByText(CREATE_WHEEL_MESSAGES.optionRequired)).toBeInTheDocument();
    expect(useWheelStore.getState().wheels).toHaveLength(0);
  });

  it('shows a minimum length error for a short wheel name', async () => {
    const user = userEvent.setup();
    renderApp({ initialEntries: [ROUTES.createWheel] });

    await user.type(screen.getByLabelText(/wheel name/i), 'A');
    await user.type(screen.getByRole('textbox', { name: /option 1/i }), 'Pepperoni');
    await user.click(screen.getByRole('button', { name: 'Create wheel' }));

    expect(await screen.findByText(CREATE_WHEEL_MESSAGES.nameMin)).toBeInTheDocument();
  });

  it('creates, persists, and opens the editor after a valid submission', async () => {
    const user = userEvent.setup();
    renderApp({ initialEntries: [ROUTES.createWheel] });

    await user.type(screen.getByLabelText(/wheel name/i), 'Pizza Night');
    await user.type(screen.getByLabelText(/description/i), 'Weekend dinner');
    await user.click(screen.getByLabelText(/category/i));
    await user.click(await screen.findByRole('option', { name: 'Food' }));
    await user.click(screen.getByLabelText(/icon/i));
    await user.click(await screen.findByRole('option', { name: /food/i }));
    await user.type(screen.getByRole('textbox', { name: /option 1/i }), 'Pepperoni');
    await user.click(screen.getByRole('button', { name: 'Add option' }));
    await user.type(screen.getByRole('textbox', { name: /option 2/i }), 'Margherita');
    await user.click(screen.getByRole('button', { name: 'Create wheel' }));

    const created = useWheelStore.getState().wheels[0];
    expect(created?.name).toBe('Pizza Night');
    expect(created?.description).toBe('Weekend dinner');
    expect(created?.category).toBe('Food');
    expect(created?.icon).toBe('🍕');
    expect(created?.items.map((item) => item.name)).toEqual(['Pepperoni', 'Margherita']);
    expect(useWheelStore.getState().activeWheelId).toBe(created?.id);
    expect(loadPersistedState().wheels[0]?.name).toBe('Pizza Night');
    expect(
      await screen.findByRole('heading', { name: 'Wheel editor', level: 1 }, { timeout: 5000 }),
    ).toBeInTheDocument();
  });

  it('allows optional description, category, and icon', async () => {
    const user = userEvent.setup();
    renderApp({ initialEntries: [ROUTES.createWheel] });

    await user.type(screen.getByLabelText(/wheel name/i), 'Quick Pick');
    await user.type(screen.getByRole('textbox', { name: /option 1/i }), 'Yes');
    await user.click(screen.getByRole('button', { name: 'Create wheel' }));

    const created = useWheelStore.getState().wheels[0];
    expect(created?.name).toBe('Quick Pick');
    expect(created?.description).toBeUndefined();
    expect(created?.category).toBeUndefined();
    expect(created?.icon).toBeUndefined();
    expect(created?.items).toHaveLength(1);
    expect(
      await screen.findByRole('heading', { name: 'Wheel editor', level: 1 }, { timeout: 5000 }),
    ).toBeInTheDocument();
  });
});
