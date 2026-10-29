import { renderHook } from '@testing-library/react';

import { useSound } from '@/features/sound/useSound';
import { SOUND_ID } from '@/types/sound';

describe('SoundContext', () => {
  it('defaults to no-op play, unlock, and preview helpers', async () => {
    const { result } = renderHook(() => useSound());

    expect(result.current.play(SOUND_ID.spinStart)).toBe(false);
    await expect(result.current.unlock()).resolves.toBe(false);
    expect(result.current.preview()).toBeUndefined();
  });
});
