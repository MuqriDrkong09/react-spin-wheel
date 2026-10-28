import { resolvePaletteMode } from '@/app/theme/resolvePaletteMode';
import { usePrefersDarkMode } from '@/hooks/usePrefersDarkMode';
import { useAppStore } from '@/stores/appStore';

export function useColorMode() {
  const colorMode = useAppStore((state) => state.colorMode);
  const setColorMode = useAppStore((state) => state.setColorMode);
  const toggleColorMode = useAppStore((state) => state.toggleColorMode);
  const prefersDark = usePrefersDarkMode();
  const resolvedMode = resolvePaletteMode(colorMode, prefersDark);

  return {
    colorMode,
    resolvedMode,
    prefersDark,
    setColorMode,
    toggleColorMode,
  };
}
