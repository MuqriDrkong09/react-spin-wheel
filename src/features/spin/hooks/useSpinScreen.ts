import { useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { APP_ERROR_MESSAGES } from '@/constants/errorMessages';
import { ROUTES, withWheelId } from '@/constants/routes';
import { useWheelStore } from '@/stores/wheelStore';
import type { SelectionMode, Wheel, WheelId } from '@/types/wheel';
import { isUsableWheel } from '@/utils/isUsableWheel';

export function useSpinScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedId = searchParams.get('wheelId');
  const wheels = useWheelStore((state) => state.wheels);
  const activeWheelId = useWheelStore((state) => state.activeWheelId);
  const setActiveWheel = useWheelStore((state) => state.setActiveWheel);
  const updateWheelSettings = useWheelStore((state) => state.updateWheelSettings);

  const wheelId = requestedId;
  const foundWheel = useMemo(
    () => (wheelId ? wheels.find((entry) => entry.id === wheelId) : undefined),
    [wheelId, wheels],
  );
  const wheel = isUsableWheel(foundWheel) ? foundWheel : undefined;
  const isInvalidWheel = Boolean(foundWheel && !wheel);
  const availableWheels = useMemo(
    () => sortWheelsForPicker(wheels.filter(isUsableWheel)),
    [wheels],
  );
  const needsWheelChoice = !requestedId && availableWheels.length > 0;

  useEffect(() => {
    if (requestedId && wheel && requestedId !== activeWheelId) {
      setActiveWheel(requestedId);
    }
  }, [activeWheelId, requestedId, setActiveWheel, wheel]);

  return {
    wheel,
    availableWheels,
    needsWheelChoice,
    isMissingWheel: Boolean(requestedId && !foundWheel),
    isInvalidWheel,
    invalidWheelMessage: APP_ERROR_MESSAGES.invalidWheel,
    selectWheel: (nextWheelId: WheelId) => {
      setActiveWheel(nextWheelId);
      void navigate(withWheelId(ROUTES.spin, nextWheelId));
    },
    clearWheelSelection: () => {
      void navigate(ROUTES.spin);
    },
    goToCreate: () => {
      void navigate(ROUTES.createWheel);
    },
    goToDashboard: () => {
      void navigate(ROUTES.dashboard);
    },
    setSelectionMode: (mode: SelectionMode) => {
      if (wheelId) {
        updateWheelSettings(wheelId, { selectionMode: mode });
      }
    },
    setRemoveWinner: (enabled: boolean) => {
      if (wheelId) {
        updateWheelSettings(wheelId, { removeWinner: enabled });
      }
    },
  };
}

function sortWheelsForPicker(wheels: readonly Wheel[]): Wheel[] {
  return [...wheels].sort((left, right) => {
    const updated = right.updatedAt.localeCompare(left.updatedAt);
    if (updated !== 0) {
      return updated;
    }

    return left.name.localeCompare(right.name);
  });
}
