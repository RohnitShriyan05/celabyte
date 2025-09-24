// src/utils/cache.ts
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class FastCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private defaultTTL: number;
  private maxSize: number;

  constructor(defaultTTL = 5 * 60 * 1000, maxSize = 1000) {
    this.defaultTTL = defaultTTL;
    this.maxSize = maxSize;
  }

  set(key: string, data: T, ttl?: number): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (LRU behavior)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  // Clean expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instances
export const schemaCache = new FastCache<{
  columns: string[];
  sampleData: any[];
}>(
  5 * 60 * 1000, // 5 minutes TTL
  500 // Max 500 schema entries
);

export const queryCache = new FastCache<any>(
  2 * 60 * 1000, // 2 minutes TTL
  200 // Max 200 query results
);

export const responseCache = new FastCache<string>(
  10 * 60 * 1000, // 10 minutes TTL
  100 // Max 100 responses
);

// Cleanup expired entries every 5 minutes
setInterval(() => {
  schemaCache.cleanup();
  queryCache.cleanup();
  responseCache.cleanup();
}, 5 * 60 * 1000);

export { FastCache };
