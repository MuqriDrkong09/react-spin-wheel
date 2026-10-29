import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';

import { ROUTES, withWheelId } from '@/constants/routes';
import { ITEM_COLORS } from '@/constants/wheel';
import { EDITOR_MESSAGES } from '@/features/wheel-editor/constants';
import { useWheelEditor } from '@/features/wheel-editor/hooks/useWheelEditor';
import { defaultItemFormValues, type ItemFormValues } from '@/features/wheel-editor/schema';
import { persistStores } from '@/services/storage/storePersistence';
import { resetWheelStore, useWheelStore } from '@/stores/wheelStore';
import type { Wheel, WheelItem } from '@/types/wheel';

const treeHarness = vi.hoisted(() => ({
  passThrough: true,
}));

vi.mock('@/services/storage/storePersistence', () => ({
  persistStores: vi.fn(),
}));

vi.mock('@/features/wheel-editor/utils/toEditorTree', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/wheel-editor/utils/toEditorTree')>();

  return {
    ...actual,
    toEditorTree(wheel: Wheel) {
      if (!treeHarness.passThrough) {
        return undefined as never;
      }

      return actual.toEditorTree(wheel);
    },
  };
});

function wrapper(initialEntry: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={[initialEntry]}>{children}</MemoryRouter>;
  };
}

function useEditorWithLocation() {
  const editor = useWheelEditor();
  const location = useLocation();

  return {
    ...editor,
    href: `${location.pathname}${location.search}`,
  };
}

function renderEditor(initialEntry = withWheelId(ROUTES.wheelEditor, 'food')) {
  return renderHook(() => useEditorWithLocation(), {
    wrapper: wrapper(initialEntry),
  });
}

function formValues(overrides: Partial<ItemFormValues> = {}): ItemFormValues {
  return {
    ...defaultItemFormValues,
    name: 'Taco',
    ...overrides,
  };
}

function seedFoodWheel() {
  const store = useWheelStore.getState();
  store.createWheel({
    id: 'food',
    name: 'Food Wheel',
    icon: '📁',
    items: [
      { id: 'pizza', name: 'Pizza', icon: '🍕', color: '#ea580c', enabled: true, weight: 1 },
      { id: 'sushi', name: 'Sushi', enabled: true, weight: 1 },
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
  store.setActiveWheel('food');
}

describe('useWheelEditor', () => {
  beforeEach(() => {
    treeHarness.passThrough = true;
    vi.mocked(persistStores).mockClear();
    resetWheelStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not ask for a wheel when the store is empty', () => {
    const { result } = renderEditor(ROUTES.wheelEditor);

    expect(result.current.wheel).toBeUndefined();
    expect(result.current.tree).toBeUndefined();
    expect(result.current.needsWheelChoice).toBe(false);
    expect(result.current.isMissingWheel).toBe(false);
    expect(result.current.hasWheel).toBe(false);
    expect([...result.current.expandedIds]).toEqual([]);
    expect(result.current.formDefaults).toEqual(defaultItemFormValues);

    act(() => {
      result.current.toggleExpand('food');
      result.current.addMainItem(formValues());
      result.current.submitDialog(formValues());
      result.current.requestDelete('pizza');
      result.current.confirmDelete();
      result.current.toggleEnabled('pizza');
      result.current.duplicate('pizza');
      result.current.moveItem({ itemId: 'pizza', targetParentId: null, index: 0 });
    });

    expect(persistStores).not.toHaveBeenCalled();
  });

  it('sorts picker wheels by recency, then name', () => {
    useWheelStore.getState().createWheel({ id: 'food', name: 'Food Wheel' });
    useWheelStore.getState().createWheel({ id: 'games', name: 'Games Wheel' });
    useWheelStore.getState().createWheel({ id: 'alpha', name: 'Alpha' });
    useWheelStore.getState().createWheel({ id: 'beta', name: 'Beta' });
    useWheelStore.setState((state) => ({
      wheels: state.wheels.map((wheel) => {
        if (wheel.id === 'alpha' || wheel.id === 'beta') {
          return { ...wheel, updatedAt: '2026-03-01T00:00:00.000Z' };
        }

        if (wheel.id === 'food' || wheel.id === 'games') {
          return { ...wheel, updatedAt: '2026-01-01T00:00:00.000Z' };
        }

        return wheel;
      }),
    }));

    const { result } = renderEditor(ROUTES.wheelEditor);

    expect(result.current.needsWheelChoice).toBe(true);
    expect(result.current.availableWheels.map((wheel) => wheel.id)).toEqual([
      'alpha',
      'beta',
      'food',
      'games',
    ]);
  });

  it('loads the requested wheel, marks it active, and skips a matching active id', () => {
    seedFoodWheel();
    const { result } = renderEditor();

    expect(result.current.wheel?.id).toBe('food');
    expect(result.current.hasWheel).toBe(true);
    expect(result.current.needsWheelChoice).toBe(false);
    expect(result.current.isMissingWheel).toBe(false);
    expect(useWheelStore.getState().activeWheelId).toBe('food');
    expect(result.current.expandedIds.has('food')).toBe(true);
    expect(result.current.expandedIds.has('pizza')).toBe(true);
    expect(result.current.expandedIds.has('sushi')).toBe(false);

    const setActiveWheel = vi.spyOn(useWheelStore.getState(), 'setActiveWheel');
    renderEditor();
    expect(setActiveWheel).not.toHaveBeenCalled();
  });

  it('reports a missing wheel without changing the active selection', () => {
    seedFoodWheel();
    useWheelStore.getState().setActiveWheel(null);
    const { result } = renderEditor(withWheelId(ROUTES.wheelEditor, 'ghost'));

    expect(result.current.wheel).toBeUndefined();
    expect(result.current.isMissingWheel).toBe(true);
    expect(result.current.needsWheelChoice).toBe(false);
    expect(useWheelStore.getState().activeWheelId).toBeNull();
  });

  it('selects a wheel, clears the selection, and navigates to create or dashboard', () => {
    seedFoodWheel();
    const { result } = renderEditor(ROUTES.wheelEditor);

    act(() => {
      result.current.selectWheel('food');
    });
    expect(useWheelStore.getState().activeWheelId).toBe('food');
    expect(result.current.href).toBe(withWheelId(ROUTES.wheelEditor, 'food'));

    act(() => {
      result.current.clearWheelSelection();
    });
    expect(result.current.href).toBe(ROUTES.wheelEditor);

    act(() => {
      result.current.goToCreate();
    });
    expect(result.current.href).toBe(ROUTES.createWheel);

    act(() => {
      result.current.goToDashboard();
    });
    expect(result.current.href).toBe(ROUTES.dashboard);
  });

  it('toggles expansion and keeps ids when the selected wheel changes', () => {
    seedFoodWheel();
    useWheelStore.getState().createWheel({ id: 'games', name: 'Games Wheel' });
    const { result } = renderEditor();

    act(() => {
      result.current.toggleExpand('pizza');
    });
    expect(result.current.expandedIds.has('pizza')).toBe(false);

    act(() => {
      result.current.toggleExpand('sushi');
    });
    expect(result.current.expandedIds.has('sushi')).toBe(true);

    act(() => {
      result.current.selectWheel('games');
    });
    expect(result.current.wheel?.id).toBe('games');
    expect(result.current.expandedIds.has('games')).toBe(true);
    expect(result.current.expandedIds.has('sushi')).toBe(false);
  });

  it('adds main data and expands the wheel when it was collapsed', () => {
    seedFoodWheel();
    const { result } = renderEditor();

    act(() => {
      result.current.toggleExpand('food');
    });
    act(() => {
      result.current.addMainItem(formValues());
    });

    expect(result.current.successMessage).toBe(EDITOR_MESSAGES.itemAdded('Taco'));
    expect(result.current.expandedIds.has('food')).toBe(true);
    expect(useWheelStore.getState().getWheel('food')?.items.some((item) => item.name === 'Taco')).toBe(
      true,
    );

    act(() => {
      result.current.clearSuccessMessage();
    });
    expect(result.current.successMessage).toBeNull();
  });

  it('skips adding main data when the store does not create an item', () => {
    seedFoodWheel();
    vi.spyOn(useWheelStore.getState(), 'addItem').mockReturnValue(undefined);
    const { result } = renderEditor();

    act(() => {
      result.current.addMainItem(formValues());
    });

    expect(result.current.successMessage).toBeNull();
    expect(useWheelStore.getState().getWheel('food')?.items).toHaveLength(2);
  });

  it('opens add and edit dialogs with form defaults, including missing item fields', () => {
    seedFoodWheel();
    const { result } = renderEditor();

    act(() => {
      result.current.openAddChild('sushi');
    });
    expect(result.current.dialog).toEqual({ type: 'add', parentId: 'sushi' });
    expect(result.current.dialogParent?.name).toBe('Sushi');
    expect(result.current.dialogNode).toBeUndefined();
    expect(result.current.formDefaults.color).toBe(ITEM_COLORS[0]);

    act(() => {
      result.current.openAddChild('food');
    });
    expect(result.current.formDefaults.color).toBe(ITEM_COLORS[2]);

    act(() => {
      result.current.openEdit('sushi');
    });
    expect(result.current.dialog).toEqual({ type: 'edit', nodeId: 'sushi' });
    expect(result.current.dialogParent).toBeUndefined();
    expect(result.current.formDefaults).toMatchObject({
      name: 'Sushi',
      icon: '',
      description: '',
      color: defaultItemFormValues.color,
      weight: 1,
      enabled: true,
    });

    act(() => {
      result.current.closeDialog();
    });
    expect(result.current.dialog).toBeNull();
    expect(result.current.formDefaults).toEqual(defaultItemFormValues);
  });

  it('submits a child and expands the parent', () => {
    seedFoodWheel();
    const { result } = renderEditor();

    act(() => {
      result.current.openAddChild('sushi');
    });
    act(() => {
      result.current.submitDialog(formValues({ name: 'Salmon' }));
    });

    expect(result.current.successMessage).toBe(EDITOR_MESSAGES.childAdded('Salmon', 'Sushi'));
    expect(result.current.dialog).toBeNull();
    expect(result.current.expandedIds.has('sushi')).toBe(true);
  });

  it('closes an add dialog without a success message when the child is not created', () => {
    seedFoodWheel();
    vi.spyOn(useWheelStore.getState(), 'addChildItem').mockReturnValue(undefined);
    const { result } = renderEditor();

    act(() => {
      result.current.openAddChild('sushi');
    });
    act(() => {
      result.current.submitDialog(formValues({ name: 'Salmon' }));
    });

    expect(result.current.successMessage).toBeNull();
    expect(result.current.dialog).toBeNull();
  });

  it('edits a wheel, an item, and a missing node', () => {
    seedFoodWheel();
    const { result } = renderEditor();

    act(() => {
      result.current.openEdit('food');
    });
    act(() => {
      result.current.submitDialog(formValues({ name: 'Dinner Wheel', icon: '🍽️', description: 'Night' }));
    });
    expect(useWheelStore.getState().getWheel('food')?.name).toBe('Dinner Wheel');
    expect(result.current.dialog).toBeNull();

    act(() => {
      result.current.openEdit('pizza');
    });
    act(() => {
      result.current.submitDialog(formValues({ name: 'Deep Dish' }));
    });
    expect(result.current.successMessage).toBe(EDITOR_MESSAGES.itemUpdated('Deep Dish'));

    act(() => {
      result.current.openEdit('ghost');
    });
    act(() => {
      result.current.submitDialog(formValues({ name: 'Nope' }));
    });
    expect(result.current.dialog).toBeNull();
  });

  it('closes an edit dialog without a success message when the item is not updated', () => {
    seedFoodWheel();
    vi.spyOn(useWheelStore.getState(), 'updateChildItem').mockReturnValue(undefined);
    const { result } = renderEditor();

    act(() => {
      result.current.openEdit('sushi');
    });
    act(() => {
      result.current.submitDialog(formValues({ name: 'Nigiri' }));
    });

    expect(result.current.successMessage).toBeNull();
    expect(result.current.dialog).toBeNull();
  });

  it('requests, cancels, and confirms deletion', () => {
    seedFoodWheel();
    const { result } = renderEditor();

    act(() => {
      result.current.requestDelete('food');
    });
    expect(result.current.pendingDelete).toBeUndefined();

    act(() => {
      result.current.requestDelete('sushi');
    });
    expect(result.current.pendingDelete?.name).toBe('Sushi');

    act(() => {
      result.current.cancelDelete();
    });
    expect(result.current.pendingDelete).toBeUndefined();

    act(() => {
      result.current.confirmDelete();
    });
    expect(persistStores).not.toHaveBeenCalled();

    act(() => {
      result.current.requestDelete('sushi');
    });
    act(() => {
      result.current.confirmDelete();
    });
    expect(persistStores).toHaveBeenCalledTimes(1);
    expect(useWheelStore.getState().getWheel('food')?.items.map((item) => item.id)).toEqual(['pizza']);
  });

  it('ignores enable and duplicate actions on the wheel root', () => {
    seedFoodWheel();
    const { result } = renderEditor();

    act(() => {
      result.current.toggleEnabled('food');
      result.current.duplicate('food');
    });
    expect(useWheelStore.getState().getWheel('food')?.items).toHaveLength(2);

    act(() => {
      result.current.toggleEnabled('sushi');
      result.current.duplicate('sushi');
    });
    expect(useWheelStore.getState().getWheel('food')?.items.find((item) => item.id === 'sushi')?.enabled).toBe(
      false,
    );
    expect(
      useWheelStore.getState().getWheel('food')?.items.some((item) => item.name === 'Sushi copy'),
    ).toBe(true);
  });

  it('moves an item, persists, and ignores a failed move', () => {
    seedFoodWheel();
    const { result } = renderEditor();

    act(() => {
      result.current.moveItem({ itemId: 'sushi', targetParentId: 'pizza', index: 2 });
    });
    expect(persistStores).toHaveBeenCalledTimes(1);
    expect(
      useWheelStore.getState().getWheel('food')?.items.find((item) => item.id === 'pizza')?.children?.some(
        (item) => item.id === 'sushi',
      ),
    ).toBe(true);
    expect(result.current.expandedIds.has('pizza')).toBe(true);

    act(() => {
      result.current.moveItem({ itemId: 'chicken', targetParentId: null, index: 0 });
    });
    expect(persistStores).toHaveBeenCalledTimes(2);
    expect(useWheelStore.getState().getWheel('food')?.items.some((item) => item.id === 'chicken')).toBe(
      true,
    );
  });

  it('ignores a move that the store does not apply', () => {
    seedFoodWheel();
    vi.spyOn(useWheelStore.getState(), 'moveItem').mockReturnValue(undefined);
    const { result } = renderEditor();

    act(() => {
      result.current.moveItem({ itemId: 'sushi', targetParentId: 'pizza', index: 0 });
    });

    expect(persistStores).not.toHaveBeenCalled();
    expect(useWheelStore.getState().getWheel('food')?.items.map((item) => item.id)).toEqual([
      'pizza',
      'sushi',
    ]);
  });

  it('does not announce a child when the parent node is missing', () => {
    seedFoodWheel();
    vi.spyOn(useWheelStore.getState(), 'addChildItem').mockReturnValue({
      id: 'ghost-child',
      name: 'Ghost',
      color: '#111827',
      enabled: true,
      weight: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    } satisfies WheelItem);
    const { result } = renderEditor();

    act(() => {
      result.current.openAddChild('missing-parent');
    });
    act(() => {
      result.current.submitDialog(formValues({ name: 'Ghost' }));
    });

    expect(result.current.successMessage).toBeNull();
    expect(result.current.dialog).toBeNull();
  });

  it('skips expansion when the editor tree is unavailable', () => {
    seedFoodWheel();
    treeHarness.passThrough = false;
    const { result } = renderEditor();

    act(() => {
      result.current.addMainItem(formValues());
    });

    expect(result.current.tree).toBeUndefined();
    expect(result.current.successMessage).toBe(EDITOR_MESSAGES.itemAdded('Taco'));
  });
});
