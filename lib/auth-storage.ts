type BrowserStorage = Pick<Storage, 'getItem'|'setItem'|'removeItem'>;
/** Keep the SDK's refreshable session without an app-imposed expiry. */
export function persistentAuthStorage(storage: BrowserStorage) {
  return {
    getItem(key: string) {
      const raw = storage.getItem(key);
      if (!raw) return raw;
      try {
        const previous = JSON.parse(raw);
        // Upgrade sessions saved by the old 30-day adapter without signing users out.
        // Supabase still validates and refreshes the underlying session normally.
        if (previous && typeof previous.value === 'string' &&
            typeof previous.expiresAt === 'number' && typeof previous.sessionId === 'string') {
          try { storage.setItem(key, previous.value); } catch {}
          return previous.value;
        }
      } catch { /* Auxiliary SDK values can be plain strings. */ }
      return raw;
    },
    setItem(key: string, value: string) { storage.setItem(key, value); },
    removeItem(key: string) { storage.removeItem(key); },
  };
}
