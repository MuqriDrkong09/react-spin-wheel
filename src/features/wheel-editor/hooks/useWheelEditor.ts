import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { ROUTES } from '@/constants/routes';
import { EDITOR_MESSAGES } from '@/features/wheel-editor/constants';
import type { ItemFormValues } from '@/features/wheel-editor/schema';
import { defaultItemFormValues } from '@/features/wheel-editor/schema';
import { colorForIndex, toItemDraft, toItemPatch } from '@/features/wheel-editor/utils/itemDraft';
import {
  collectExpandedIds,
  findTreeNode,
  toEditorTree,
  TREE_NODE_KIND,
} from '@/features/wheel-editor/utils/toEditorTree';
import { persistStores } from '@/services/storage/storePersistence';
import { useWheelStore } from '@/stores/wheelStore';
import type { Wheel, WheelItemId } from '@/types/wheel';
import { findItem, type ItemMove } from '@/utils/wheelTree';

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
  const addItem = useWheelStore((state) => state.addItem);
  const addChildItem = useWheelStore((state) => state.addChildItem);
  const updateChildItem = useWheelStore((state) => state.updateChildItem);
  const deleteChildItem = useWheelStore((state) => state.deleteChildItem);
  const duplicateItem = useWheelStore((state) => state.duplicateItem);
  const toggleItem = useWheelStore((state) => state.toggleItem);
  const updateWheel = useWheelStore((state) => state.updateWheel);
  const moveItemInStore = useWheelStore((state) => state.moveItem);

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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
        weight: dialogNode.weight,
        enabled: dialogNode.enabled,
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

  const clearSuccessMessage = useCallback(() => {
    setSuccessMessage(null);
  }, []);

  const addMainItem = useCallback(
    (values: ItemFormValues) => {
      if (!wheel) {
        return;
      }

      const created = addItem(wheel.id, toItemDraft(values, wheel.items.length));
      if (!created) {
        return;
      }

      ensureExpanded(wheel.id);
      setSuccessMessage(EDITOR_MESSAGES.itemAdded(created.name));
    },
    [addItem, ensureExpanded, wheel],
  );

  const submitDialog = useCallback(
    (values: ItemFormValues) => {
      if (!wheel || !dialog) {
        return;
      }

      if (dialog.type === 'add') {
        const parent = findTreeNode(toEditorTree(wheel), dialog.parentId);
        const created = addChildItem(
          dialog.parentId,
          toItemDraft(values, siblingCount(wheel, dialog.parentId)),
        );
        ensureExpanded(dialog.parentId);
        if (created && parent) {
          setSuccessMessage(EDITOR_MESSAGES.childAdded(created.name, parent.name));
        }
        setDialog(null);
        return;
      }

      const node = findTreeNode(toEditorTree(wheel), dialog.nodeId);
      if (!node) {
        setDialog(null);
        return;
      }

      if (node.kind === TREE_NODE_KIND.wheel) {
        const patch = toItemPatch(values);
        updateWheel(wheel.id, {
          name: patch.name,
          icon: patch.icon,
          description: patch.description,
        });
      } else {
        const updated = updateChildItem(dialog.nodeId, toItemPatch(values));
        if (updated) {
          setSuccessMessage(EDITOR_MESSAGES.itemUpdated(updated.name));
        }
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

      setPendingDeleteId(itemId);
    },
    [wheel],
  );

  const confirmDelete = useCallback(() => {
    if (pendingDeleteId) {
      deleteChildItem(pendingDeleteId);
      persistStores();
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

  const moveItem = useCallback(
    (move: ItemMove) => {
      if (!wheel) {
        return;
      }

      const moved = moveItemInStore(wheel.id, move.itemId, move.targetParentId, move.index);
      if (!moved) {
        return;
      }

      ensureExpanded(move.targetParentId ?? wheel.id);
      persistStores();
    },
    [ensureExpanded, moveItemInStore, wheel],
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
    successMessage,
    pendingDelete,
    toggleExpand,
    addMainItem,
    clearSuccessMessage,
    openAddChild,
    openEdit,
    closeDialog,
    submitDialog,
    requestDelete,
    confirmDelete,
    cancelDelete,
    toggleEnabled,
    duplicate,
    moveItem,
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
