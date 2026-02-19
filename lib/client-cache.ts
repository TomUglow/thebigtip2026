/**
 * Simple sessionStorage-backed client cache.
 * Data persists within a browser session (cleared on tab close / hard refresh).
 * TTL is optional — omit or pass 0 to cache for the whole session with no expiry.
 */

interface CacheEntry<T> {
  data: T
  expiresAt: number // 0 = never expires within session
}

export const clientCache = {
  get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null
    try {
      const raw = sessionStorage.getItem(key)
      if (!raw) return null
      const entry: CacheEntry<T> = JSON.parse(raw)
      if (entry.expiresAt !== 0 && entry.expiresAt < Date.now()) {
        sessionStorage.removeItem(key)
        return null
      }
      return entry.data
    } catch {
      return null
    }
  },

  set<T>(key: string, data: T, ttlMs = 0) {
    if (typeof window === 'undefined') return
    try {
      const entry: CacheEntry<T> = {
        data,
        expiresAt: ttlMs > 0 ? Date.now() + ttlMs : 0,
      }
      sessionStorage.setItem(key, JSON.stringify(entry))
    } catch {
      // Ignore quota errors
    }
  },

  invalidate(key: string) {
    if (typeof window === 'undefined') return
    try { sessionStorage.removeItem(key) } catch {}
  },

  invalidatePrefix(prefix: string) {
    if (typeof window === 'undefined') return
    try {
      Object.keys(sessionStorage)
        .filter((k) => k.startsWith(prefix))
        .forEach((k) => sessionStorage.removeItem(k))
    } catch {}
  },
}
