import { useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { ROUTES, withWheelId } from '@/constants/routes';
import { useWheelStore } from '@/stores/wheelStore';
import type { SelectionMode, Wheel, WheelId } from '@/types/wheel';

export function useSpinScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedId = searchParams.get('wheelId');
  const wheels = useWheelStore((state) => state.wheels);
  const activeWheelId = useWheelStore((state) => state.activeWheelId);
  const setActiveWheel = useWheelStore((state) => state.setActiveWheel);
  const updateWheelSettings = useWheelStore((state) => state.updateWheelSettings);

  const wheelId = requestedId;
  const wheel = useMemo(
    () => (wheelId ? wheels.find((entry) => entry.id === wheelId) : undefined),
    [wheelId, wheels],
  );
  const availableWheels = useMemo(() => sortWheelsForPicker(wheels), [wheels]);
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
    isMissingWheel: Boolean(requestedId && !wheel),
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
