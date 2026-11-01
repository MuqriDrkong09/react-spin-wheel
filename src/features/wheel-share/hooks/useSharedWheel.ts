import { useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { ROUTES } from '@/constants/routes';
import { SHARE_MESSAGES } from '@/features/wheel-share/constants';
import { wheelShareService } from '@/features/wheel-share/shareService';
import type { WheelShareStatus } from '@/features/wheel-share/types';
import { collectExistingIds } from '@/features/wheel-import/utils/toCreateWheelInputFromImport';
import { copyText } from '@/features/wheel-share/utils/copyText';
import {
  toCreateWheelInputFromShare,
  uniqueCopyName,
} from '@/features/wheel-share/utils/toCreateWheelInputFromShare';
import { persistStores } from '@/services/storage/storePersistence';
import { useWheelStore } from '@/stores/wheelStore';

export function useSharedWheel() {
  const navigate = useNavigate();
  const location = useLocation();
  const { shareId } = useParams();
  const [searchParams] = useSearchParams();
  const createWheel = useWheelStore((state) => state.createWheel);
  const wheels = useWheelStore((state) => state.wheels);
  const [status, setStatus] = useState<WheelShareStatus | null>(null);

  const search = searchParams.toString();

  const resolved = useMemo(() => {
    const reference = wheelShareService.parseLocation({ search, shareId });
    if (!reference) {
      return { ok: false as const, error: SHARE_MESSAGES.missing, reason: 'missing' as const };
    }

    return wheelShareService.resolveShare(reference);
  }, [search, shareId]);

  const copyShareLink = useCallback(async () => {
    if (!resolved.ok) {
      setStatus({ severity: 'error', message: resolved.error });
      return false;
    }

    const copied = await copyText(`${window.location.origin}${location.pathname}${location.search}`);
    if (!copied) {
      setStatus({ severity: 'error', message: SHARE_MESSAGES.copyFailed });
      return false;
    }

    setStatus({
      severity: 'success',
      message: SHARE_MESSAGES.copied(resolved.document.wheel.name),
    });
    return true;
  }, [location.pathname, location.search, resolved]);

  const saveCopy = useCallback(() => {
    if (!resolved.ok) {
      setStatus({ severity: 'error', message: resolved.error });
      return false;
    }

    const name = uniqueCopyName(
      resolved.document.wheel.name,
      wheels.map((wheel) => wheel.name),
    );
    const wheel = createWheel(
      toCreateWheelInputFromShare(resolved.document, name, collectExistingIds(wheels)),
    );
    persistStores();
    setStatus({ severity: 'success', message: SHARE_MESSAGES.saved(wheel.name) });
    void navigate(ROUTES.dashboard);
    return true;
  }, [createWheel, navigate, resolved, wheels]);

  const clearStatus = useCallback(() => {
    setStatus(null);
  }, []);

  return {
    resolved,
    status,
    copyShareLink,
    saveCopy,
    clearStatus,
    goToDashboard: () => {
      void navigate(ROUTES.dashboard);
    },
  };
}
