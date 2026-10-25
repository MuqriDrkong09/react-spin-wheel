import { useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { ROUTES } from '@/constants/routes';
import { useWheelStore } from '@/stores/wheelStore';

export function useSpinScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedId = searchParams.get('wheelId');
  const wheels = useWheelStore((state) => state.wheels);
  const activeWheelId = useWheelStore((state) => state.activeWheelId);
  const setActiveWheel = useWheelStore((state) => state.setActiveWheel);

  const wheelId = requestedId ?? activeWheelId;
  const wheel = useMemo(
    () => (wheelId ? wheels.find((entry) => entry.id === wheelId) : undefined),
    [wheelId, wheels],
  );

  useEffect(() => {
    if (requestedId && wheel && requestedId !== activeWheelId) {
      setActiveWheel(requestedId);
    }
  }, [activeWheelId, requestedId, setActiveWheel, wheel]);

  return {
    wheel,
    isMissingWheel: Boolean(requestedId && !wheel),
    goToCreate: () => {
      void navigate(ROUTES.createWheel);
    },
    goToDashboard: () => {
      void navigate(ROUTES.dashboard);
    },
  };
}
