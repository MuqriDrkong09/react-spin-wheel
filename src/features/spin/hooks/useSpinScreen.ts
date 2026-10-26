import { useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { ROUTES, withWheelId } from '@/constants/routes';
import { useSpinWheel } from '@/features/spin/hooks/useSpinWheel';
import { useWheelStore } from '@/stores/wheelStore';
import type { Wheel, WheelId } from '@/types/wheel';

export function useSpinScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedId = searchParams.get('wheelId');
  const wheels = useWheelStore((state) => state.wheels);
  const activeWheelId = useWheelStore((state) => state.activeWheelId);
  const setActiveWheel = useWheelStore((state) => state.setActiveWheel);

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

  const spin = useSpinWheel(wheel?.items ?? [], {
    wheelSettings: wheel?.settings,
  });

  return {
    wheel,
    availableWheels,
    needsWheelChoice,
    isMissingWheel: Boolean(requestedId && !wheel),
    spin,
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
