import { ItemHierarchyTree } from '@/features/wheel-editor/components/ItemHierarchyTree';
import { TREE_NODE_KIND, type EditorTreeNode } from '@/features/wheel-editor/utils/toEditorTree';
import { renderWithProviders, screen, within } from '@/test/test-utils';

function node(extra?: Partial<EditorTreeNode> & { children?: EditorTreeNode[] }): EditorTreeNode {
  return {
    id: 'item',
    name: 'Item',
    enabled: true,
    weight: 1,
    kind: TREE_NODE_KIND.item,
    children: [],
    ...extra,
  };
}

describe('ItemHierarchyTree', () => {
  it('renders nothing when there are no nodes', () => {
    const { container } = renderWithProviders(<ItemHierarchyTree nodes={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders a name without an icon', () => {
    renderWithProviders(<ItemHierarchyTree nodes={[node({ id: 'plain', name: 'Plain' })]} />);

    expect(screen.getByText('Plain')).toBeInTheDocument();
    expect(screen.queryByText(/🍕/)).not.toBeInTheDocument();
    expect(screen.queryByText(/disabled/i)).not.toBeInTheDocument();
  });

  it('treats an empty icon as missing', () => {
    renderWithProviders(
      <ItemHierarchyTree nodes={[node({ id: 'empty-icon', name: 'No icon', icon: '' })]} />,
    );

    expect(screen.getByText('No icon')).toBeInTheDocument();
    expect(screen.queryByText(/No icon/)).toHaveTextContent('No icon');
  });

  it('prefixes the name with an icon when present', () => {
    renderWithProviders(
      <ItemHierarchyTree nodes={[node({ id: 'pizza', name: 'Pizza', icon: '🍕' })]} />,
    );

    expect(screen.getByText('🍕 Pizza')).toBeInTheDocument();
  });

  it('marks disabled nodes', () => {
    renderWithProviders(
      <ItemHierarchyTree
        nodes={[node({ id: 'off', name: 'Offline', icon: '🚫', enabled: false })]}
      />,
    );

    expect(screen.getByText('🚫 Offline (disabled)')).toBeInTheDocument();
  });

  it('marks a disabled node without an icon', () => {
    renderWithProviders(
      <ItemHierarchyTree nodes={[node({ id: 'off', name: 'Hidden', enabled: false })]} />,
    );

    expect(screen.getByText('Hidden (disabled)')).toBeInTheDocument();
  });

  it('renders nested children recursively', () => {
    renderWithProviders(
      <ItemHierarchyTree
        nodes={[
          node({
            id: 'pizza',
            name: 'Pizza',
            icon: '🍕',
            children: [
              node({
                id: 'pepperoni',
                name: 'Pepperoni',
                icon: '🥓',
                children: [node({ id: 'extra', name: 'Extra cheese', enabled: false })],
              }),
              node({ id: 'veggie', name: 'Veggie', enabled: false }),
            ],
          }),
        ]}
      />,
    );

    const lists = screen.getAllByRole('list');
    expect(lists).toHaveLength(3);
    expect(screen.getByText('🍕 Pizza')).toBeInTheDocument();
    expect(screen.getByText('🥓 Pepperoni')).toBeInTheDocument();
    expect(screen.getByText('Extra cheese (disabled)')).toBeInTheDocument();
    expect(screen.getByText('Veggie (disabled)')).toBeInTheDocument();
  });

  it('renders sibling nodes at the same level', () => {
    renderWithProviders(
      <ItemHierarchyTree
        nodes={[
          node({ id: 'a', name: 'Alpha', icon: '🅰️' }),
          node({ id: 'b', name: 'Beta' }),
        ]}
      />,
    );

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(within(items[0]!).getByText('🅰️ Alpha')).toBeInTheDocument();
    expect(within(items[1]!).getByText('Beta')).toBeInTheDocument();
  });
});
