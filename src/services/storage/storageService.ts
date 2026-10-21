const memoryStore = new Map<string, string>();

function getLocalStorage(): Storage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }

    const probeKey = '__spinflow_storage_probe__';
    window.localStorage.setItem(probeKey, '1');
    window.localStorage.removeItem(probeKey);
    return window.localStorage;
  } catch {
    return null;
  }
}

export const storageService = {
  isAvailable(): boolean {
    return getLocalStorage() !== null;
  },

  getRaw(key: string): string | null {
    try {
      const storage = getLocalStorage();
      if (storage) {
        return storage.getItem(key);
      }
    } catch {
      // Fall through to memory.
    }

    return memoryStore.get(key) ?? null;
  },

  setRaw(key: string, value: string): boolean {
    try {
      const storage = getLocalStorage();
      if (storage) {
        storage.setItem(key, value);
        memoryStore.delete(key);
        return true;
      }
    } catch {
      // Fall through to memory.
    }

    memoryStore.set(key, value);
    return false;
  },

  remove(key: string): boolean {
    let removed = false;

    try {
      const storage = getLocalStorage();
      if (storage) {
        storage.removeItem(key);
        removed = true;
      }
    } catch {
      // Fall through to memory.
    }

    memoryStore.delete(key);
    return removed;
  },

  readJson<T>(key: string): T | null {
    const raw = storageService.getRaw(key);
    if (raw === null) {
      return null;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  writeJson(key: string, value: unknown): boolean {
    try {
      return storageService.setRaw(key, JSON.stringify(value));
    } catch {
      return false;
    }
  },

  clearMemory(): void {
    memoryStore.clear();
  },
};
