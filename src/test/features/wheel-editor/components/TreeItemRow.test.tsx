import type { ComponentProps } from 'react';

import type { TreeItemHandlers } from '@/features/wheel-editor/components/TreeItemActions';
import { TreeItemRow } from '@/features/wheel-editor/components/TreeItemRow';
import { TREE_NODE_KIND, type EditorTreeNode } from '@/features/wheel-editor/utils/toEditorTree';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';

const sortableHarness = vi.hoisted(() => ({
  isDragging: false,
  transform: null as { x: number; y: number; scaleX: number; scaleY: number } | null,
  transition: undefined as string | undefined,
  id: undefined as string | undefined,
}));

vi.mock('@/utils/dnd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/dnd')>();

  return {
    ...actual,
    useSortable: (options: { id: string }) => {
      sortableHarness.id = options.id;
      return {
        attributes: { role: 'button' },
        listeners: {},
        setNodeRef: vi.fn(),
        transform: sortableHarness.transform,
        transition: sortableHarness.transition,
        isDragging: sortableHarness.isDragging,
      };
    },
  };
});

function node(extra?: Partial<EditorTreeNode>): EditorTreeNode {
  return {
    id: 'pizza',
    name: 'Pizza',
    icon: '🍕',
    color: '#ea580c',
    enabled: true,
    weight: 1,
    kind: TREE_NODE_KIND.item,
    children: [],
    ...extra,
  };
}

function handlers(): TreeItemHandlers {
  return {
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onAddChild: vi.fn(),
    onToggleEnabled: vi.fn(),
    onDuplicate: vi.fn(),
  };
}

function renderRow(overrides: Partial<ComponentProps<typeof TreeItemRow>> = {}) {
  const props = {
    node: node(),
    isExpanded: true,
    handlers: handlers(),
    onToggleExpand: vi.fn(),
    ...overrides,
  };

  const view = renderWithProviders(<TreeItemRow {...props} />);
  return { ...view, props };
}

describe('TreeItemRow', () => {
  beforeEach(() => {
    sortableHarness.isDragging = false;
    sortableHarness.transform = null;
    sortableHarness.transition = undefined;
    sortableHarness.id = undefined;
  });

  it('renders a wheel heading without a reorder handle', () => {
    renderRow({
      node: node({
        id: 'food',
        name: 'Food Wheel',
        icon: '📁',
        color: undefined,
        kind: TREE_NODE_KIND.wheel,
      }),
    });

    expect(screen.getByRole('heading', { name: '📁 Food Wheel', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Collapse Food Wheel' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.queryByRole('button', { name: 'Reorder Food Wheel' })).not.toBeInTheDocument();
    expect(screen.queryByText('Disabled')).not.toBeInTheDocument();
    expect(sortableHarness.id).toBeUndefined();
  });

  it('renders a sortable item with icon, color, and reorder handle', () => {
    const { container } = renderRow();

    expect(screen.getByText('🍕 Pizza')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '🍕 Pizza' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reorder Pizza' })).toBeInTheDocument();
    expect(container.querySelector('div[aria-hidden="true"]')).toBeInTheDocument();
    expect(sortableHarness.id).toBe('pizza');
  });

  it('shows the plain name, expand control, and disabled chip', async () => {
    const user = userEvent.setup();
    const { props } = renderRow({
      node: node({ icon: undefined, color: undefined, enabled: false }),
      isExpanded: false,
    });

    expect(screen.getByText('Pizza')).toBeInTheDocument();
    expect(screen.queryByText('🍕 Pizza')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Pizza' })).not.toBeInTheDocument();
    expect(screen.getByText('Disabled')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Expand Pizza' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );

    await user.click(screen.getByRole('button', { name: 'Expand Pizza' }));
    expect(props.onToggleExpand).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Edit Pizza' }));
    expect(props.handlers.onEdit).toHaveBeenCalledWith('pizza');
  });

  it('dims the row while it is being dragged', () => {
    sortableHarness.isDragging = true;
    sortableHarness.transform = { x: 8, y: 4, scaleX: 1, scaleY: 1 };
    sortableHarness.transition = 'transform 200ms ease';
    const { container } = renderRow();

    const dragged = container.firstElementChild as HTMLElement;
    expect(window.getComputedStyle(dragged).opacity).toBe('0.5');
    expect(window.getComputedStyle(dragged).transition).toContain('transform');
  });
});
