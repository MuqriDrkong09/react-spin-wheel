import type { Wheel } from '@/types/wheel';

/** Structural guard for wheels loaded from storage, import, or share. */
export function isUsableWheel(wheel: Wheel | null | undefined): wheel is Wheel {
  return Boolean(
    wheel &&
      typeof wheel.id === 'string' &&
      wheel.id.length > 0 &&
      typeof wheel.name === 'string' &&
      wheel.name.trim().length > 0 &&
      Array.isArray(wheel.items) &&
      wheel.settings &&
      typeof wheel.settings === 'object',
  );
}
