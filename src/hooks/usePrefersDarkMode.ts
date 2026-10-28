import { useEffect, useState } from 'react';

import { COLOR_SCHEME_QUERY } from '@/constants/colorMode';
import { getPrefersDarkMode } from '@/app/theme/resolvePaletteMode';

export function usePrefersDarkMode(): boolean {
  const [prefersDark, setPrefersDark] = useState(getPrefersDarkMode);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const media = window.matchMedia(COLOR_SCHEME_QUERY);

    function handleChange(event: MediaQueryListEvent) {
      setPrefersDark(event.matches);
    }

    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  return prefersDark;
}
