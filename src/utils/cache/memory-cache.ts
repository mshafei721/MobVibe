// In-Memory Cache with TTL and Size Limits
// DEFERRED: Will be used when mobile app is implemented

/**
 * Cache entry with data and metadata
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hits: number;
}

/**
 * Memory cache options
 */
export interface MemoryCacheOptions {
  maxSize?: number;
  ttl?: number;
  onEvict?: (key: string, data: any) => void;
}

/**
 * In-memory cache with TTL and LRU eviction.
 * Automatically removes stale entries and maintains size limits.
 */
export class MemoryCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly maxSize: number;
  private readonly ttl: number;
  private readonly onEvict?: (key: string, data: T) => void;

  constructor(options: MemoryCacheOptions = {}) {
    this.maxSize = options.maxSize || 50;
    this.ttl = options.ttl || 5 * 60 * 1000; // 5 minutes default
    this.onEvict = options.onEvict;
  }

  /**
   * Set a value in the cache
   * @param key - Cache key
   * @param data - Data to cache
   */
  set(key: string, data: T): void {
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictOldest();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      hits: 0,
    });
  }

  /**
   * Get a value from the cache
   * @param key - Cache key
   * @returns Cached data or null if not found/expired
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check TTL
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }

    // Update hit count for LRU
    entry.hits++;

    return entry.data;
  }

  /**
   * Check if a key exists and is not expired
   * @param key - Cache key
   * @returns Whether the key exists
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a specific key
   * @param key - Cache key
   * @returns Whether the key was deleted
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry && this.onEvict) {
      this.onEvict(key, entry.data);
    }
    return this.cache.delete(key);
  }

  /**
   * Clear all entries
   */
  clear(): void {
    if (this.onEvict) {
      this.cache.forEach((entry, key) => {
        this.onEvict!(key, entry.data);
      });
    }
    this.cache.clear();
  }

  /**
   * Prune expired entries
   * @returns Number of entries removed
   */
  prune(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry, now)) {
        this.delete(key);
        removed++;
      }
    }

    return removed;
  }

  /**
   * Get cache statistics
   * @returns Cache stats
   */
  getStats(): {
    size: number;
    maxSize: number;
    utilizationPercent: number;
    oldestEntryAge: number;
  } {
    const now = Date.now();
    let oldestAge = 0;

    for (const entry of this.cache.values()) {
      const age = now - entry.timestamp;
      if (age > oldestAge) {
        oldestAge = age;
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      utilizationPercent: (this.cache.size / this.maxSize) * 100,
      oldestEntryAge: oldestAge,
    };
  }

  /**
   * Get all keys in the cache
   * @returns Array of cache keys
   */
  keys(): string[] {
    this.prune();
    return Array.from(this.cache.keys());
  }

  /**
   * Get all values in the cache
   * @returns Array of cache values
   */
  values(): T[] {
    this.prune();
    return Array.from(this.cache.values()).map((entry) => entry.data);
  }

  /**
   * Get cache size
   * @returns Number of entries
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Check if an entry is expired
   * @param entry - Cache entry
   * @param now - Current timestamp (optional)
   * @returns Whether the entry is expired
   */
  private isExpired(entry: CacheEntry<T>, now?: number): boolean {
    const timestamp = now || Date.now();
    return timestamp - entry.timestamp > this.ttl;
  }

  /**
   * Evict the oldest entry (LRU)
   */
  private evictOldest(): void {
    // Find entry with lowest hits (least recently used)
    let lruKey: string | null = null;
    let lruHits = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.hits < lruHits) {
        lruHits = entry.hits;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.delete(lruKey);
    }
  }
}

/**
 * Global cache instances for common use cases
 */
export const caches = {
  sessions: new MemoryCache<any>({ maxSize: 20, ttl: 10 * 60 * 1000 }),
  api: new MemoryCache<any>({ maxSize: 50, ttl: 5 * 60 * 1000 }),
  images: new MemoryCache<string>({ maxSize: 100, ttl: 15 * 60 * 1000 }),
  code: new MemoryCache<string>({ maxSize: 10, ttl: 30 * 60 * 1000 }),
};

/**
 * Clear all global caches
 */
export function clearAllCaches(): void {
  Object.values(caches).forEach((cache) => cache.clear());
  console.log('[Cache] All caches cleared');
}

/**
 * Prune all global caches
 * @returns Total number of entries removed
 */
export function pruneAllCaches(): number {
  let totalRemoved = 0;
  Object.values(caches).forEach((cache) => {
    totalRemoved += cache.prune();
  });
  console.log(`[Cache] Pruned ${totalRemoved} expired entries`);
  return totalRemoved;
}

/**
 * Example usage:
 *
 * // Create cache instance
 * const sessionCache = new MemoryCache<Session>({
 *   maxSize: 20,
 *   ttl: 10 * 60 * 1000, // 10 minutes
 *   onEvict: (key, session) => {
 *     console.log(`Session ${key} evicted`);
 *   },
 * });
 *
 * // Set data
 * sessionCache.set('session-123', sessionData);
 *
 * // Get data
 * const session = sessionCache.get('session-123');
 *
 * // Check existence
 * if (sessionCache.has('session-123')) {
 *   // ...
 * }
 *
 * // Prune expired entries
 * const removed = sessionCache.prune();
 *
 * // Get statistics
 * const stats = sessionCache.getStats();
 * console.log(`Cache utilization: ${stats.utilizationPercent}%`);
 */
