import { useAppStore } from '@/shared/stores';

export function useColorMode() {
  const colorMode = useAppStore((state) => state.colorMode);
  const setColorMode = useAppStore((state) => state.setColorMode);
  const toggleColorMode = useAppStore((state) => state.toggleColorMode);

  return {
    colorMode,
    setColorMode,
    toggleColorMode,
  };
}
