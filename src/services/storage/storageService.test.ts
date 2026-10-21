import { storageService } from './storageService';

describe('storageService', () => {
  beforeEach(() => {
    window.localStorage.clear();
    storageService.clearMemory();
  });

  it('writes and reads JSON values', () => {
    expect(storageService.writeJson('spinflow-test', { ok: true })).toBe(true);
    expect(storageService.readJson<{ ok: boolean }>('spinflow-test')).toEqual({ ok: true });
  });

  it('returns null for missing or corrupted JSON', () => {
    expect(storageService.readJson('missing')).toBeNull();
    window.localStorage.setItem('broken', '{not-json');
    expect(storageService.readJson('broken')).toBeNull();
  });

  it('falls back to memory when localStorage is unavailable', () => {
    const original = window.localStorage;
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('blocked');
      },
    });

    expect(storageService.isAvailable()).toBe(false);
    expect(storageService.setRaw('theme', 'dark')).toBe(false);
    expect(storageService.getRaw('theme')).toBe('dark');
    expect(storageService.remove('theme')).toBe(false);
    expect(storageService.getRaw('theme')).toBeNull();

    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: original,
    });
  });
});
