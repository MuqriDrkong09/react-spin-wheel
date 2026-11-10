import { useCallback, useState } from 'react';

import { EXPORT_MESSAGES } from '@/features/wheel-export/constants';
import type { WheelExportStatus } from '@/features/wheel-export/types';
import { createWheelExport } from '@/features/wheel-export/utils/createWheelExport';
import { downloadJsonFile } from '@/features/wheel-export/utils/downloadJsonFile';
import { useWheelStore } from '@/stores/wheelStore';
import type { Wheel, WheelId } from '@/types/wheel';

export function useWheelExport() {
  const [status, setStatus] = useState<WheelExportStatus | null>(null);

  const exportWheel = useCallback((wheel: Wheel) => {
    const result = createWheelExport(wheel);
    if (!result.ok) {
      setStatus({ severity: 'error', message: result.error });
      return false;
    }

    if (downloadJsonFile(result.filename, result.json) === false) {
      setStatus({ severity: 'error', message: EXPORT_MESSAGES.downloadFailed });
      return false;
    }

    setStatus({
      severity: 'success',
      message: EXPORT_MESSAGES.success(wheel.name, result.filename),
    });
    return true;
  }, []);

  const exportWheelById = useCallback(
    (wheelId: WheelId) => {
      const wheel = useWheelStore.getState().getWheel(wheelId);
      if (!wheel) {
        setStatus({ severity: 'error', message: EXPORT_MESSAGES.notFound });
        return false;
      }

      return exportWheel(wheel);
    },
    [exportWheel],
  );

  const clearStatus = useCallback(() => {
    setStatus(null);
  }, []);

  return {
    exportWheel,
    exportWheelById,
    status,
    clearStatus,
  };
}
