import { ROUTES, withWheelId } from '@/constants/routes';
import { SPIN_MESSAGES } from '@/features/spin/constants';
import { resetHistoryStore, useHistoryStore } from '@/stores/historyStore';
import { resetWheelStore, useWheelStore } from '@/stores/wheelStore';
import { renderApp, screen, userEvent, waitFor, within } from '@/test/test-utils';
import { SELECTION_MODE } from '@/types/wheel';

function seedFoodWheel() {
  useWheelStore.getState().createWheel({
    id: 'food',
    name: 'Food Wheel',
    icon: '📁',
    settings: { durationMs: 60_000, minRotations: 4, maxRotations: 4 },
    items: [
      {
        id: 'pizza',
        name: 'Pizza',
        icon: '🍕',
        color: '#ea580c',
        enabled: true,
        weight: 1,
        children: [
          { id: 'pepperoni', name: 'Pepperoni', color: '#dc2626', enabled: true, weight: 1 },
          { id: 'mushroom', name: 'Mushroom', color: '#ca8a04', enabled: true, weight: 1 },
        ],
      },
      { id: 'burger', name: 'Burger', icon: '🍔', color: '#ca8a04', enabled: true, weight: 2 },
      { id: 'sushi', name: 'Sushi', icon: '🍣', color: '#0f766e', enabled: true, weight: 1 },
      { id: 'salad', name: 'Salad', icon: '🥗', color: '#16a34a', enabled: false, weight: 1 },
    ],
  });
  useWheelStore.getState().setActiveWheel('food');
}

function stubReducedMotion(matches: boolean) {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: query.includes('prefers-reduced-motion') ? matches : false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  });
}

describe('SpinScreen', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    resetWheelStore();
    resetHistoryStore();
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    vi.restoreAllMocks();
  });

  it('shows an empty state when no wheel is selected', () => {
    renderApp({ initialEntries: [ROUTES.spin] });

    expect(screen.getByRole('heading', { name: 'Spin', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: SPIN_MESSAGES.noWheelTitle })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create a wheel' })).toBeInTheDocument();
  });

  it('asks which wheel to spin when opened without a wheel id', () => {
    seedFoodWheel();
    useWheelStore.getState().createWheel({ id: 'games', name: 'Games Wheel', category: 'Games' });
    renderApp({ initialEntries: [ROUTES.spin] });

    expect(screen.getByText(SPIN_MESSAGES.chooseWheelDescription)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: SPIN_MESSAGES.chooseWheelAction('Food Wheel') })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: SPIN_MESSAGES.chooseWheelAction('Games Wheel') })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: SPIN_MESSAGES.spinButton })).not.toBeInTheDocument();
  });

  it('opens the chosen wheel from the picker instead of the active wheel', async () => {
    const user = userEvent.setup();
    seedFoodWheel();
    useWheelStore.getState().createWheel({
      id: 'games',
      name: 'Games Wheel',
      items: [{ id: 'chess', name: 'Chess', color: '#2563eb', enabled: true, weight: 1 }],
    });
    useWheelStore.getState().setActiveWheel('food');
    renderApp({ initialEntries: [ROUTES.spin] });

    await user.click(screen.getByRole('button', { name: SPIN_MESSAGES.chooseWheelAction('Games Wheel') }));

    expect(screen.getByText('Spin Games Wheel.')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /spin wheel with chess/i })).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /pizza, burger, sushi/i })).not.toBeInTheDocument();
  });

  it('returns to the wheel picker from an open spin', async () => {
    const user = userEvent.setup();
    seedFoodWheel();
    renderApp({ initialEntries: [withWheelId(ROUTES.spin, 'food')] });

    await user.click(screen.getByRole('button', { name: SPIN_MESSAGES.changeWheel }));

    expect(screen.getByText(SPIN_MESSAGES.chooseWheelDescription)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: SPIN_MESSAGES.chooseWheelAction('Food Wheel') })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: SPIN_MESSAGES.spinButton })).not.toBeInTheDocument();
  });

  it('shows the picker from the sidebar even when a wheel is already active', async () => {
    const user = userEvent.setup();
    seedFoodWheel();
    renderApp({ initialEntries: [ROUTES.dashboard] });

    await user.click(screen.getByRole('button', { name: 'Spin' }));

    expect(screen.getByText(SPIN_MESSAGES.chooseWheelDescription)).toBeInTheDocument();
    expect(screen.queryByText('Spin Food Wheel.')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: SPIN_MESSAGES.spinButton })).not.toBeInTheDocument();
  });

  it('renders the visual wheel for a requested wheel', () => {
    seedFoodWheel();
    renderApp({ initialEntries: [withWheelId(ROUTES.spin, 'food')] });

    expect(screen.getByText('Spin Food Wheel.')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /spin wheel with pizza, burger, sushi/i })).toBeInTheDocument();
    expect(screen.getByTitle('🍕 Pizza')).toBeInTheDocument();
    expect(screen.getByTitle('🍔 Burger')).toBeInTheDocument();
    expect(screen.queryByTitle(/salad/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: SPIN_MESSAGES.spinButton })).toBeInTheDocument();
    expect(screen.getByTitle(SPIN_MESSAGES.pointerTitle)).toBeInTheDocument();
  });

  it('disables spin and stays spinning until the animation completes', async () => {
    const user = userEvent.setup();
    const random = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    seedFoodWheel();
    renderApp({ initialEntries: [withWheelId(ROUTES.spin, 'food')] });

    const button = screen.getByRole('button', { name: SPIN_MESSAGES.spinButton });
    await user.click(button);

    expect(button).toBeDisabled();
    expect(screen.getByText(SPIN_MESSAGES.spinning)).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: SPIN_MESSAGES.winnerTitle })).not.toBeInTheDocument();
    expect(random).toHaveBeenCalledTimes(1);
  });

  it('lands on a winner immediately when reduced motion is preferred', async () => {
    stubReducedMotion(true);
    const user = userEvent.setup();
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    seedFoodWheel();
    renderApp({ initialEntries: [withWheelId(ROUTES.spin, 'food')] });

    await user.click(screen.getByRole('button', { name: SPIN_MESSAGES.spinButton }));

    const dialog = screen.getByRole('dialog', { name: SPIN_MESSAGES.winnerTitle });
    expect(within(dialog).getByText('Burger')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: SPIN_MESSAGES.spinAgain })).toHaveFocus();
    expect(within(dialog).getByRole('button', { name: SPIN_MESSAGES.finish })).toBeInTheDocument();
    expect(within(dialog).queryByText(SPIN_MESSAGES.additionalData)).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: SPIN_MESSAGES.spinAgain }));
    expect(screen.getByRole('dialog', { name: SPIN_MESSAGES.winnerTitle })).toBeInTheDocument();
    expect(within(screen.getByRole('dialog')).getByText('Burger')).toBeInTheDocument();
  });

  it('shows the final result when Finish is chosen', async () => {
    stubReducedMotion(true);
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    seedFoodWheel();
    renderApp({ initialEntries: [withWheelId(ROUTES.spin, 'food')] });

    await user.click(screen.getByRole('button', { name: SPIN_MESSAGES.spinButton }));
    await user.click(screen.getByRole('button', { name: SPIN_MESSAGES.finish }));

    const result = screen.getByRole('region', { name: SPIN_MESSAGES.finalResultTitle });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(within(result).getByText('Food Wheel')).toBeInTheDocument();
    expect(within(result).getByText('Burger')).toBeInTheDocument();
    expect(within(result).getByText('🍔')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: SPIN_MESSAGES.finalResultTitle })).toHaveFocus();

    await user.click(screen.getByRole('button', { name: SPIN_MESSAGES.copyResult }));
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0]?.[0]).toContain('🎉 Final result');
    expect(writeText.mock.calls[0]?.[0]).toContain('Food Wheel');
    expect(writeText.mock.calls[0]?.[0]).toContain('🍔 Burger');

    expect(useHistoryStore.getState().spinHistory).toHaveLength(1);
    expect(useHistoryStore.getState().spinHistory[0]?.wheelName).toBe('Food Wheel');
    expect(useHistoryStore.getState().spinHistory[0]?.results[0]?.selectedItemName).toBe('Burger');
    expect(useHistoryStore.getState().spinHistory[0]?.results[0]?.pathLabels).toEqual(['Burger']);
    expect(screen.getByRole('button', { name: SPIN_MESSAGES.resultSaved })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: SPIN_MESSAGES.spinAgain }));
    expect(screen.queryByRole('region', { name: SPIN_MESSAGES.finalResultTitle })).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const spinButton = screen.getByRole('button', { name: SPIN_MESSAGES.spinButton });
    expect(spinButton).toBeEnabled();

    await user.click(spinButton);
    expect(screen.getByRole('dialog', { name: SPIN_MESSAGES.winnerTitle })).toBeInTheDocument();
  });

  it('automatically spins again from the final result when selection mode is automatic', async () => {
    stubReducedMotion(true);
    const user = userEvent.setup();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    seedFoodWheel();
    useWheelStore.getState().updateWheelSettings('food', { selectionMode: SELECTION_MODE.automatic });
    renderApp({ initialEntries: [withWheelId(ROUTES.spin, 'food')] });

    await user.click(screen.getByRole('button', { name: SPIN_MESSAGES.spinButton }));
    await user.click(screen.getByRole('button', { name: SPIN_MESSAGES.finish }));
    await user.click(screen.getByRole('button', { name: SPIN_MESSAGES.spinAgain }));

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: SPIN_MESSAGES.winnerTitle })).toBeInTheDocument();
    });
  });

  it('returns to the picker-level wheel after Start New Selection', async () => {
    stubReducedMotion(true);
    const user = userEvent.setup();
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    seedFoodWheel();
    renderApp({ initialEntries: [withWheelId(ROUTES.spin, 'food')] });

    await user.click(screen.getByRole('button', { name: SPIN_MESSAGES.spinButton }));
    await user.click(screen.getByRole('button', { name: SPIN_MESSAGES.finish }));
    await user.click(screen.getByRole('button', { name: SPIN_MESSAGES.startNewSelection }));

    expect(screen.getByRole('button', { name: SPIN_MESSAGES.spinButton })).toBeEnabled();
    expect(screen.queryByRole('region', { name: SPIN_MESSAGES.finalResultTitle })).not.toBeInTheDocument();
  });

  it('keeps the wheel open when Close is chosen for a winner with children', async () => {
    stubReducedMotion(true);
    const user = userEvent.setup();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    seedFoodWheel();
    renderApp({ initialEntries: [withWheelId(ROUTES.spin, 'food')] });

    await user.click(screen.getByRole('button', { name: SPIN_MESSAGES.spinButton }));

    const dialog = screen.getByRole('dialog', { name: SPIN_MESSAGES.winnerTitle });
    expect(within(dialog).getByText('Pizza')).toBeInTheDocument();
    expect(within(dialog).getByText(SPIN_MESSAGES.additionalData)).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: SPIN_MESSAGES.spinChild })).toHaveFocus();

    await user.click(within(dialog).getByRole('button', { name: SPIN_MESSAGES.close }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Spin Food Wheel.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: SPIN_MESSAGES.spinButton })).toBeInTheDocument();
  });

  it('opens a child-only wheel without changing parent data', async () => {
    stubReducedMotion(true);
    const user = userEvent.setup();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    seedFoodWheel();
    const parentItems = structuredClone(useWheelStore.getState().getWheel('food')?.items);
    renderApp({ initialEntries: [withWheelId(ROUTES.spin, 'food')] });

    await user.click(screen.getByRole('button', { name: SPIN_MESSAGES.spinButton }));
    await user.click(screen.getByRole('button', { name: SPIN_MESSAGES.spinChild }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText(SPIN_MESSAGES.spinning)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: SPIN_MESSAGES.spinButton })).toBeEnabled();
    expect(screen.getByText(SPIN_MESSAGES.childWheelOf('Pizza'))).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /spin wheel with pepperoni, mushroom/i })).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /pizza, burger, sushi/i })).not.toBeInTheDocument();
    expect(useWheelStore.getState().getWheel('food')?.items).toEqual(parentItems);
  });

  it('asks before continuing when selection mode is ask', async () => {
    stubReducedMotion(true);
    const user = userEvent.setup();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    seedFoodWheel();
    useWheelStore.getState().updateWheelSettings('food', { selectionMode: SELECTION_MODE.ask });
    renderApp({ initialEntries: [withWheelId(ROUTES.spin, 'food')] });

    await user.click(screen.getByRole('button', { name: SPIN_MESSAGES.spinButton }));

    const dialog = screen.getByRole('dialog', { name: SPIN_MESSAGES.winnerTitle });
    expect(within(dialog).getByText(SPIN_MESSAGES.continuePrompt)).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: SPIN_MESSAGES.continueSelection })).toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: SPIN_MESSAGES.spinChild })).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: SPIN_MESSAGES.continueSelection }));
    expect(screen.getByText(SPIN_MESSAGES.childWheelOf('Pizza'))).toBeInTheDocument();
    expect(screen.getByRole('button', { name: SPIN_MESSAGES.spinButton })).toBeEnabled();
  });

  it('automatically starts the child spin when selection mode is automatic', async () => {
    stubReducedMotion(true);
    const user = userEvent.setup();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    seedFoodWheel();
    useWheelStore.getState().updateWheelSettings('food', { selectionMode: SELECTION_MODE.automatic });
    renderApp({ initialEntries: [withWheelId(ROUTES.spin, 'food')] });

    await user.click(screen.getByRole('button', { name: SPIN_MESSAGES.spinButton }));

    const dialog = await screen.findByRole('dialog', { name: SPIN_MESSAGES.winnerTitle });
    expect(within(dialog).getByText('Pizza')).toBeInTheDocument();
    expect(within(dialog).getByText('Pepperoni')).toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: SPIN_MESSAGES.spinChild })).not.toBeInTheDocument();
    expect(within(dialog).queryByText(SPIN_MESSAGES.continuePrompt)).not.toBeInTheDocument();
  });

  it('persists Remove Winner on the wheel', async () => {
    const user = userEvent.setup();
    seedFoodWheel();
    renderApp({ initialEntries: [withWheelId(ROUTES.spin, 'food')] });

    await user.click(screen.getByRole('switch', { name: SPIN_MESSAGES.removeWinner }));

    expect(useWheelStore.getState().getWheel('food')?.settings.removeWinner).toBe(true);
  });

  it('removes the winner from later spins and restores it on Restore Items', async () => {
    stubReducedMotion(true);
    const user = userEvent.setup();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    seedFoodWheel();
    useWheelStore.getState().updateWheelSettings('food', { removeWinner: true });
    renderApp({ initialEntries: [withWheelId(ROUTES.spin, 'food')] });

    await user.click(screen.getByRole('button', { name: SPIN_MESSAGES.spinButton }));
    await user.keyboard('{Escape}');

    expect(screen.getByRole('img', { name: /spin wheel with burger, sushi/i })).toBeInTheDocument();
    expect(screen.queryByTitle('🍕 Pizza')).not.toBeInTheDocument();
    expect(useWheelStore.getState().getWheel('food')?.items[0]?.name).toBe('Pizza');
    expect(useWheelStore.getState().getWheel('food')?.items[0]?.children).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: SPIN_MESSAGES.restoreItems }));

    expect(screen.getByRole('img', { name: /spin wheel with pizza, burger, sushi/i })).toBeInTheDocument();
    expect(screen.getByTitle('🍕 Pizza')).toBeInTheDocument();
  });

  it('removes only the selected child from its parent siblings', async () => {
    stubReducedMotion(true);
    const user = userEvent.setup();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    seedFoodWheel();
    useWheelStore.getState().updateWheelSettings('food', { removeWinner: true });
    renderApp({ initialEntries: [withWheelId(ROUTES.spin, 'food')] });

    await user.click(screen.getByRole('button', { name: SPIN_MESSAGES.spinButton }));
    await user.click(screen.getByRole('button', { name: SPIN_MESSAGES.spinChild }));
    await user.click(screen.getByRole('button', { name: SPIN_MESSAGES.spinButton }));
    await user.keyboard('{Escape}');

    expect(screen.getByRole('img', { name: /spin wheel with mushroom/i })).toBeInTheDocument();
    expect(screen.queryByTitle('Pepperoni')).not.toBeInTheDocument();
    expect(screen.getByTitle('Mushroom')).toBeInTheDocument();
    expect(
      useWheelStore.getState().getWheel('food')?.items[0]?.children?.map((entry) => entry.name),
    ).toEqual(['Pepperoni', 'Mushroom']);
  });

  it('persists the selected selection mode on the wheel', async () => {
    const user = userEvent.setup();
    seedFoodWheel();
    renderApp({ initialEntries: [withWheelId(ROUTES.spin, 'food')] });

    await user.click(screen.getByRole('combobox', { name: SPIN_MESSAGES.selectionMode }));
    await user.click(screen.getByRole('option', { name: SPIN_MESSAGES.selectionModeAutomatic }));

    expect(useWheelStore.getState().getWheel('food')?.settings.selectionMode).toBe(
      SELECTION_MODE.automatic,
    );
  });

  it('keeps spinning through grandchildren until a leaf is selected', async () => {
    stubReducedMotion(true);
    const user = userEvent.setup();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    useWheelStore.getState().createWheel({
      id: 'pizza-night',
      name: 'Pizza Night',
      settings: { durationMs: 60_000, minRotations: 4, maxRotations: 4 },
      items: [
        {
          id: 'pizza',
          name: 'Pizza',
          color: '#ea580c',
          enabled: true,
          weight: 1,
          children: [
            {
              id: 'chicken-pepperoni',
              name: 'Chicken Pepperoni',
              color: '#dc2626',
              enabled: true,
              weight: 1,
              children: [
                {
                  id: 'large',
                  name: 'Large',
                  color: '#a855f7',
                  enabled: true,
                  weight: 1,
                  children: [
                    { id: 'thin-crust', name: 'Thin Crust', color: '#6366f1', enabled: true, weight: 1 },
                    { id: 'thick-crust', name: 'Thick Crust', color: '#8b5cf6', enabled: true, weight: 1 },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
    const parentItems = structuredClone(useWheelStore.getState().getWheel('pizza-night')?.items);
    renderApp({ initialEntries: [withWheelId(ROUTES.spin, 'pizza-night')] });

    await user.click(screen.getByRole('button', { name: SPIN_MESSAGES.spinButton }));
    await user.click(screen.getByRole('button', { name: SPIN_MESSAGES.spinChild }));
    await user.click(screen.getByRole('button', { name: SPIN_MESSAGES.spinButton }));
    await user.click(screen.getByRole('button', { name: SPIN_MESSAGES.spinChild }));
    await user.click(screen.getByRole('button', { name: SPIN_MESSAGES.spinButton }));
    await user.click(screen.getByRole('button', { name: SPIN_MESSAGES.spinChild }));
    await user.click(screen.getByRole('button', { name: SPIN_MESSAGES.spinButton }));

    const dialog = screen.getByRole('dialog', { name: SPIN_MESSAGES.winnerTitle });
    expect(within(dialog).getByText('Pizza')).toBeInTheDocument();
    expect(within(dialog).getByText('Chicken Pepperoni')).toBeInTheDocument();
    expect(within(dialog).getByText('Large')).toBeInTheDocument();
    expect(within(dialog).getByText('Thin Crust')).toBeInTheDocument();
    expect(dialog).toHaveAccessibleDescription(/Pizza.*Chicken Pepperoni.*Large.*Thin Crust/s);
    expect(within(dialog).getByRole('button', { name: SPIN_MESSAGES.finish })).toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: SPIN_MESSAGES.spinChild })).not.toBeInTheDocument();
    expect(useWheelStore.getState().getWheel('pizza-night')?.items).toEqual(parentItems);
  });

  it('keeps the selection path after a child winner is chosen', async () => {
    stubReducedMotion(true);
    const user = userEvent.setup();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    seedFoodWheel();
    renderApp({ initialEntries: [withWheelId(ROUTES.spin, 'food')] });

    await user.click(screen.getByRole('button', { name: SPIN_MESSAGES.spinButton }));
    await user.click(screen.getByRole('button', { name: SPIN_MESSAGES.spinChild }));
    await user.click(screen.getByRole('button', { name: SPIN_MESSAGES.spinButton }));

    const dialog = screen.getByRole('dialog', { name: SPIN_MESSAGES.winnerTitle });
    expect(within(dialog).getByText('Pizza')).toBeInTheDocument();
    expect(within(dialog).getByText('Pepperoni')).toBeInTheDocument();
    expect(dialog).toHaveAccessibleDescription(/Pizza.*Pepperoni/s);
    expect(within(dialog).getByRole('button', { name: SPIN_MESSAGES.spinAgain })).toBeInTheDocument();
  });

  it('closes the winner dialog with Escape and restores the spin button', async () => {
    stubReducedMotion(true);
    const user = userEvent.setup();
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    seedFoodWheel();
    renderApp({ initialEntries: [withWheelId(ROUTES.spin, 'food')] });

    await user.click(screen.getByRole('button', { name: SPIN_MESSAGES.spinButton }));
    expect(screen.getByRole('dialog', { name: SPIN_MESSAGES.winnerTitle })).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: SPIN_MESSAGES.spinButton })).toHaveFocus();
  });

  it('handles a wheel with a single active item', () => {
    useWheelStore.getState().createWheel({
      id: 'solo',
      name: 'Solo',
      items: [{ id: 'yes', name: 'Yes', color: '#16a34a', enabled: true, weight: 1 }],
    });

    renderApp({ initialEntries: [withWheelId(ROUTES.spin, 'solo')] });

    expect(screen.getByRole('img', { name: /spin wheel with yes/i })).toBeInTheDocument();
    expect(screen.getByTitle('Yes')).toBeInTheDocument();
  });
});
