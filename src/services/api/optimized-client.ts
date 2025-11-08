// Optimized API Client with Caching and Deduplication
// DEFERRED: Will be used when mobile app is implemented

/**
 * HTTP cache configuration
 */
interface CacheConfig {
  ttl: number;
  methods: string[];
}

/**
 * Pending request tracker for deduplication
 */
const pendingRequests = new Map<string, Promise<any>>();

/**
 * Simple HTTP cache (in-memory)
 */
const httpCache = new Map<
  string,
  {
    data: any;
    timestamp: number;
    etag?: string;
  }
>();

/**
 * Default cache configuration
 */
const DEFAULT_CACHE_CONFIG: CacheConfig = {
  ttl: 5 * 60 * 1000, // 5 minutes
  methods: ['GET'], // Only cache GET requests
};

/**
 * Optimized API client with request deduplication and HTTP caching.
 */
export class OptimizedApiClient {
  private baseURL: string;
  private timeout: number;
  private cacheConfig: CacheConfig;

  constructor(baseURL: string, timeout: number = 10000) {
    this.baseURL = baseURL;
    this.timeout = timeout;
    this.cacheConfig = DEFAULT_CACHE_CONFIG;
  }

  /**
   * Perform a GET request with caching and deduplication
   * @param url - API endpoint
   * @param config - Request configuration
   * @returns Response data
   */
  async get<T>(url: string, config: RequestInit = {}): Promise<T> {
    const fullUrl = `${this.baseURL}${url}`;
    const cacheKey = this.getCacheKey('GET', url, config);

    // Check cache first
    const cachedData = this.getFromCache<T>(cacheKey);
    if (cachedData !== null) {
      console.log(`[API] Cache hit: ${url}`);
      return cachedData;
    }

    // Check for pending request (deduplication)
    if (pendingRequests.has(cacheKey)) {
      console.log(`[API] Deduplicating request: ${url}`);
      return pendingRequests.get(cacheKey)!;
    }

    // Make new request
    const request = this.makeRequest<T>('GET', fullUrl, config).finally(() => {
      pendingRequests.delete(cacheKey);
    });

    pendingRequests.set(cacheKey, request);
    return request;
  }

  /**
   * Perform a POST request (no caching)
   * @param url - API endpoint
   * @param data - Request body
   * @param config - Request configuration
   * @returns Response data
   */
  async post<T>(url: string, data: any, config: RequestInit = {}): Promise<T> {
    const fullUrl = `${this.baseURL}${url}`;
    return this.makeRequest<T>('POST', fullUrl, {
      ...config,
      body: JSON.stringify(data),
    });
  }

  /**
   * Perform a PUT request (no caching)
   * @param url - API endpoint
   * @param data - Request body
   * @param config - Request configuration
   * @returns Response data
   */
  async put<T>(url: string, data: any, config: RequestInit = {}): Promise<T> {
    const fullUrl = `${this.baseURL}${url}`;
    return this.makeRequest<T>('PUT', fullUrl, {
      ...config,
      body: JSON.stringify(data),
    });
  }

  /**
   * Perform a DELETE request (no caching)
   * @param url - API endpoint
   * @param config - Request configuration
   * @returns Response data
   */
  async delete<T>(url: string, config: RequestInit = {}): Promise<T> {
    const fullUrl = `${this.baseURL}${url}`;
    return this.makeRequest<T>('DELETE', fullUrl, config);
  }

  /**
   * Batch multiple GET requests
   * @param urls - Array of URLs to fetch
   * @returns Array of responses
   */
  async batchGet<T>(urls: string[]): Promise<T[]> {
    return Promise.all(urls.map((url) => this.get<T>(url)));
  }

  /**
   * Prefetch a URL for predictive loading (silent fail)
   * @param url - URL to prefetch
   */
  prefetch(url: string): void {
    this.get(url).catch(() => {
      // Silent fail for prefetch
    });
  }

  /**
   * Invalidate cache for a specific URL or pattern
   * @param urlPattern - URL or pattern to invalidate
   */
  invalidateCache(urlPattern: string): void {
    for (const key of httpCache.keys()) {
      if (key.includes(urlPattern)) {
        httpCache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    httpCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    keys: string[];
  } {
    return {
      size: httpCache.size,
      keys: Array.from(httpCache.keys()),
    };
  }

  /**
   * Make HTTP request with timeout
   */
  private async makeRequest<T>(
    method: string,
    url: string,
    config: RequestInit
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...config,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Cache GET requests
      if (method === 'GET' && this.cacheConfig.methods.includes('GET')) {
        const cacheKey = this.getCacheKey(method, url, config);
        const etag = response.headers.get('etag') || undefined;

        httpCache.set(cacheKey, {
          data,
          timestamp: Date.now(),
          etag,
        });
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout: ${url}`);
        }
        throw error;
      }

      throw new Error('Unknown error occurred');
    }
  }

  /**
   * Generate cache key from request parameters
   */
  private getCacheKey(method: string, url: string, config: RequestInit): string {
    return `${method}:${url}:${JSON.stringify(config.headers || {})}`;
  }

  /**
   * Get data from cache if not expired
   */
  private getFromCache<T>(cacheKey: string): T | null {
    const cached = httpCache.get(cacheKey);

    if (!cached) {
      return null;
    }

    const now = Date.now();
    const age = now - cached.timestamp;

    if (age > this.cacheConfig.ttl) {
      httpCache.delete(cacheKey);
      return null;
    }

    return cached.data;
  }
}

/**
 * Global optimized API client instance
 */
export const optimizedApiClient = new OptimizedApiClient(
  process.env.EXPO_PUBLIC_API_URL || 'https://api.mobvibe.com'
);

/**
 * Example usage:
 *
 * // GET request with caching
 * const sessions = await optimizedApiClient.get<Session[]>('/sessions');
 *
 * // POST request (no caching)
 * const newSession = await optimizedApiClient.post<Session>('/sessions', {
 *   prompt: 'Create a counter app',
 * });
 *
 * // Batch requests
 * const [sessions, profile] = await optimizedApiClient.batchGet([
 *   '/sessions',
 *   '/profile',
 * ]);
 *
 * // Prefetch for predictive loading
 * optimizedApiClient.prefetch('/sessions/123');
 *
 * // Invalidate cache
 * optimizedApiClient.invalidateCache('/sessions');
 */
