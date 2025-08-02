import { useState, useEffect, useCallback, useMemo } from 'react';
import { warehouseServiceOptimized, type Warehouse } from '@/services/warehouseServiceOptimized';
import { toast } from 'sonner';

interface UseWarehouseDataOptions {
  page?: number;
  limit?: number;
  status?: 'active' | 'inactive' | 'all';
  searchQuery?: string;
  enableCache?: boolean;
}

interface UseWarehouseDataReturn {
  warehouses: Warehouse[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  totalCount: number;
  currentPage: number;
  refreshData: () => Promise<void>;
  loadMore: () => Promise<void>;
  searchWarehouses: (query: string) => Promise<void>;
  filterByStatus: (status: 'active' | 'inactive' | 'all') => Promise<void>;
  clearCache: () => void;
}

// Simple in-memory cache
const warehouseCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useWarehouseData = (options: UseWarehouseDataOptions = {}): UseWarehouseDataReturn => {
  const {
    page = 1,
    limit = 20,
    status = 'all',
    searchQuery = '',
    enableCache = true
  } = options;

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(page);

  // Memoized cache key
  const cacheKey = useMemo(() => {
    return `warehouses_${page}_${limit}_${status}_${searchQuery}`;
  }, [page, limit, status, searchQuery]);

  // Check cache
  const getCachedData = useCallback(() => {
    if (!enableCache) return null;
    
    const cached = warehouseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }, [cacheKey, enableCache]);

  // Set cache
  const setCachedData = useCallback((data: any) => {
    if (!enableCache) return;
    
    warehouseCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }, [cacheKey, enableCache]);

  // Fetch warehouses with pagination
  const fetchWarehouses = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first
      const cachedData = getCachedData();
      if (cachedData && pageNum === 1) {
        setWarehouses(cachedData.warehouses);
        setTotalCount(cachedData.totalCount);
        setHasMore(cachedData.hasMore);
        setCurrentPage(pageNum);
        return;
      }

      // Fetch from API with filters and pagination
      const filters = {
        status: status === 'all' ? undefined : status,
        search: searchQuery || undefined
      };
      
      const pagination = {
        page: pageNum,
        limit
      };
      
      const data = await warehouseServiceOptimized.getWarehouses(filters, pagination);
      
      if (append) {
        setWarehouses(prev => [...prev, ...data.warehouses]);
      } else {
        setWarehouses(data.warehouses);
      }

      setTotalCount(data.total);
      setHasMore(data.hasMore);
      setCurrentPage(pageNum);

      // Cache the result
      if (pageNum === 1) {
        setCachedData({
          warehouses: data.warehouses,
          totalCount: data.total,
          hasMore: data.hasMore
        });
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch warehouses';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [limit, status, searchQuery, getCachedData, setCachedData]);

  // Load more data
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    await fetchWarehouses(currentPage + 1, true);
  }, [loading, hasMore, currentPage, fetchWarehouses]);

  // Search warehouses
  const searchWarehouses = useCallback(async (query: string) => {
    setCurrentPage(1);
    await fetchWarehouses(1, false);
  }, [fetchWarehouses]);

  // Filter by status
  const filterByStatus = useCallback(async (newStatus: 'active' | 'inactive' | 'all') => {
    setCurrentPage(1);
    await fetchWarehouses(1, false);
  }, [fetchWarehouses]);

  // Refresh data
  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Clear cache for this key and related keys
      warehouseCache.delete(cacheKey);
      // Also clear related cache keys
      const baseKey = cacheKey.split('_')[0];
      for (const key of warehouseCache.keys()) {
        if (key.startsWith(baseKey)) {
          warehouseCache.delete(key);
        }
      }
      
      await fetchWarehouses(1, false);
    } catch (error) {
      console.error('Error refreshing data:', error);
      setError('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  }, [cacheKey, fetchWarehouses]);

  // Clear all cache
  const clearCache = useCallback(() => {
    warehouseCache.clear();
    toast.info('Warehouse cache cleared.');
  }, []);

  // Initial load
  useEffect(() => {
    fetchWarehouses(page, false);
  }, [fetchWarehouses, page]);

  // Memoized filtered warehouses
  const memoizedWarehouses = useMemo(() => {
    return warehouses.filter(warehouse => {
      if (status !== 'all' && warehouse.status !== status) return false;
      if (searchQuery && !warehouse.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [warehouses, status, searchQuery]);

  return {
    warehouses: memoizedWarehouses,
    loading,
    error,
    hasMore,
    totalCount,
    currentPage,
    refreshData,
    loadMore,
    searchWarehouses,
    filterByStatus,
    clearCache
  };
}; 