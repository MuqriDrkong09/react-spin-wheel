import { useEffect, useState } from 'react';

import { REDUCED_MOTION_QUERY } from '@/constants/motion';

export function getPrefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia(REDUCED_MOTION_QUERY).matches
  );
}

export function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(getPrefersReducedMotion);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const media = window.matchMedia(REDUCED_MOTION_QUERY);

    function handleChange(event: MediaQueryListEvent) {
      setPrefersReduced(event.matches);
    }

    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  return prefersReduced;
}
