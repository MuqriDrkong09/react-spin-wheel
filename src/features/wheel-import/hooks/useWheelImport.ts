import { useCallback, useRef, useState, type ChangeEvent, type DragEvent } from 'react';

import { IMPORT_MESSAGES } from '@/features/wheel-import/constants';
import { importWheelNameSchema } from '@/features/wheel-import/schema';
import type { WheelImportDocument, WheelImportStatus } from '@/features/wheel-import/types';
import { parseImportedWheelFile } from '@/features/wheel-import/utils/parseImportedWheel';
import {
  collectExistingIds,
  toCreateWheelInputFromImport,
  uniqueImportedName,
} from '@/features/wheel-import/utils/toCreateWheelInputFromImport';
import { persistStores } from '@/services/storage/storePersistence';
import { useWheelStore } from '@/stores/wheelStore';

export function useWheelImport() {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const createWheel = useWheelStore((state) => state.createWheel);
  const wheels = useWheelStore((state) => state.wheels);

  const [dragging, setDragging] = useState(false);
  const [pendingDocument, setPendingDocument] = useState<WheelImportDocument | null>(null);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [status, setStatus] = useState<WheelImportStatus | null>(null);

  const openFilePicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const importFile = useCallback(
    async (file: File | undefined) => {
      if (!file) {
        return;
      }

      const result = await parseImportedWheelFile(file);
      if (!result.ok) {
        setPendingDocument(null);
        setStatus({ severity: 'error', message: result.error });
        return;
      }

      setPendingDocument(result.document);
      setName(uniqueImportedName(result.document.name, wheels.map((wheel) => wheel.name)));
      setNameError(null);
      setStatus(null);
    },
    [wheels],
  );

  const onInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      void importFile(file);
    },
    [importFile],
  );

  const onDragEnter = useCallback((event: DragEvent) => {
    event.preventDefault();
    dragDepth.current += 1;
    setDragging(true);
  }, []);

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDragLeave = useCallback((event: DragEvent) => {
    event.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) {
      setDragging(false);
    }
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      dragDepth.current = 0;
      setDragging(false);
      const files = event.dataTransfer.files;
      const file = files.item?.(0) ?? files[0];
      void importFile(file);
    },
    [importFile],
  );

  const cancelImport = useCallback(() => {
    setPendingDocument(null);
    setNameError(null);
  }, []);

  const confirmImport = useCallback(() => {
    if (!pendingDocument) {
      return false;
    }

    const parsedName = importWheelNameSchema.safeParse(name);
    if (!parsedName.success) {
      setNameError(IMPORT_MESSAGES.nameRequired);
      return false;
    }

    const wheel = createWheel(
      toCreateWheelInputFromImport(pendingDocument, parsedName.data, collectExistingIds(wheels)),
    );
    persistStores();
    setPendingDocument(null);
    setNameError(null);
    setStatus({ severity: 'success', message: IMPORT_MESSAGES.success(wheel.name) });
    return true;
  }, [createWheel, name, pendingDocument, wheels]);

  const clearStatus = useCallback(() => {
    setStatus(null);
  }, []);

  return {
    inputRef,
    dragging,
    pendingDocument,
    name,
    setName,
    nameError,
    status,
    openFilePicker,
    importFile,
    onInputChange,
    onDragEnter,
    onDragOver,
    onDragLeave,
    onDrop,
    cancelImport,
    confirmImport,
    clearStatus,
  };
}
