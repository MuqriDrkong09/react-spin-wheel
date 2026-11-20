import { formatDateTime } from '@/features/dashboard/utils/formatDateTime';
import { ItemDetailsDrawer } from '@/features/wheel-editor/components/ItemDetailsDrawer';
import { EDITOR_MESSAGES } from '@/features/wheel-editor/constants';
import { CUSTOM_FIELD_MESSAGES } from '@/features/wheel-editor/constants/customFields';
import { TREE_NODE_KIND, type EditorTreeNode } from '@/features/wheel-editor/utils/toEditorTree';
import { CUSTOM_FIELD_TYPE } from '@/types/customFields';
import { renderWithProviders, screen, userEvent, within } from '@/test/test-utils';

const mobileHarness = vi.hoisted(() => ({
  isMobile: false,
}));

vi.mock('@/hooks/useIsMobile', () => ({
  useIsMobile: () => mobileHarness.isMobile,
}));

function pizzaNode(extra?: Partial<EditorTreeNode>): EditorTreeNode {
  return {
    id: 'pizza',
    name: 'Pizza',
    icon: '🍕',
    description: 'Cheesy classic',
    color: '#ea580c',
    enabled: true,
    weight: 2,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    customFields: { 'f-cuisine': 'Italian' },
    kind: TREE_NODE_KIND.item,
    children: [
      {
        id: 'pepperoni',
        name: 'Pepperoni',
        icon: '🥓',
        enabled: true,
        weight: 1,
        kind: TREE_NODE_KIND.item,
        children: [],
      },
    ],
    ...extra,
  };
}

function actions() {
  return {
    onEdit: vi.fn(),
    onAddChild: vi.fn(),
    onDuplicate: vi.fn(),
    onDelete: vi.fn(),
    onSpinFromItem: vi.fn(),
    onClose: vi.fn(),
  };
}

describe('ItemDetailsDrawer', () => {
  beforeEach(() => {
    mobileHarness.isMobile = false;
  });

  it('renders nothing when no node is selected', () => {
    const { container } = renderWithProviders(
      <ItemDetailsDrawer node={null} actions={actions()} />,
    );

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders item details, hierarchy, custom fields, and actions', async () => {
    const user = userEvent.setup();
    const next = actions();

    renderWithProviders(
      <ItemDetailsDrawer
        node={pizzaNode()}
        fieldDefinitions={[
          {
            id: 'f-cuisine',
            key: 'cuisine',
            label: 'Cuisine',
            type: CUSTOM_FIELD_TYPE.text,
          },
        ]}
        canSpinFromItem
        actions={next}
      />,
    );

    const dialog = screen.getByRole('dialog', { name: EDITOR_MESSAGES.detailsTitle });
    expect(within(dialog).getByText('Pizza')).toBeInTheDocument();
    expect(within(dialog).getByText('Cheesy classic')).toBeInTheDocument();
    expect(within(dialog).getByText('🍕')).toBeInTheDocument();
    expect(within(dialog).getByText('#ea580c')).toBeInTheDocument();
    expect(within(dialog).getByText('2')).toBeInTheDocument();
    expect(within(dialog).getByText(EDITOR_MESSAGES.detailEnabledYes)).toBeInTheDocument();
    expect(within(dialog).getByText(EDITOR_MESSAGES.childCount(1))).toBeInTheDocument();
    expect(within(dialog).getByText(formatDateTime('2026-01-01T00:00:00.000Z'))).toBeInTheDocument();
    expect(within(dialog).getByText(formatDateTime('2026-01-02T00:00:00.000Z'))).toBeInTheDocument();
    expect(
      within(dialog).getByRole('heading', { name: CUSTOM_FIELD_MESSAGES.detailsHeading }),
    ).toBeInTheDocument();
    expect(within(dialog).getByText('Cuisine')).toBeInTheDocument();
    expect(within(dialog).getByText('Italian')).toBeInTheDocument();
    expect(within(dialog).getByText('🥓 Pepperoni')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: EDITOR_MESSAGES.actionEdit }));
    await user.click(within(dialog).getByRole('button', { name: EDITOR_MESSAGES.actionAddChild }));
    await user.click(within(dialog).getByRole('button', { name: EDITOR_MESSAGES.actionDuplicate }));
    await user.click(within(dialog).getByRole('button', { name: EDITOR_MESSAGES.actionDelete }));
    await user.click(
      within(dialog).getByRole('button', { name: EDITOR_MESSAGES.actionSpinFromItem }),
    );
    await user.click(within(dialog).getByRole('button', { name: EDITOR_MESSAGES.actionClose }));

    expect(next.onEdit).toHaveBeenCalledTimes(1);
    expect(next.onAddChild).toHaveBeenCalledTimes(1);
    expect(next.onDuplicate).toHaveBeenCalledTimes(1);
    expect(next.onDelete).toHaveBeenCalledTimes(1);
    expect(next.onSpinFromItem).toHaveBeenCalledTimes(1);
    expect(next.onClose).toHaveBeenCalledTimes(1);
  });

  it('shows placeholders for missing optional metadata', () => {
    renderWithProviders(
      <ItemDetailsDrawer
        node={pizzaNode({
          icon: '',
          description: '   ',
          color: undefined,
          createdAt: undefined,
          updatedAt: undefined,
          children: [],
          customFields: {},
        })}
        actions={actions()}
      />,
    );

    const dialog = screen.getByRole('dialog', { name: EDITOR_MESSAGES.detailsTitle });
    expect(within(dialog).getByText(EDITOR_MESSAGES.detailNoDescription)).toBeInTheDocument();
    expect(within(dialog).getAllByText(EDITOR_MESSAGES.detailNoIcon).length).toBeGreaterThanOrEqual(1);
    expect(within(dialog).getByText(EDITOR_MESSAGES.childCount(0))).toBeInTheDocument();
    expect(within(dialog).getAllByText('—')).toHaveLength(2);
    expect(
      within(dialog).queryByRole('heading', { name: CUSTOM_FIELD_MESSAGES.detailsHeading }),
    ).not.toBeInTheDocument();
  });

  it('shows a disabled state and empty hierarchy copy', () => {
    renderWithProviders(
      <ItemDetailsDrawer
        node={pizzaNode({ enabled: false, children: [] })}
        canSpinFromItem={false}
        actions={actions()}
      />,
    );

    expect(screen.getByText(EDITOR_MESSAGES.detailEnabledNo)).toBeInTheDocument();
    expect(screen.getByText(EDITOR_MESSAGES.detailEmptyHierarchy)).toBeInTheDocument();
  });

  it('disables spin when the item has no children to spin', () => {
    const next = actions();

    renderWithProviders(
      <ItemDetailsDrawer
        node={pizzaNode({ children: [] })}
        canSpinFromItem={false}
        actions={next}
      />,
    );

    const spin = screen.getByRole('button', { name: EDITOR_MESSAGES.actionSpinFromItem });
    expect(spin).toBeDisabled();
    expect(spin).toHaveAttribute('title', EDITOR_MESSAGES.spinFromItemUnavailable);
    expect(spin).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText(EDITOR_MESSAGES.detailEmptyHierarchy)).toBeInTheDocument();
    expect(next.onSpinFromItem).not.toHaveBeenCalled();
  });

  it('omits the icon prefix in the subtitle when the item has no icon', () => {
    renderWithProviders(
      <ItemDetailsDrawer
        node={pizzaNode({ icon: undefined })}
        actions={actions()}
      />,
    );

    const dialog = screen.getByRole('dialog', { name: EDITOR_MESSAGES.detailsTitle });
    expect(within(dialog).getAllByText('Pizza').length).toBeGreaterThan(0);
    expect(within(dialog).queryByText('🍕 Pizza')).not.toBeInTheDocument();
  });

  it('keeps actions visible in the mobile bottom sheet', async () => {
    mobileHarness.isMobile = true;
    const next = actions();
    const user = userEvent.setup();

    renderWithProviders(
      <ItemDetailsDrawer node={pizzaNode()} canSpinFromItem actions={next} />,
    );

    const sheet = screen.getByRole('presentation');
    expect(within(sheet).getByRole('heading', { name: EDITOR_MESSAGES.detailsTitle })).toBeInTheDocument();
    expect(within(sheet).getByText('🍕 Pizza')).toBeInTheDocument();
    expect(within(sheet).getByText(EDITOR_MESSAGES.detailCreated)).toBeInTheDocument();
    expect(within(sheet).getByText(EDITOR_MESSAGES.detailHierarchy)).toBeInTheDocument();
    expect(within(sheet).getByRole('button', { name: EDITOR_MESSAGES.actionEdit })).toBeInTheDocument();
    expect(
      within(sheet).getByRole('button', { name: EDITOR_MESSAGES.actionSpinFromItem }),
    ).toBeEnabled();

    await user.click(within(sheet).getByRole('button', { name: EDITOR_MESSAGES.actionClose }));
    expect(next.onClose).toHaveBeenCalledTimes(1);
  });

  it('defaults canSpinFromItem to disabled when omitted', () => {
    renderWithProviders(<ItemDetailsDrawer node={pizzaNode()} actions={actions()} />);

    expect(screen.getByRole('button', { name: EDITOR_MESSAGES.actionSpinFromItem })).toBeDisabled();
  });
});
