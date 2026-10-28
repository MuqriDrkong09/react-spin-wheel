import { createContext } from 'react';

import type { SoundId } from '@/types/sound';

export interface SoundContextValue {
  play: (id: SoundId) => boolean;
  unlock: () => Promise<boolean>;
  preview: () => void;
}

export const SoundContext = createContext<SoundContextValue>({
  play: () => false,
  unlock: async () => false,
  preview: () => undefined,
});
