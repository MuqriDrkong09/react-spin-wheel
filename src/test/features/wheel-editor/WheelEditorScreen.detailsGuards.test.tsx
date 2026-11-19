import { WheelEditorScreen } from '@/features/wheel-editor/WheelEditorScreen';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';

const openEdit = vi.fn();
const openAddChild = vi.fn();
const duplicate = vi.fn();
const requestDelete = vi.fn();
const spinFromItem = vi.fn();
const closeDetails = vi.fn();

vi.mock('@/features/wheel-editor/hooks/useWheelEditor', () => ({
  useWheelEditor: () => ({
    wheel: undefined,
    availableWheels: [],
    needsWheelChoice: false,
    tree: undefined,
    expandedIds: new Set<string>(),
    hasWheel: false,
    isMissingWheel: false,
    isInvalidWheel: false,
    invalidWheelMessage: 'invalid',
    dialog: null,
    dialogParent: undefined,
    dialogNode: undefined,
    detailsNode: null,
    canSpinFromDetails: false,
    formDefaults: {
      name: '',
      icon: '',
      description: '',
      color: '#ea580c',
      weight: 1,
      enabled: true,
      customFields: {},
    },
    mainFormDefaults: {
      name: '',
      icon: '',
      description: '',
      color: '#ea580c',
      weight: 1,
      enabled: true,
      customFields: {},
    },
    fieldDefinitions: [],
    successMessage: null,
    pendingDelete: null,
    toggleExpand: vi.fn(),
    addMainItem: vi.fn(),
    clearSuccessMessage: vi.fn(),
    openAddChild,
    openEdit,
    openDetails: vi.fn(),
    closeDetails,
    closeDialog: vi.fn(),
    submitDialog: vi.fn(),
    setCustomFieldDefinitions: vi.fn(),
    requestDelete,
    confirmDelete: vi.fn(),
    cancelDelete: vi.fn(),
    toggleEnabled: vi.fn(),
    duplicate,
    spinFromItem,
    moveItem: vi.fn(),
    treeHandlers: {
      onEdit: vi.fn(),
      onDelete: vi.fn(),
      onAddChild: vi.fn(),
      onToggleEnabled: vi.fn(),
      onDuplicate: vi.fn(),
      onViewDetails: vi.fn(),
    },
    goToCreate: vi.fn(),
    goToDashboard: vi.fn(),
    selectWheel: vi.fn(),
    clearWheelSelection: vi.fn(),
  }),
}));

vi.mock('@/features/wheel-export/hooks/useWheelExport', () => ({
  useWheelExport: () => ({
    exportWheel: vi.fn(),
    status: null,
    clearStatus: vi.fn(),
  }),
}));

vi.mock('@/features/wheel-share/hooks/useWheelShare', () => ({
  useWheelShare: () => ({
    copyShareLink: vi.fn(),
    status: null,
    clearStatus: vi.fn(),
  }),
}));

vi.mock('@/features/wheel-editor/components/ItemDetailsDrawer', () => ({
  ItemDetailsDrawer: ({
    actions,
  }: {
    actions: {
      onEdit: () => void;
      onAddChild: () => void;
      onDuplicate: () => void;
      onDelete: () => void;
      onSpinFromItem: () => void;
      onClose: () => void;
    };
  }) => (
    <div>
      <button type="button" onClick={actions.onEdit}>
        guard-edit
      </button>
      <button type="button" onClick={actions.onAddChild}>
        guard-add
      </button>
      <button type="button" onClick={actions.onDuplicate}>
        guard-duplicate
      </button>
      <button type="button" onClick={actions.onDelete}>
        guard-delete
      </button>
      <button type="button" onClick={actions.onSpinFromItem}>
        guard-spin
      </button>
      <button type="button" onClick={actions.onClose}>
        guard-close
      </button>
    </div>
  ),
}));

describe('WheelEditorScreen details action guards', () => {
  beforeEach(() => {
    openEdit.mockReset();
    openAddChild.mockReset();
    duplicate.mockReset();
    requestDelete.mockReset();
    spinFromItem.mockReset();
    closeDetails.mockReset();
  });

  it('does not invoke editor actions when detailsNode is missing', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WheelEditorScreen />);

    await user.click(screen.getByRole('button', { name: 'guard-edit' }));
    await user.click(screen.getByRole('button', { name: 'guard-add' }));
    await user.click(screen.getByRole('button', { name: 'guard-duplicate' }));
    await user.click(screen.getByRole('button', { name: 'guard-delete' }));
    await user.click(screen.getByRole('button', { name: 'guard-spin' }));
    await user.click(screen.getByRole('button', { name: 'guard-close' }));

    expect(openEdit).not.toHaveBeenCalled();
    expect(openAddChild).not.toHaveBeenCalled();
    expect(duplicate).not.toHaveBeenCalled();
    expect(requestDelete).not.toHaveBeenCalled();
    expect(spinFromItem).not.toHaveBeenCalled();
    expect(closeDetails).toHaveBeenCalledTimes(1);
  });
});
