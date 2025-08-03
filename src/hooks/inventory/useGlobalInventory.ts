import { useState, useEffect, useCallback } from 'react';
import { inventoryService } from '@/services/inventory/inventoryService';
import {
  WarehouseInventory,
  InventorySearchParams,
  InventorySearchResult,
  InventoryStatistics,
  AddInventoryRequest,
  UpdateInventoryRequest
} from '@/services/inventory/types';

interface UseGlobalInventoryOptions {
  autoFetch?: boolean;
  initialParams?: InventorySearchParams;
}

export const useGlobalInventory = (options: UseGlobalInventoryOptions = {}) => {
  const { autoFetch = true, initialParams = {} } = options;
  
  const [inventory, setInventory] = useState<WarehouseInventory[]>([]);
  const [statistics, setStatistics] = useState<InventoryStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState<InventorySearchParams>(initialParams);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    hasMore: false
  });

  // Fetch global inventory data
  const fetchInventory = useCallback(async (params?: InventorySearchParams) => {
    try {
      setLoading(true);
      setError(null);
      
      const mergedParams = { ...searchParams, ...params };
      console.log('Fetching global inventory with params:', mergedParams);
      const result = await inventoryService.getGlobalInventory(mergedParams);
      console.log('Global inventory fetch result:', result);
      
      setInventory(result.inventory);
      setPagination({
        page: mergedParams.page || 1,
        total: result.total,
        hasMore: result.hasMore
      });
      setSearchParams(mergedParams);
    } catch (err) {
      console.error('Error fetching global inventory:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  // Fetch global statistics
  const fetchStatistics = useCallback(async () => {
    try {
      const stats = await inventoryService.getGlobalInventoryStatistics();
      setStatistics(stats);
    } catch (err) {
      console.error('Error fetching global statistics:', err);
      // Don't set error for statistics as it's not critical
    }
  }, []);

  // Load more inventory (pagination)
  const loadMore = useCallback(async () => {
    if (!pagination.hasMore || loading) return;
    
    const nextPage = pagination.page + 1;
    await fetchInventory({ ...searchParams, page: nextPage });
  }, [pagination.hasMore, pagination.page, loading, searchParams, fetchInventory]);

  // Search inventory
  const searchInventory = useCallback(async (query: string) => {
    await fetchInventory({ ...searchParams, query, page: 1 });
  }, [fetchInventory, searchParams]);

  // Filter inventory
  const filterInventory = useCallback(async (filters: any) => {
    await fetchInventory({ ...searchParams, filters, page: 1 });
  }, [fetchInventory, searchParams]);

  // Clear search and filters
  const clearSearch = useCallback(async () => {
    await fetchInventory({ page: 1 });
  }, [fetchInventory]);

  // Export global inventory
  const exportInventory = useCallback(async () => {
    try {
      const exportData = await inventoryService.exportGlobalInventory();
      return exportData;
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchInventory();
      fetchStatistics();
    }
  }, [autoFetch, fetchInventory, fetchStatistics]);

  return {
    // State
    inventory,
    statistics,
    loading,
    error,
    pagination,
    searchParams,
    
    // Actions
    fetchInventory,
    fetchStatistics,
    searchInventory,
    filterInventory,
    loadMore,
    clearSearch,
    exportInventory,
    
    // Utilities
    setError: (error: string | null) => setError(error)
  };
}; 