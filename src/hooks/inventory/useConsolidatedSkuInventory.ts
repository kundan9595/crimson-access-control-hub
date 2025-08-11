import { useState, useEffect, useCallback } from 'react';
import { inventoryService } from '@/services/inventory/inventoryService';
import { InventorySearchParams, InventoryStatistics } from '@/services/inventory/types';

interface UseConsolidatedSkuInventoryOptions {
  autoFetch?: boolean;
  initialParams?: InventorySearchParams;
}

export const useConsolidatedSkuInventory = (options: UseConsolidatedSkuInventoryOptions = {}) => {
  const { autoFetch = true, initialParams = {} } = options;
  
  const [inventory, setInventory] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<InventoryStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState<InventorySearchParams>(initialParams);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    hasMore: false
  });

  // Fetch consolidated SKU inventory data
  const fetchInventory = useCallback(async (params?: InventorySearchParams) => {
    try {
      setLoading(true);
      setError(null);
      
      const mergedParams = { ...searchParams, ...params };
      
      // Fetching consolidated SKU inventory with params
      const result = await inventoryService.getConsolidatedSkuInventory(mergedParams);
      
      setInventory(result.inventory);
      setPagination({
        page: mergedParams.page || 1,
        total: result.total,
        hasMore: result.hasMore
      });
      setSearchParams(mergedParams);
    } catch (err) {
      console.error('❌ [useConsolidatedSkuInventory] Error fetching consolidated SKU inventory:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  }, []); // Remove searchParams from dependencies to prevent infinite loop

  // Fetch consolidated SKU statistics
  const fetchStatistics = useCallback(async () => {
    try {
      const stats = await inventoryService.getConsolidatedSkuInventoryStatistics();
      setStatistics(stats);
    } catch (err) {
      console.error('❌ [useConsolidatedSkuInventory] Error fetching consolidated SKU statistics:', err);
      // Don't set error for statistics as it's not critical
    }
  }, []);

  // Load more inventory (pagination)
  const loadMore = useCallback(async () => {
    if (!pagination.hasMore || loading) return;
    
    const nextPage = pagination.page + 1;
    await fetchInventory({ page: nextPage });
  }, [pagination.hasMore, pagination.page, loading, fetchInventory]);

  // Search inventory
  const searchInventory = useCallback(async (query: string) => {
    await fetchInventory({ query, page: 1 });
  }, [fetchInventory]);

  // Filter inventory
  const filterInventory = useCallback(async (filters: any) => {
    await fetchInventory({ filters, page: 1 });
    await fetchStatistics();
  }, [fetchInventory, fetchStatistics]);

  // Clear search and filters
  const clearSearch = useCallback(async () => {
    await fetchInventory({ page: 1 });
    await fetchStatistics();
  }, [fetchInventory, fetchStatistics]);

  // Export consolidated SKU inventory
  const exportInventory = useCallback(async () => {
    try {
      const exportData = await inventoryService.exportConsolidatedSkuInventory();
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
