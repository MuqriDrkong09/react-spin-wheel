import { act } from '@testing-library/react';
import type { ComponentProps, ReactNode } from 'react';

import type { TreeItemHandlers } from '@/features/wheel-editor/components/TreeItemActions';
import { WheelTree } from '@/features/wheel-editor/components/WheelTree';
import { EDITOR_MESSAGES } from '@/features/wheel-editor/constants';
import { toDroppableId } from '@/features/wheel-editor/utils/dndTree';
import { TREE_NODE_KIND, type EditorTreeNode } from '@/features/wheel-editor/utils/toEditorTree';
import { renderWithProviders, screen, userEvent, within } from '@/test/test-utils';

type DragActive = { active: { id: string | number }; over?: { id: string | number } | null };

const dndHarness = vi.hoisted(() => ({
  announcements: undefined as
    | {
        onDragStart: (event: DragActive) => string;
        onDragOver: (event: DragActive) => string;
        onDragEnd: (event: DragActive) => string;
        onDragCancel: (event: DragActive) => string;
      }
    | undefined,
  onDragStart: undefined as ((event: DragActive) => void) | undefined,
  onDragEnd: undefined as ((event: DragActive) => void) | undefined,
  onDragCancel: undefined as (() => void) | undefined,
}));

vi.mock('@/utils/dnd', async (importOriginal) => {
  const React = await import('react');
  const actual = await importOriginal<typeof import('@/utils/dnd')>();

  return {
    ...actual,
    DndContext({
      children,
      accessibility,
      onDragStart,
      onDragEnd,
      onDragCancel,
    }: {
      children?: ReactNode;
      accessibility?: { announcements?: typeof dndHarness.announcements };
      onDragStart?: (event: DragActive) => void;
      onDragEnd?: (event: DragActive) => void;
      onDragCancel?: () => void;
    }) {
      dndHarness.announcements = accessibility?.announcements;
      dndHarness.onDragStart = onDragStart;
      dndHarness.onDragEnd = onDragEnd;
      dndHarness.onDragCancel = onDragCancel;
      return React.createElement('div', { 'data-testid': 'dnd-context' }, children);
    },
    DragOverlay({ children }: { children?: ReactNode }) {
      return React.createElement('div', { 'data-testid': 'drag-overlay' }, children);
    },
    SortableContext({ children }: { children?: ReactNode }) {
      return children;
    },
    useSortable: () => ({
      attributes: {},
      listeners: {},
      setNodeRef: vi.fn(),
      transform: null,
      transition: undefined,
      isDragging: false,
    }),
    useDroppable: () => ({
      setNodeRef: vi.fn(),
      isOver: false,
    }),
  };
});

function node(
  id: string,
  extra?: Partial<EditorTreeNode> & { children?: EditorTreeNode[] },
): EditorTreeNode {
  return {
    id,
    name: id,
    enabled: true,
    weight: 1,
    kind: TREE_NODE_KIND.item,
    children: [],
    ...extra,
  };
}

const chicken = node('chicken', { name: 'Chicken Pepperoni', icon: '🍗' });
const pizza = node('pizza', { name: 'Pizza', icon: '🍕', color: '#ea580c', children: [chicken] });
const burger = node('burger', { name: 'Burger' });
const root: EditorTreeNode = {
  id: 'food',
  name: 'Food Wheel',
  icon: '📁',
  enabled: true,
  weight: 1,
  kind: TREE_NODE_KIND.wheel,
  children: [pizza, burger],
};

function handlers(): TreeItemHandlers {
  return {
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onAddChild: vi.fn(),
    onToggleEnabled: vi.fn(),
    onDuplicate: vi.fn(),
  };
}

function renderTree(overrides: Partial<ComponentProps<typeof WheelTree>> = {}) {
  const props = {
    root,
    expandedIds: new Set(['food', 'pizza']),
    handlers: handlers(),
    onToggleExpand: vi.fn(),
    onMove: vi.fn(),
    ...overrides,
  };

  renderWithProviders(<WheelTree {...props} />);
  return props;
}

describe('WheelTree', () => {
  beforeEach(() => {
    dndHarness.announcements = undefined;
    dndHarness.onDragStart = undefined;
    dndHarness.onDragEnd = undefined;
    dndHarness.onDragCancel = undefined;
  });

  it('renders the wheel tree and forwards item actions', async () => {
    const user = userEvent.setup();
    const { handlers: treeHandlers, onToggleExpand } = renderTree();

    expect(screen.getByRole('list', { name: 'Food Wheel tree' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '📁 Food Wheel', level: 2 })).toBeInTheDocument();
    expect(screen.getByText('🍕 Pizza')).toBeInTheDocument();
    expect(screen.getByText('🍗 Chicken Pepperoni')).toBeInTheDocument();
    expect(screen.getByText('Burger')).toBeInTheDocument();
    expect(within(screen.getByTestId('drag-overlay')).queryByText('🍕 Pizza')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Collapse Pizza' }));
    expect(onToggleExpand).toHaveBeenCalledWith('pizza');
    await user.click(screen.getByRole('button', { name: 'Edit Burger' }));
    expect(treeHandlers.onEdit).toHaveBeenCalledWith('burger');
  });

  it('shows a drag overlay with an icon and reports a completed move', () => {
    const { onMove } = renderTree();

    act(() => {
      dndHarness.onDragStart?.({ active: { id: 'pizza' } });
    });
    expect(within(screen.getByTestId('drag-overlay')).getByText('🍕 Pizza')).toBeInTheDocument();

    act(() => {
      dndHarness.onDragEnd?.({ active: { id: 'burger' }, over: { id: 'pizza' } });
    });
    expect(onMove).toHaveBeenCalledWith({
      itemId: 'burger',
      targetParentId: null,
      index: 0,
    });
    expect(within(screen.getByTestId('drag-overlay')).queryByText('🍕 Pizza')).not.toBeInTheDocument();
  });

  it('shows a plain-name overlay and ignores a cancelled or empty drop', () => {
    const { onMove } = renderTree();

    act(() => {
      dndHarness.onDragStart?.({ active: { id: 'burger' } });
    });
    expect(within(screen.getByTestId('drag-overlay')).getByText('Burger')).toBeInTheDocument();

    act(() => {
      dndHarness.onDragEnd?.({ active: { id: 'burger' }, over: null });
    });
    expect(onMove).not.toHaveBeenCalled();

    act(() => {
      dndHarness.onDragStart?.({ active: { id: 'burger' } });
      dndHarness.onDragCancel?.();
    });
    expect(within(screen.getByTestId('drag-overlay')).queryByText('Burger')).not.toBeInTheDocument();
  });

  it('announces drag progress, including unknown nodes and droppable parents', () => {
    renderTree();
    const announcements = dndHarness.announcements;
    expect(announcements).toBeDefined();

    expect(announcements?.onDragStart({ active: { id: 'pizza' } })).toBe(
      EDITOR_MESSAGES.dndPickedUp('Pizza'),
    );
    expect(announcements?.onDragStart({ active: { id: 'missing' } })).toBe(
      EDITOR_MESSAGES.dndPickedUp('item'),
    );

    expect(announcements?.onDragOver({ active: { id: 'pizza' }, over: null })).toBe(
      EDITOR_MESSAGES.dndPickedUp('Pizza'),
    );
    expect(announcements?.onDragOver({ active: { id: 'missing' }, over: null })).toBe(
      EDITOR_MESSAGES.dndPickedUp('item'),
    );
    expect(
      announcements?.onDragOver({ active: { id: 'burger' }, over: { id: toDroppableId('food') } }),
    ).toBe(EDITOR_MESSAGES.dndMovedOver('Burger', 'children of Food Wheel'));
    expect(
      announcements?.onDragOver({ active: { id: 'burger' }, over: { id: toDroppableId('missing') } }),
    ).toBe(EDITOR_MESSAGES.dndMovedOver('Burger', 'children of item'));
    expect(announcements?.onDragOver({ active: { id: 'burger' }, over: { id: 'pizza' } })).toBe(
      EDITOR_MESSAGES.dndMovedOver('Burger', 'Pizza'),
    );
    expect(announcements?.onDragOver({ active: { id: 'burger' }, over: { id: 'missing' } })).toBe(
      EDITOR_MESSAGES.dndMovedOver('Burger', 'item'),
    );
    expect(announcements?.onDragOver({ active: { id: 'missing' }, over: { id: 'pizza' } })).toBe(
      EDITOR_MESSAGES.dndMovedOver('item', 'Pizza'),
    );

    expect(announcements?.onDragEnd({ active: { id: 'pizza' } })).toBe(EDITOR_MESSAGES.dndDropped('Pizza'));
    expect(announcements?.onDragEnd({ active: { id: 'missing' } })).toBe(
      EDITOR_MESSAGES.dndDropped('item'),
    );
    expect(announcements?.onDragCancel({ active: { id: 'pizza' } })).toBe(
      EDITOR_MESSAGES.dndCancelled('Pizza'),
    );
    expect(announcements?.onDragCancel({ active: { id: 'missing' } })).toBe(
      EDITOR_MESSAGES.dndCancelled('item'),
    );
  });
});
