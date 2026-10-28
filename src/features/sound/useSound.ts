import { useContext } from 'react';

import { SoundContext } from '@/features/sound/soundContext';

export function useSound() {
  return useContext(SoundContext);
}
