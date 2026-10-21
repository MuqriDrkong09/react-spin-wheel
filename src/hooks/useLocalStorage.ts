import { useCallback, useState } from 'react';

import { storageService } from '@/services/storage/storageService';

export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
): [T, (value: T | ((current: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    const stored = storageService.readJson<T>(key);
    return stored ?? defaultValue;
  });

  const setStoredValue = useCallback(
    (next: T | ((current: T) => T)) => {
      setValue((current) => {
        const resolved = typeof next === 'function' ? (next as (current: T) => T)(current) : next;
        storageService.writeJson(key, resolved);
        return resolved;
      });
    },
    [key],
  );

  return [value, setStoredValue];
}
