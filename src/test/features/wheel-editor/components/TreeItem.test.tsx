import type { ComponentProps } from 'react';

import { TreeItem } from '@/features/wheel-editor/components/TreeItem';
import type { TreeItemHandlers } from '@/features/wheel-editor/components/TreeItemActions';
import { EDITOR_MESSAGES } from '@/features/wheel-editor/constants';
import { TREE_NODE_KIND, type EditorTreeNode } from '@/features/wheel-editor/utils/toEditorTree';
import { renderWithProviders, screen, userEvent, within } from '@/test/test-utils';

const dropHarness = vi.hoisted(() => ({
  isOver: false,
  disabled: undefined as boolean | undefined,
}));

vi.mock('@/utils/dnd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/dnd')>();

  return {
    ...actual,
    useDroppable: (options: { disabled?: boolean }) => {
      dropHarness.disabled = options.disabled;
      return {
        setNodeRef: vi.fn(),
        isOver: dropHarness.isOver,
      };
    },
    useSortable: () => ({
      attributes: {},
      listeners: {},
      setNodeRef: vi.fn(),
      transform: null,
      transition: undefined,
      isDragging: false,
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

const sushi = node('sushi', { name: 'Sushi', icon: '🍣', color: '#0f766e' });
const chicken = node('chicken', { name: 'Chicken Pepperoni', icon: '🍗', color: '#ca8a04' });
const pizza = node('pizza', {
  name: 'Pizza',
  icon: '🍕',
  color: '#ea580c',
  children: [chicken],
});
const food = node('food', {
  name: 'Food Wheel',
  icon: '📁',
  kind: TREE_NODE_KIND.wheel,
  children: [pizza, sushi],
});

function handlers(): TreeItemHandlers {
  return {
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onAddChild: vi.fn(),
    onToggleEnabled: vi.fn(),
    onDuplicate: vi.fn(),
  };
}

function renderTree(overrides: Partial<ComponentProps<typeof TreeItem>> = {}) {
  const props = {
    node: food,
    expandedIds: new Set(['food', 'pizza']),
    handlers: handlers(),
    onToggleExpand: vi.fn(),
    ...overrides,
  };

  renderWithProviders(
    <ul>
      <TreeItem {...props} />
    </ul>,
  );

  return props;
}

describe('TreeItem', () => {
  beforeEach(() => {
    dropHarness.isOver = false;
    dropHarness.disabled = undefined;
  });

  it('hides children until the node is expanded', () => {
    renderTree({ node: sushi, expandedIds: new Set() });

    expect(screen.getByText('🍣 Sushi')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Expand Sushi' })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Children of Sushi' })).not.toBeInTheDocument();
    expect(dropHarness.disabled).toBe(true);
  });

  it('shows nested children and empty-child copy when expanded', () => {
    renderTree();

    expect(screen.getByRole('heading', { name: '📁 Food Wheel', level: 2 })).toBeInTheDocument();
    expect(screen.getByText('🍕 Pizza')).toBeInTheDocument();
    expect(screen.getByText('🍗 Chicken Pepperoni')).toBeInTheDocument();
    expect(screen.getByText('🍣 Sushi')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Children of Food Wheel' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Children of Pizza' })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Children of Sushi' })).not.toBeInTheDocument();
    expect(screen.queryByText(EDITOR_MESSAGES.emptyChildren('Sushi'))).not.toBeInTheDocument();
    expect(dropHarness.disabled).toBe(true);
  });

  it('shows an empty child state and adds a child from it', async () => {
    const user = userEvent.setup();
    const { handlers: treeHandlers, onToggleExpand } = renderTree({
      node: sushi,
      expandedIds: new Set(['sushi']),
    });

    const group = screen.getByRole('group', { name: 'Children of Sushi' });
    expect(within(group).getByText(EDITOR_MESSAGES.emptyChildren('Sushi'))).toBeInTheDocument();
    expect(dropHarness.disabled).toBe(false);

    await user.click(within(group).getByRole('button', { name: 'Add child to Sushi' }));
    expect(treeHandlers.onAddChild).toHaveBeenCalledWith('sushi');

    await user.click(screen.getByRole('button', { name: 'Collapse Sushi' }));
    expect(onToggleExpand).toHaveBeenCalledWith('sushi');
  });

  it('disables dropping onto a blocked expanded parent', () => {
    renderTree({
      node: sushi,
      expandedIds: new Set(['sushi']),
      blockedParentIds: new Set(['sushi']),
    });

    expect(screen.getByRole('group', { name: 'Children of Sushi' })).toBeInTheDocument();
    expect(dropHarness.disabled).toBe(true);
  });

  it('highlights the drop target while a drag is over it', () => {
    dropHarness.isOver = true;
    renderTree({
      node: sushi,
      expandedIds: new Set(['sushi']),
    });

    const group = screen.getByRole('group', { name: 'Children of Sushi' });
    expect(window.getComputedStyle(group).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(window.getComputedStyle(group).backgroundColor).not.toBe('transparent');
  });
});
