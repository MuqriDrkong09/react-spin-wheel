import { useCallback, useState } from 'react';

import { SHARE_MESSAGES } from '@/features/wheel-share/constants';
import { wheelShareService } from '@/features/wheel-share/shareService';
import type { WheelShareStatus } from '@/features/wheel-share/types';
import { copyText } from '@/features/wheel-share/utils/copyText';
import { useWheelStore } from '@/stores/wheelStore';
import type { Wheel, WheelId } from '@/types/wheel';

export function useWheelShare() {
  const [status, setStatus] = useState<WheelShareStatus | null>(null);

  const copyShareLink = useCallback(async (wheel: Wheel) => {
    const result = wheelShareService.createShare(wheel);
    if (!result.ok) {
      setStatus({ severity: 'error', message: result.error });
      return false;
    }

    const copied = await copyText(result.url);
    if (!copied) {
      setStatus({ severity: 'error', message: SHARE_MESSAGES.copyFailed });
      return false;
    }

    setStatus({
      severity: 'success',
      message: SHARE_MESSAGES.copied(wheel.name),
    });
    return true;
  }, []);

  const copyShareLinkById = useCallback(
    async (wheelId: WheelId) => {
      const wheel = useWheelStore.getState().getWheel(wheelId);
      if (!wheel) {
        setStatus({ severity: 'error', message: SHARE_MESSAGES.notFound });
        return false;
      }

      return copyShareLink(wheel);
    },
    [copyShareLink],
  );

  const clearStatus = useCallback(() => {
    setStatus(null);
  }, []);

  return {
    copyShareLink,
    copyShareLinkById,
    status,
    clearStatus,
  };
}
