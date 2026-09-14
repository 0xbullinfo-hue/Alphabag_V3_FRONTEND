import { useCallback, useState } from 'react';

/**
 * Persist a value to sessionStorage with a TTL.
 */
export function useSessionStorage<T>(
  key: string,
  initial: T,
  ttlMs: number = 30 * 60 * 1000,
): [T, (v: T) => void, () => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) return initial;
      const parsed = JSON.parse(raw) as { v: T; exp: number };
      if (Date.now() > parsed.exp) {
        sessionStorage.removeItem(key);
        return initial;
      }
      return parsed.v;
    } catch {
      return initial;
    }
  });

  const set = useCallback(
    (v: T) => {
      setValue(v);
      try {
        sessionStorage.setItem(key, JSON.stringify({ v, exp: Date.now() + ttlMs }));
      } catch { /* degrade to memory */ }
    },
    [key, ttlMs],
  );

  const clear = useCallback(() => {
    setValue(initial);
    try { sessionStorage.removeItem(key); } catch { /* ignore */ }
  }, [key, initial]);

  return [value, set, clear];
}
