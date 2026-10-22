import { ROUTES, withWheelId } from '@/constants/routes';
import { EDITOR_MESSAGES } from '@/features/wheel-editor/constants';
import { resetSettingsStore, useSettingsStore } from '@/stores/settingsStore';
import { resetWheelStore, useWheelStore } from '@/stores/wheelStore';
import { renderApp, screen, userEvent, within } from '@/test/test-utils';

function seedFoodWheel() {
  const store = useWheelStore.getState();

  store.createWheel({
    id: 'food',
    name: 'Food Wheel',
    icon: '📁',
    category: 'Food',
    items: [
      { id: 'pizza', name: 'Pizza', icon: '🍕', color: '#ea580c', enabled: true, weight: 1 },
      { id: 'burger', name: 'Burger', icon: '🍔', color: '#ca8a04', enabled: true, weight: 1 },
      { id: 'sushi', name: 'Sushi', icon: '🍣', color: '#0f766e', enabled: true, weight: 1 },
    ],
  });
  store.addChildItem('pizza', {
    id: 'chicken',
    name: 'Chicken Pepperoni',
    icon: '🍗',
    color: '#ca8a04',
    enabled: true,
    weight: 1,
  });
  store.addChildItem('pizza', {
    id: 'beef',
    name: 'Beef Pepperoni',
    icon: '🥩',
    color: '#dc2626',
    enabled: true,
    weight: 1,
  });
  store.addChildItem('burger', {
    id: 'chicken-burger',
    name: 'Chicken Burger',
    color: '#ca8a04',
    enabled: true,
    weight: 1,
  });
  store.addChildItem('burger', {
    id: 'beef-burger',
    name: 'Beef Burger',
    color: '#dc2626',
    enabled: true,
    weight: 1,
  });
  store.setActiveWheel('food');
}

function renderEditor() {
  return renderApp({ initialEntries: [withWheelId(ROUTES.wheelEditor, 'food')] });
}

describe('WheelEditorScreen', () => {
  beforeEach(() => {
    resetWheelStore();
    resetSettingsStore();
  });

  it('shows an empty state when no wheel is selected', () => {
    renderApp({ initialEntries: [ROUTES.wheelEditor] });

    expect(screen.getByRole('heading', { name: 'Wheel editor', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: EDITOR_MESSAGES.noWheelTitle })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create a wheel' })).toBeInTheDocument();
  });

  it('renders hierarchical items with one recursive tree', () => {
    seedFoodWheel();
    renderEditor();

    expect(screen.getByRole('heading', { name: '📁 Food Wheel', level: 2 })).toBeInTheDocument();
    expect(screen.getByText('🍕 Pizza')).toBeInTheDocument();
    expect(screen.getByText('🍗 Chicken Pepperoni')).toBeInTheDocument();
    expect(screen.getByText('🥩 Beef Pepperoni')).toBeInTheDocument();
    expect(screen.getByText('🍔 Burger')).toBeInTheDocument();
    expect(screen.getByText('Chicken Burger')).toBeInTheDocument();
    expect(screen.getByText('🍣 Sushi')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Collapse Pizza' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Expand Sushi' })).toBeInTheDocument();
    expect(screen.queryByText(EDITOR_MESSAGES.emptyChildren('Sushi'))).not.toBeInTheDocument();
  });

  it('collapses and expands nested children', async () => {
    const user = userEvent.setup();
    seedFoodWheel();
    renderEditor();

    await user.click(screen.getByRole('button', { name: 'Collapse Pizza' }));

    expect(screen.queryByText('🍗 Chicken Pepperoni')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Expand Pizza' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Expand Pizza' }));

    expect(screen.getByText('🍗 Chicken Pepperoni')).toBeInTheDocument();
  });

  it('shows an empty child state for a leaf that can still nest', async () => {
    const user = userEvent.setup();
    seedFoodWheel();
    renderEditor();

    await user.click(screen.getByRole('button', { name: 'Expand Sushi' }));

    expect(screen.getByText(EDITOR_MESSAGES.emptyChildren('Sushi'))).toBeInTheDocument();
    expect(
      within(screen.getByRole('group', { name: 'Children of Sushi' })).getByRole('button', {
        name: 'Add child',
      }),
    ).toBeInTheDocument();
  });

  it('adds a nested child through the item form', async () => {
    const user = userEvent.setup();
    seedFoodWheel();
    renderEditor();

    await user.click(screen.getByRole('button', { name: 'Add child to Sushi' }));
    await user.type(screen.getByLabelText(/name/i), 'Salmon');
    await user.click(screen.getByRole('button', { name: 'Add item' }));

    expect(await screen.findByText('Salmon')).toBeInTheDocument();
    expect(useWheelStore.getState().getWheel('food')?.items.find((item) => item.id === 'sushi')?.children).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'Salmon' })]),
    );
  });

  it('edits an item in place', async () => {
    const user = userEvent.setup();
    seedFoodWheel();
    renderEditor();

    await user.click(screen.getByRole('button', { name: 'Edit Pizza' }));
    const nameField = screen.getByLabelText(/name/i);
    await user.clear(nameField);
    await user.type(nameField, 'Deep Dish');
    await user.click(screen.getByRole('button', { name: 'Save item' }));

    expect(await screen.findByText('🍕 Deep Dish')).toBeInTheDocument();
    expect(screen.queryByText('🍕 Pizza')).not.toBeInTheDocument();
  });

  it('duplicates, disables, and deletes an item with confirmation', async () => {
    const user = userEvent.setup();
    seedFoodWheel();
    renderEditor();

    await user.click(screen.getByRole('button', { name: 'Duplicate Sushi' }));
    expect(await screen.findByText('🍣 Sushi copy')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Disable Sushi copy' }));
    expect(screen.getByRole('button', { name: 'Enable Sushi copy' })).toBeInTheDocument();
    expect(screen.getByText('Disabled')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Delete Sushi copy' }));
    expect(screen.getByRole('dialog', { name: 'Delete item' })).toBeInTheDocument();
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));

    expect(screen.queryByText('🍣 Sushi copy')).not.toBeInTheDocument();
  });

  it('warns that nested children are deleted with their parent', async () => {
    const user = userEvent.setup();
    seedFoodWheel();
    renderEditor();

    await user.click(screen.getByRole('button', { name: 'Delete Pizza' }));

    expect(screen.getByText(EDITOR_MESSAGES.deleteItemWithChildren('Pizza', 2))).toBeInTheDocument();
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));

    expect(screen.queryByText('🍕 Pizza')).not.toBeInTheDocument();
    expect(screen.queryByText('🍗 Chicken Pepperoni')).not.toBeInTheDocument();
  });

  it('adds a child two levels deep without duplicating tree rendering', async () => {
    const user = userEvent.setup();
    seedFoodWheel();
    renderEditor();

    await user.click(screen.getByRole('button', { name: 'Add child to Chicken Pepperoni' }));
    await user.type(screen.getByLabelText(/name/i), 'Extra spicy');
    await user.click(screen.getByRole('button', { name: 'Add item' }));

    expect(await screen.findByText('Extra spicy')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add child to Extra spicy' })).toBeInTheDocument();
  });

  it('skips the delete dialog when confirmation is disabled', async () => {
    const user = userEvent.setup();
    useSettingsStore.getState().updateSettings({ confirmBeforeDelete: false });
    seedFoodWheel();
    renderEditor();

    await user.click(screen.getByRole('button', { name: 'Delete Sushi' }));

    expect(screen.queryByRole('dialog', { name: 'Delete item' })).not.toBeInTheDocument();
    expect(screen.queryByText('🍣 Sushi')).not.toBeInTheDocument();
  });
});
