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

interface UseInventoryOptions {
  warehouseId?: string;
  autoFetch?: boolean;
  initialParams?: InventorySearchParams;
}

export const useInventory = (options: UseInventoryOptions = {}) => {
  const { warehouseId, autoFetch = true, initialParams = {} } = options;
  
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

  // Fetch inventory data
  const fetchInventory = useCallback(async (params?: InventorySearchParams) => {
    if (!warehouseId) return;

    try {
      setLoading(true);
      setError(null);
      
      const mergedParams = { ...searchParams, ...params };
      console.log('Fetching inventory with params:', mergedParams);
      const result = await inventoryService.getWarehouseInventory(warehouseId, mergedParams);
      console.log('Inventory fetch result:', result);
      
      setInventory(result.inventory);
      setPagination({
        page: mergedParams.page || 1,
        total: result.total,
        hasMore: result.hasMore
      });
      setSearchParams(mergedParams);
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  }, [warehouseId]); // Removed searchParams from dependencies to prevent infinite loop

  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    if (!warehouseId) return;

    try {
      const stats = await inventoryService.getInventoryStatistics(warehouseId);
      setStatistics(stats);
    } catch (err) {
      console.error('Error fetching statistics:', err);
      // Don't set error for statistics as it's not critical
    }
  }, [warehouseId]);

  // Load more inventory (pagination)
  const loadMore = useCallback(async () => {
    if (!pagination.hasMore || loading) return;
    
    const nextPage = pagination.page + 1;
    await fetchInventory({ page: nextPage });
  }, [pagination.hasMore, pagination.page, loading, fetchInventory]);

  // Add inventory
  const addInventory = useCallback(async (request: AddInventoryRequest) => {
    try {
      setLoading(true);
      setError(null);
      
      const newInventory = await inventoryService.addInventory(request);
      
      // Refresh the inventory list
      await fetchInventory();
      await fetchStatistics();
      
      return newInventory;
    } catch (err) {
      console.error('Error adding inventory:', err);
      setError(err instanceof Error ? err.message : 'Failed to add inventory');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchInventory, fetchStatistics]);

  // Update inventory
  const updateInventory = useCallback(async (request: UpdateInventoryRequest) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedInventory = await inventoryService.updateInventory(request);
      
      // Update the inventory list
      setInventory(prev => 
        prev.map(item => 
          item.id === request.warehouse_inventory_id ? updatedInventory : item
        )
      );
      
      await fetchStatistics();
      
      return updatedInventory;
    } catch (err) {
      console.error('Error updating inventory:', err);
      setError(err instanceof Error ? err.message : 'Failed to update inventory');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchStatistics]);

  // Delete inventory
  const deleteInventory = useCallback(async (inventoryId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await inventoryService.deleteInventory(inventoryId);
      
      // Remove from local state
      setInventory(prev => prev.filter(item => item.id !== inventoryId));
      await fetchStatistics();
    } catch (err) {
      console.error('Error deleting inventory:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete inventory');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchStatistics]);

  // Search inventory
  const searchInventory = useCallback(async (query: string) => {
    await fetchInventory({ query, page: 1 });
  }, [fetchInventory]);

  // Filter inventory
  const filterInventory = useCallback(async (filters: any) => {
    await fetchInventory({ filters, page: 1 });
  }, [fetchInventory]);

  // Clear search and filters
  const clearSearch = useCallback(async () => {
    await fetchInventory({ page: 1 });
  }, [fetchInventory]);

  // Auto-fetch on mount and when warehouseId changes
  useEffect(() => {
    if (autoFetch && warehouseId) {
      fetchInventory();
      fetchStatistics();
    }
  }, [warehouseId, autoFetch, fetchInventory, fetchStatistics]);

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
    addInventory,
    updateInventory,
    deleteInventory,
    searchInventory,
    filterInventory,
    loadMore,
    clearSearch,
    
    // Utilities
    setError: (error: string | null) => setError(error)
  };
}; 