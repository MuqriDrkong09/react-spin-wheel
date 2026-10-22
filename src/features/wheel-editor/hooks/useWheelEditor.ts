import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { ROUTES } from '@/constants/routes';
import type { ItemFormValues } from '@/features/wheel-editor/schema';
import { defaultItemFormValues } from '@/features/wheel-editor/schema';
import { colorForIndex, toItemDraft } from '@/features/wheel-editor/utils/itemDraft';
import {
  collectExpandedIds,
  findTreeNode,
  toEditorTree,
  TREE_NODE_KIND,
} from '@/features/wheel-editor/utils/toEditorTree';
import { useSettingsStore } from '@/stores/settingsStore';
import { useWheelStore } from '@/stores/wheelStore';
import type { HexColor, Wheel, WheelItemId } from '@/types/wheel';
import { findItem } from '@/utils/wheelTree';

export type EditorDialog =
  | { type: 'add'; parentId: string }
  | { type: 'edit'; nodeId: string };

export function useWheelEditor() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedId = searchParams.get('wheelId');

  const wheels = useWheelStore((state) => state.wheels);
  const activeWheelId = useWheelStore((state) => state.activeWheelId);
  const setActiveWheel = useWheelStore((state) => state.setActiveWheel);
  const addChildItem = useWheelStore((state) => state.addChildItem);
  const updateChildItem = useWheelStore((state) => state.updateChildItem);
  const deleteChildItem = useWheelStore((state) => state.deleteChildItem);
  const duplicateItem = useWheelStore((state) => state.duplicateItem);
  const toggleItem = useWheelStore((state) => state.toggleItem);
  const updateWheel = useWheelStore((state) => state.updateWheel);
  const confirmBeforeDelete = useSettingsStore((state) => state.settings.confirmBeforeDelete);

  const wheelId = requestedId ?? activeWheelId;
  const wheel = useMemo(
    () => (wheelId ? wheels.find((entry) => entry.id === wheelId) : undefined),
    [wheelId, wheels],
  );

  const tree = useMemo(() => (wheel ? toEditorTree(wheel) : undefined), [wheel]);

  const [expandedState, setExpandedState] = useState<{ wheelId: string; ids: string[] } | null>(
    null,
  );
  const [dialog, setDialog] = useState<EditorDialog | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (requestedId && wheel && requestedId !== activeWheelId) {
      setActiveWheel(requestedId);
    }
  }, [requestedId, wheel, activeWheelId, setActiveWheel]);

  const expandedIds = useMemo(() => {
    if (!tree) {
      return [];
    }

    if (expandedState?.wheelId === tree.id) {
      return expandedState.ids;
    }

    return collectExpandedIds(tree);
  }, [expandedState, tree]);

  const expandedIdSet = useMemo(() => new Set(expandedIds), [expandedIds]);

  const pendingDelete = useMemo(
    () => (tree && pendingDeleteId ? findTreeNode(tree, pendingDeleteId) : undefined),
    [tree, pendingDeleteId],
  );

  const dialogParent = useMemo(() => {
    if (!tree || dialog?.type !== 'add') {
      return undefined;
    }

    return findTreeNode(tree, dialog.parentId);
  }, [tree, dialog]);

  const dialogNode = useMemo(() => {
    if (!tree || dialog?.type !== 'edit') {
      return undefined;
    }

    return findTreeNode(tree, dialog.nodeId);
  }, [tree, dialog]);

  const formDefaults = useMemo((): ItemFormValues => {
    if (dialog?.type === 'edit' && dialogNode) {
      return {
        name: dialogNode.name,
        icon: dialogNode.icon ?? '',
        description: dialogNode.description ?? '',
        color: dialogNode.color ?? defaultItemFormValues.color,
      };
    }

    if (dialog?.type === 'add' && wheel) {
      return {
        ...defaultItemFormValues,
        color: colorForIndex(siblingCount(wheel, dialog.parentId)),
      };
    }

    return defaultItemFormValues;
  }, [dialog, dialogNode, wheel]);

  const toggleExpand = useCallback(
    (id: string) => {
      if (!tree) {
        return;
      }

      const current = expandedState?.wheelId === tree.id ? expandedState.ids : collectExpandedIds(tree);
      const next = current.includes(id)
        ? current.filter((itemId) => itemId !== id)
        : [...current, id];
      setExpandedState({ wheelId: tree.id, ids: next });
    },
    [expandedState, tree],
  );

  const ensureExpanded = useCallback(
    (id: string) => {
      if (!tree) {
        return;
      }

      const current = expandedState?.wheelId === tree.id ? expandedState.ids : collectExpandedIds(tree);
      if (current.includes(id)) {
        return;
      }

      setExpandedState({ wheelId: tree.id, ids: [...current, id] });
    },
    [expandedState, tree],
  );

  const openAddChild = useCallback((parentId: string) => {
    setDialog({ type: 'add', parentId });
  }, []);

  const openEdit = useCallback((nodeId: string) => {
    setDialog({ type: 'edit', nodeId });
  }, []);

  const closeDialog = useCallback(() => {
    setDialog(null);
  }, []);

  const submitDialog = useCallback(
    (values: ItemFormValues) => {
      if (!wheel || !dialog) {
        return;
      }

      if (dialog.type === 'add') {
        addChildItem(dialog.parentId, toItemDraft(values, siblingCount(wheel, dialog.parentId)));
        ensureExpanded(dialog.parentId);
        setDialog(null);
        return;
      }

      const node = findTreeNode(toEditorTree(wheel), dialog.nodeId);
      if (!node) {
        setDialog(null);
        return;
      }

      if (node.kind === TREE_NODE_KIND.wheel) {
        updateWheel(wheel.id, {
          name: values.name,
          icon: values.icon || undefined,
          description: values.description || undefined,
        });
      } else {
        updateChildItem(dialog.nodeId, {
          name: values.name,
          icon: values.icon || undefined,
          description: values.description || undefined,
          color: toHexColor(values.color),
        });
      }

      setDialog(null);
    },
    [addChildItem, dialog, ensureExpanded, updateChildItem, updateWheel, wheel],
  );

  const requestDelete = useCallback(
    (itemId: WheelItemId) => {
      if (!wheel || itemId === wheel.id) {
        return;
      }

      if (confirmBeforeDelete) {
        setPendingDeleteId(itemId);
        return;
      }

      deleteChildItem(itemId);
    },
    [confirmBeforeDelete, deleteChildItem, wheel],
  );

  const confirmDelete = useCallback(() => {
    if (pendingDeleteId) {
      deleteChildItem(pendingDeleteId);
    }
    setPendingDeleteId(null);
  }, [deleteChildItem, pendingDeleteId]);

  const cancelDelete = useCallback(() => {
    setPendingDeleteId(null);
  }, []);

  const toggleEnabled = useCallback(
    (itemId: WheelItemId) => {
      if (!wheel || itemId === wheel.id) {
        return;
      }

      toggleItem(wheel.id, itemId);
    },
    [toggleItem, wheel],
  );

  const duplicate = useCallback(
    (itemId: WheelItemId) => {
      if (!wheel || itemId === wheel.id) {
        return;
      }

      duplicateItem(wheel.id, itemId);
    },
    [duplicateItem, wheel],
  );

  const goToCreate = useCallback(() => {
    void navigate(ROUTES.createWheel);
  }, [navigate]);

  const goToDashboard = useCallback(() => {
    void navigate(ROUTES.dashboard);
  }, [navigate]);

  return {
    wheel,
    tree,
    expandedIds: expandedIdSet,
    hasWheel: Boolean(wheel),
    isMissingWheel: Boolean(requestedId) && !wheel,
    dialog,
    dialogParent,
    dialogNode,
    formDefaults,
    showColorField: dialog?.type === 'add' || dialogNode?.kind === TREE_NODE_KIND.item,
    pendingDelete,
    toggleExpand,
    openAddChild,
    openEdit,
    closeDialog,
    submitDialog,
    requestDelete,
    confirmDelete,
    cancelDelete,
    toggleEnabled,
    duplicate,
    goToCreate,
    goToDashboard,
  };
}

function siblingCount(wheel: Wheel, parentId: string): number {
  if (parentId === wheel.id) {
    return wheel.items.length;
  }

  return findItem(wheel.items, parentId)?.children?.length ?? 0;
}

function toHexColor(value: string): HexColor | undefined {
  return value.startsWith('#') ? (value as HexColor) : undefined;
}
