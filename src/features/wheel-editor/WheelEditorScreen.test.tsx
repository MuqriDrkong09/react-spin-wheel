import { ROUTES, withWheelId } from '@/constants/routes';
import { EDITOR_MESSAGES } from '@/features/wheel-editor/constants';
import { loadPersistedState } from '@/services/storage/persistedState';
import { storageService } from '@/services/storage/storageService';
import { resetSettingsStore } from '@/stores/settingsStore';
import { resetWheelStore, useWheelStore } from '@/stores/wheelStore';
import { renderApp, screen, userEvent, within } from '@/test/test-utils';
import { findItem } from '@/utils/wheelTree';

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

function foodItem(id: string) {
  return findItem(useWheelStore.getState().getWheel('food')?.items ?? [], id);
}

async function saveEditedName(user: ReturnType<typeof userEvent.setup>, itemName: string, nextName: string) {
  await user.click(screen.getByRole('button', { name: `Edit ${itemName}` }));
  const dialog = screen.getByRole('dialog', { name: `Edit ${itemName}` });
  const nameField = within(dialog).getByLabelText(/^name/i);
  expect(nameField).toHaveValue(itemName);
  await user.clear(nameField);
  await user.type(nameField, nextName);
  await user.click(within(dialog).getByRole('button', { name: 'Save item' }));
}

function deleteDialog() {
  return screen.getByRole('dialog', { name: 'Delete item' });
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
    expect(screen.getByRole('button', { name: 'Reorder Pizza' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reorder Chicken Pepperoni' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reorder Food Wheel' })).not.toBeInTheDocument();
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
        name: 'Add child to Sushi',
      }),
    ).toBeInTheDocument();
  });

  it('adds child data under the selected parent', async () => {
    const user = userEvent.setup();
    seedFoodWheel();
    renderEditor();

    await user.click(screen.getByRole('button', { name: 'Add child to Sushi' }));
    const dialog = screen.getByRole('dialog', { name: 'Add Child Data' });
    expect(within(dialog).getByText('Parent')).toBeInTheDocument();
    expect(within(dialog).getByText('Sushi')).toBeInTheDocument();
    await user.type(within(dialog).getByLabelText(/child name/i), 'Salmon');
    await user.click(within(dialog).getByRole('button', { name: 'Add Child' }));

    expect(await screen.findByText('Salmon')).toBeInTheDocument();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      EDITOR_MESSAGES.childAdded('Salmon', 'Sushi'),
    );
    expect(useWheelStore.getState().getWheel('food')?.items.find((item) => item.id === 'sushi')?.children).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'Salmon' })]),
    );
  });

  it('stores a child under the parent children array at any nesting level', async () => {
    const user = userEvent.setup();
    seedFoodWheel();
    renderEditor();

    await user.click(screen.getByRole('button', { name: 'Add child to Pizza' }));
    let dialog = screen.getByRole('dialog', { name: 'Add Child Data' });
    expect(within(dialog).getByText('Pizza')).toBeInTheDocument();
    await user.type(within(dialog).getByLabelText(/child name/i), 'Hawaiian');
    await user.click(within(dialog).getByRole('button', { name: 'Add Child' }));

    expect(await screen.findByText('Hawaiian')).toBeInTheDocument();
    const pizza = useWheelStore.getState().getWheel('food')?.items.find((item) => item.id === 'pizza');
    expect(pizza?.children?.map((item) => item.name)).toEqual(
      expect.arrayContaining(['Chicken Pepperoni', 'Beef Pepperoni', 'Hawaiian']),
    );

    await user.click(screen.getByRole('button', { name: 'Add child to Chicken Pepperoni' }));
    dialog = screen.getByRole('dialog', { name: 'Add Child Data' });
    expect(within(dialog).getByText('Chicken Pepperoni')).toBeInTheDocument();
    await user.type(within(dialog).getByLabelText(/child name/i), 'Large');
    await user.click(within(dialog).getByRole('button', { name: 'Add Child' }));

    expect(await screen.findByText('Large')).toBeInTheDocument();
    const chicken = useWheelStore
      .getState()
      .getWheel('food')
      ?.items.find((item) => item.id === 'pizza')
      ?.children?.find((item) => item.id === 'chicken');
    expect(chicken?.children).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Large' })]));
  });

  it('prevents adding child data without a name', async () => {
    const user = userEvent.setup();
    seedFoodWheel();
    renderEditor();

    await user.click(screen.getByRole('button', { name: 'Add child to Pizza' }));
    const dialog = screen.getByRole('dialog', { name: 'Add Child Data' });
    await user.click(within(dialog).getByRole('button', { name: 'Add Child' }));

    expect(await within(dialog).findByText(EDITOR_MESSAGES.childNameRequired)).toBeInTheDocument();
    expect(
      useWheelStore.getState().getWheel('food')?.items.find((item) => item.id === 'pizza')?.children,
    ).toHaveLength(2);
  });

  it('edits a root item from the same form and preserves its children', async () => {
    const user = userEvent.setup();
    seedFoodWheel();
    const before = foodItem('pizza');
    renderEditor();

    await user.click(screen.getByRole('button', { name: 'Edit Pizza' }));
    const dialog = screen.getByRole('dialog', { name: 'Edit Pizza' });
    expect(within(dialog).getByLabelText(/^name/i)).toHaveValue('Pizza');
    expect(within(dialog).getByLabelText(/^description/i)).toHaveValue('');
    expect(within(dialog).getByLabelText(/^icon/i)).toHaveValue('🍕');
    expect(within(dialog).getByRole('spinbutton', { name: /weight/i })).toHaveValue(1);
    expect(within(dialog).getByRole('switch', { name: 'Enabled' })).toBeChecked();

    const nameField = within(dialog).getByLabelText(/^name/i);
    await user.clear(nameField);
    await user.type(nameField, 'Deep Dish');
    await user.type(within(dialog).getByLabelText(/^description/i), 'Oven baked');
    await user.click(within(dialog).getByRole('button', { name: 'Save item' }));

    expect(await screen.findByText('🍕 Deep Dish')).toBeInTheDocument();
    expect(await screen.findByRole('alert')).toHaveTextContent(EDITOR_MESSAGES.itemUpdated('Deep Dish'));
    expect(screen.queryByText('🍕 Pizza')).not.toBeInTheDocument();
    expect(screen.getByText('🍗 Chicken Pepperoni')).toBeInTheDocument();
    expect(screen.getByText('🥩 Beef Pepperoni')).toBeInTheDocument();

    const pizza = foodItem('pizza');
    expect(pizza?.name).toBe('Deep Dish');
    expect(pizza?.description).toBe('Oven baked');
    expect(pizza?.createdAt).toBe(before?.createdAt);
    expect(pizza?.updatedAt).not.toBe(before?.updatedAt);
    expect(pizza?.children?.map((item) => item.id)).toEqual(['chicken', 'beef']);
    expect(foodItem('burger')?.name).toBe('Burger');
  });

  it('edits a child item without changing its siblings', async () => {
    const user = userEvent.setup();
    seedFoodWheel();
    const before = foodItem('chicken');
    const beefBefore = foodItem('beef');
    renderEditor();

    await saveEditedName(user, 'Chicken Pepperoni', 'Chicken Deluxe');

    expect(await screen.findByText('🍗 Chicken Deluxe')).toBeInTheDocument();
    expect(screen.getByText('🍕 Pizza')).toBeInTheDocument();
    expect(screen.getByText('🥩 Beef Pepperoni')).toBeInTheDocument();

    const chicken = foodItem('chicken');
    expect(chicken?.name).toBe('Chicken Deluxe');
    expect(chicken?.createdAt).toBe(before?.createdAt);
    expect(chicken?.updatedAt).not.toBe(before?.updatedAt);
    expect(foodItem('beef')).toEqual(beefBefore);
    expect(foodItem('pizza')?.name).toBe('Pizza');
  });

  it('edits a deeply nested item without changing ancestors or siblings', async () => {
    const user = userEvent.setup();
    seedFoodWheel();
    useWheelStore.getState().addChildItem('chicken', {
      id: 'large',
      name: 'Large',
      color: '#16a34a',
      enabled: true,
      weight: 2,
    });
    useWheelStore.getState().addChildItem('chicken', {
      id: 'small',
      name: 'Small',
      color: '#2563eb',
      enabled: true,
      weight: 1,
    });
    const before = foodItem('large');
    const smallBefore = foodItem('small');
    const chickenBefore = foodItem('chicken');
    const pizzaBefore = foodItem('pizza');
    renderEditor();

    await user.click(screen.getByRole('button', { name: 'Edit Large' }));
    const dialog = screen.getByRole('dialog', { name: 'Edit Large' });
    expect(within(dialog).getByLabelText(/^name/i)).toHaveValue('Large');
    expect(within(dialog).getByRole('spinbutton', { name: /weight/i })).toHaveValue(2);
    const nameField = within(dialog).getByLabelText(/^name/i);
    await user.clear(nameField);
    await user.type(nameField, 'Extra Large');
    await user.click(within(dialog).getByRole('button', { name: 'Save item' }));

    expect(await screen.findByText('Extra Large')).toBeInTheDocument();
    expect(screen.getByText('Small')).toBeInTheDocument();
    expect(screen.getByText('🍗 Chicken Pepperoni')).toBeInTheDocument();
    expect(screen.getByText('🍕 Pizza')).toBeInTheDocument();

    const large = foodItem('large');
    expect(large?.name).toBe('Extra Large');
    expect(large?.weight).toBe(2);
    expect(large?.createdAt).toBe(before?.createdAt);
    expect(large?.updatedAt).not.toBe(before?.updatedAt);
    expect(foodItem('small')).toEqual(smallBefore);
    expect(foodItem('chicken')?.name).toBe(chickenBefore?.name);
    expect(foodItem('chicken')?.updatedAt).toBe(chickenBefore?.updatedAt);
    expect(foodItem('pizza')?.updatedAt).toBe(pizzaBefore?.updatedAt);
    expect(foodItem('beef')?.name).toBe('Beef Pepperoni');
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

  it('deletes a leaf after confirmation and keeps siblings', async () => {
    const user = userEvent.setup();
    seedFoodWheel();
    renderEditor();

    await user.click(screen.getByRole('button', { name: 'Delete Sushi' }));
    const dialog = deleteDialog();
    expect(within(dialog).getByText(EDITOR_MESSAGES.deleteItem('Sushi'))).toBeInTheDocument();
    expect(within(dialog).queryByText(/all descendants will also be deleted/i)).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    expect(screen.queryByText('🍣 Sushi')).not.toBeInTheDocument();
    expect(screen.getByText('🍕 Pizza')).toBeInTheDocument();
    expect(screen.getByText('🍔 Burger')).toBeInTheDocument();
    expect(foodItem('sushi')).toBeUndefined();
    expect(foodItem('pizza')?.name).toBe('Pizza');
    expect(foodItem('burger')?.name).toBe('Burger');
  });

  it('deletes a parent and all descendants after an explicit warning', async () => {
    const user = userEvent.setup();
    seedFoodWheel();
    renderEditor();

    await user.click(screen.getByRole('button', { name: 'Delete Pizza' }));
    const dialog = deleteDialog();
    expect(within(dialog).getByText(EDITOR_MESSAGES.deleteItem('Pizza'))).toBeInTheDocument();
    expect(within(dialog).getByText(EDITOR_MESSAGES.deleteDescendantsWarning(2))).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    expect(screen.queryByText('🍕 Pizza')).not.toBeInTheDocument();
    expect(screen.queryByText('🍗 Chicken Pepperoni')).not.toBeInTheDocument();
    expect(screen.queryByText('🥩 Beef Pepperoni')).not.toBeInTheDocument();
    expect(screen.getByText('🍔 Burger')).toBeInTheDocument();
    expect(screen.getByText('Chicken Burger')).toBeInTheDocument();
    expect(foodItem('pizza')).toBeUndefined();
    expect(foodItem('chicken')).toBeUndefined();
    expect(foodItem('beef')).toBeUndefined();
    expect(foodItem('burger')?.name).toBe('Burger');
  });

  it('deletes a deep parent recursively without changing siblings', async () => {
    const user = userEvent.setup();
    seedFoodWheel();
    useWheelStore.getState().addChildItem('chicken', {
      id: 'large',
      name: 'Large',
      color: '#16a34a',
      enabled: true,
      weight: 1,
    });
    useWheelStore.getState().addChildItem('large', {
      id: 'extra',
      name: 'Extra cheese',
      color: '#ea580c',
      enabled: true,
      weight: 1,
    });
    renderEditor();

    await user.click(screen.getByRole('button', { name: 'Delete Chicken Pepperoni' }));
    const dialog = deleteDialog();
    expect(within(dialog).getByText(EDITOR_MESSAGES.deleteItem('Chicken Pepperoni'))).toBeInTheDocument();
    expect(within(dialog).getByText(EDITOR_MESSAGES.deleteDescendantsWarning(2))).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    expect(screen.queryByText('🍗 Chicken Pepperoni')).not.toBeInTheDocument();
    expect(screen.queryByText('Large')).not.toBeInTheDocument();
    expect(screen.queryByText('Extra cheese')).not.toBeInTheDocument();
    expect(screen.getByText('🍕 Pizza')).toBeInTheDocument();
    expect(screen.getByText('🥩 Beef Pepperoni')).toBeInTheDocument();
    expect(foodItem('chicken')).toBeUndefined();
    expect(foodItem('large')).toBeUndefined();
    expect(foodItem('extra')).toBeUndefined();
    expect(foodItem('pizza')?.children?.map((item) => item.id)).toEqual(['beef']);
  });

  it('cancels deletion and leaves the tree unchanged', async () => {
    const user = userEvent.setup();
    seedFoodWheel();
    renderEditor();

    await user.click(screen.getByRole('button', { name: 'Delete Pizza' }));
    const dialog = deleteDialog();
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog', { name: 'Delete item' })).not.toBeInTheDocument();
    expect(screen.getByText('🍕 Pizza')).toBeInTheDocument();
    expect(screen.getByText('🍗 Chicken Pepperoni')).toBeInTheDocument();
    expect(foodItem('pizza')?.children?.map((item) => item.id)).toEqual(['chicken', 'beef']);
  });

  it('persists a confirmed deletion', async () => {
    const user = userEvent.setup();
    window.localStorage.clear();
    storageService.clearMemory();
    seedFoodWheel();
    renderEditor();

    await user.click(screen.getByRole('button', { name: 'Delete Sushi' }));
    await user.click(within(deleteDialog()).getByRole('button', { name: 'Delete' }));

    expect(foodItem('sushi')).toBeUndefined();
    expect(
      loadPersistedState().wheels.find((wheel) => wheel.id === 'food')?.items.map((item) => item.id),
    ).toEqual(['pizza', 'burger']);
  });

  it('adds a child two levels deep without duplicating tree rendering', async () => {
    const user = userEvent.setup();
    seedFoodWheel();
    renderEditor();

    await user.click(screen.getByRole('button', { name: 'Add child to Chicken Pepperoni' }));
    const dialog = screen.getByRole('dialog', { name: 'Add Child Data' });
    await user.type(within(dialog).getByLabelText(/child name/i), 'Extra spicy');
    await user.click(within(dialog).getByRole('button', { name: 'Add Child' }));

    expect(await screen.findByText('Extra spicy')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add child to Extra spicy' })).toBeInTheDocument();
  });

  it('prevents adding main data without a name', async () => {
    const user = userEvent.setup();
    seedFoodWheel();
    renderEditor();

    const form = screen.getByRole('form', { name: 'Add Main Data' });
    await user.click(within(form).getByRole('button', { name: 'Add item' }));

    expect(await screen.findByText(EDITOR_MESSAGES.nameRequired)).toBeInTheDocument();
    expect(useWheelStore.getState().getWheel('food')?.items).toHaveLength(3);
  });

  it('adds main data to the active wheel, resets the form, and shows success', async () => {
    const user = userEvent.setup();
    seedFoodWheel();
    renderEditor();

    const form = screen.getByRole('form', { name: 'Add Main Data' });
    expect(within(form).getByRole('spinbutton', { name: 'Weight' })).toHaveValue(1);
    expect(within(form).getByRole('switch', { name: 'Enabled' })).toBeChecked();

    await user.type(within(form).getByLabelText(/^name/i), 'Taco');
    await user.type(within(form).getByLabelText(/^description/i), 'Street food');
    await user.type(within(form).getByLabelText(/^icon/i), '🌮');
    await user.click(within(form).getByRole('button', { name: 'Add item' }));

    expect(await screen.findByText('🌮 Taco')).toBeInTheDocument();
    expect(await screen.findByRole('alert')).toHaveTextContent(EDITOR_MESSAGES.itemAdded('Taco'));
    expect(within(form).getByLabelText(/^name/i)).toHaveValue('');
    expect(within(form).getByLabelText(/^description/i)).toHaveValue('');
    expect(within(form).getByLabelText(/^icon/i)).toHaveValue('');
    expect(within(form).getByRole('spinbutton', { name: 'Weight' })).toHaveValue(1);
    expect(within(form).getByRole('switch', { name: 'Enabled' })).toBeChecked();

    const added = useWheelStore.getState().getWheel('food')?.items.find((item) => item.name === 'Taco');
    expect(added?.id).toEqual(expect.any(String));
    expect(added?.id).not.toBe('food');
    expect(added?.description).toBe('Street food');
    expect(added?.icon).toBe('🌮');
    expect(added?.enabled).toBe(true);
    expect(added?.weight).toBe(1);
    expect(useWheelStore.getState().getWheel('food')?.items.map((item) => item.id)).toEqual(
      expect.arrayContaining([added?.id]),
    );
  });

  it('assigns a unique id for each main item', async () => {
    const user = userEvent.setup();
    seedFoodWheel();
    renderEditor();

    const form = screen.getByRole('form', { name: 'Add Main Data' });
    await user.type(within(form).getByLabelText(/^name/i), 'Taco');
    await user.click(within(form).getByRole('button', { name: 'Add item' }));
    expect(await screen.findByText('Taco')).toBeInTheDocument();
    await user.type(within(form).getByLabelText(/^name/i), 'Salad');
    await user.click(within(form).getByRole('button', { name: 'Add item' }));
    expect(await screen.findByText('Salad')).toBeInTheDocument();

    const names = useWheelStore.getState().getWheel('food')?.items ?? [];
    const taco = names.find((item) => item.name === 'Taco');
    const salad = names.find((item) => item.name === 'Salad');
    const ids = names.map((item) => item.id);

    expect(taco?.id).toBeTruthy();
    expect(salad?.id).toBeTruthy();
    expect(taco?.id).not.toBe(salad?.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

