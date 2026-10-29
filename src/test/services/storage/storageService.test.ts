import { storageService } from '@/services/storage/storageService';

const originalLocalStorage = window.localStorage;

function restoreLocalStorage() {
  vi.unstubAllGlobals();
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    writable: true,
    value: originalLocalStorage,
  });
  originalLocalStorage.clear();
  storageService.clearMemory();
}

function stubLocalStorage(overrides: Partial<Storage> = {}) {
  const store = new Map<string, string>();

  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      get length() {
        return store.size;
      },
      clear: () => store.clear(),
      getItem: (key: string) => store.get(key) ?? null,
      key: (index: number) => [...store.keys()][index] ?? null,
      removeItem: (key: string) => {
        store.delete(key);
      },
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      ...overrides,
    } as Storage,
  });
}

describe('storageService', () => {
  beforeEach(() => {
    restoreLocalStorage();
  });

  afterEach(() => {
    restoreLocalStorage();
  });

  it('writes and reads JSON values', () => {
    expect(storageService.isAvailable()).toBe(true);
    expect(storageService.writeJson('spinflow-test', { ok: true })).toBe(true);
    expect(storageService.readJson<{ ok: boolean }>('spinflow-test')).toEqual({ ok: true });
    expect(storageService.remove('spinflow-test')).toBe(true);
    expect(storageService.readJson('spinflow-test')).toBeNull();
  });

  it('returns null for missing or corrupted JSON', () => {
    expect(storageService.readJson('missing')).toBeNull();
    window.localStorage.setItem('broken', '{not-json');
    expect(storageService.readJson('broken')).toBeNull();
  });

  it('returns false when JSON cannot be stringified', () => {
    const cyclic: { self?: unknown } = {};
    cyclic.self = cyclic;

    expect(storageService.writeJson('cycle', cyclic)).toBe(false);
  });

  it('falls back to memory when localStorage access throws', () => {
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
  });

  it('falls back to memory when window or localStorage is missing', () => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      writable: true,
      value: undefined,
    });

    expect(storageService.isAvailable()).toBe(false);
    expect(storageService.setRaw('theme', 'dark')).toBe(false);
    expect(storageService.getRaw('theme')).toBe('dark');

    vi.stubGlobal('window', undefined);
    expect(storageService.isAvailable()).toBe(false);
    expect(storageService.getRaw('theme')).toBe('dark');
  });

  it('replaces a memory value once localStorage is available again', () => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      writable: true,
      value: undefined,
    });
    expect(storageService.setRaw('theme', 'memory')).toBe(false);

    restoreLocalStorage();
    expect(storageService.setRaw('theme', 'disk')).toBe(true);
    expect(window.localStorage.getItem('theme')).toBe('disk');

    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      writable: true,
      value: undefined,
    });
    expect(storageService.getRaw('theme')).toBeNull();
  });

  it('falls back to memory when getItem, setItem, or removeItem throw', () => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      writable: true,
      value: undefined,
    });
    expect(storageService.setRaw('theme', 'memory-read')).toBe(false);

    stubLocalStorage({
      getItem: () => {
        throw new Error('read failed');
      },
    });
    expect(storageService.getRaw('theme')).toBe('memory-read');

    stubLocalStorage({
      setItem: (key: string) => {
        if (key === '__spinflow_storage_probe__') {
          return;
        }
        throw new Error('quota');
      },
    });
    expect(storageService.setRaw('theme', 'memory-write')).toBe(false);

    stubLocalStorage({
      removeItem: (key: string) => {
        if (key === '__spinflow_storage_probe__') {
          return;
        }
        throw new Error('remove failed');
      },
    });
    expect(storageService.remove('theme')).toBe(false);
  });
});
