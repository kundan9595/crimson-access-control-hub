import { useCallback, useRef, useEffect } from 'react';

// Cache entry interface
export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  version?: string;
  dependencies?: string[];
}

// Cache configuration
export interface CacheConfig {
  defaultTTL?: number;
  maxSize?: number;
  enableVersioning?: boolean;
  enableDependencies?: boolean;
  onEvict?: (key: string, entry: CacheEntry) => void;
}

// Cache statistics
export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
  evictions: number;
  memoryUsage?: number;
}

// Advanced cache hook
export function useAdvancedCache<T = any>(config: CacheConfig = {}) {
  const {
    defaultTTL = 5 * 60 * 1000, // 5 minutes
    maxSize = 1000,
    enableVersioning = false,
    enableDependencies = false,
    onEvict
  } = config;

  const cache = useRef<Map<string, CacheEntry<T>>>(new Map());
  const stats = useRef<CacheStats>({
    size: 0,
    hits: 0,
    misses: 0,
    hitRate: 0,
    evictions: 0,
  });

  // Cleanup expired entries
  const cleanup = useCallback(() => {
    const now = Date.now();
    const expiredKeys: string[] = [];

    cache.current.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => {
      const entry = cache.current.get(key);
      if (entry) {
        cache.current.delete(key);
        stats.current.evictions++;
        onEvict?.(key, entry);
      }
    });

    stats.current.size = cache.current.size;
  }, [onEvict]);

  // Evict least recently used entries if cache is full
  const evictLRU = useCallback(() => {
    if (cache.current.size <= maxSize) return;

    const entries = Array.from(cache.current.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

    const toEvict = entries.slice(0, cache.current.size - maxSize);
    toEvict.forEach(([key, entry]) => {
      cache.current.delete(key);
      stats.current.evictions++;
      onEvict?.(key, entry);
    });

    stats.current.size = cache.current.size;
  }, [maxSize, onEvict]);

  // Set cache entry
  const set = useCallback((
    key: string,
    data: T,
    options: {
      ttl?: number;
      version?: string;
      dependencies?: string[];
    } = {}
  ) => {
    const { ttl = defaultTTL, version, dependencies } = options;

    // Evict if cache is full
    if (cache.current.size >= maxSize) {
      evictLRU();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      ...(enableVersioning && version && { version }),
      ...(enableDependencies && dependencies && { dependencies }),
    };

    cache.current.set(key, entry);
    stats.current.size = cache.current.size;
  }, [defaultTTL, maxSize, enableVersioning, enableDependencies, evictLRU]);

  // Get cache entry
  const get = useCallback((key: string, version?: string): T | null => {
    const entry = cache.current.get(key);
    
    if (!entry) {
      stats.current.misses++;
      updateHitRate();
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      cache.current.delete(key);
      stats.current.misses++;
      stats.current.evictions++;
      updateHitRate();
      return null;
    }

    // Check version if enabled
    if (enableVersioning && version && entry.version !== version) {
      cache.current.delete(key);
      stats.current.misses++;
      updateHitRate();
      return null;
    }

    stats.current.hits++;
    updateHitRate();
    return entry.data;
  }, [enableVersioning]);

  // Update hit rate
  const updateHitRate = useCallback(() => {
    const total = stats.current.hits + stats.current.misses;
    stats.current.hitRate = total > 0 ? stats.current.hits / total : 0;
  }, []);

  // Invalidate cache entries
  const invalidate = useCallback((pattern: string | RegExp) => {
    const keys = Array.from(cache.current.keys());
    const matchingKeys = keys.filter(key => {
      if (typeof pattern === 'string') {
        return key.includes(pattern);
      }
      return pattern.test(key);
    });

    matchingKeys.forEach(key => {
      const entry = cache.current.get(key);
      if (entry) {
        cache.current.delete(key);
        stats.current.evictions++;
        onEvict?.(key, entry);
      }
    });

    stats.current.size = cache.current.size;
  }, [onEvict]);

  // Invalidate by dependencies
  const invalidateByDependency = useCallback((dependency: string) => {
    if (!enableDependencies) return;

    const keys = Array.from(cache.current.keys());
    keys.forEach(key => {
      const entry = cache.current.get(key);
      if (entry?.dependencies?.includes(dependency)) {
        cache.current.delete(key);
        stats.current.evictions++;
        onEvict?.(key, entry);
      }
    });

    stats.current.size = cache.current.size;
  }, [enableDependencies, onEvict]);

  // Clear all cache
  const clear = useCallback(() => {
    const size = cache.current.size;
    cache.current.clear();
    stats.current.evictions += size;
    stats.current.size = 0;
  }, []);

  // Get cache statistics
  const getStats = useCallback((): CacheStats => {
    // Calculate memory usage if available
    let memoryUsage: number | undefined;
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
    }

    return {
      ...stats.current,
      memoryUsage,
    };
  }, []);

  // Prefetch data
  const prefetch = useCallback(async (
    key: string,
    fetcher: () => Promise<T>,
    options: {
      ttl?: number;
      version?: string;
      dependencies?: string[];
    } = {}
  ) => {
    try {
      const data = await fetcher();
      set(key, data, options);
      return data;
    } catch (error) {
      console.error('Prefetch failed:', error);
      return null;
    }
  }, [set]);

  // Periodic cleanup
  useEffect(() => {
    const interval = setInterval(cleanup, 60000); // Cleanup every minute
    return () => clearInterval(interval);
  }, [cleanup]);

  return {
    set,
    get,
    invalidate,
    invalidateByDependency,
    clear,
    getStats,
    prefetch,
    has: (key: string) => cache.current.has(key),
    size: () => cache.current.size,
  };
}

// Hook for caching query results
export function useQueryCache<T = any>(config: CacheConfig = {}) {
  const cache = useAdvancedCache<T>(config);

  const cacheQuery = useCallback(async (
    key: string,
    queryFn: () => Promise<T>,
    options: {
      ttl?: number;
      version?: string;
      dependencies?: string[];
      forceRefresh?: boolean;
    } = {}
  ): Promise<T> => {
    const { forceRefresh = false, ...cacheOptions } = options;

    // Try to get from cache first
    if (!forceRefresh) {
      const cached = cache.get(key, cacheOptions.version);
      if (cached !== null) {
        return cached;
      }
    }

    // Fetch fresh data
    const data = await queryFn();
    cache.set(key, data, cacheOptions);
    return data;
  }, [cache]);

  return {
    ...cache,
    cacheQuery,
  };
}

// Hook for caching expensive computations
export function useComputationCache<T = any, P = any>(
  computeFn: (params: P) => T,
  config: CacheConfig = {}
) {
  const cache = useAdvancedCache<T>(config);

  const compute = useCallback((params: P, options: {
    ttl?: number;
    version?: string;
    dependencies?: string[];
  } = {}): T => {
    // Create cache key from params
    const key = JSON.stringify(params);
    
    // Try to get from cache
    const cached = cache.get(key, options.version);
    if (cached !== null) {
      return cached;
    }

    // Compute fresh result
    const result = computeFn(params);
    cache.set(key, result, options);
    return result;
  }, [computeFn, cache]);

  return {
    ...cache,
    compute,
  };
}
