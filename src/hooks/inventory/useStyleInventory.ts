import { useState, useEffect, useCallback } from 'react';
import { inventoryService } from '@/services/inventory/inventoryService';
import { StyleInventoryView, StyleInventoryStatistics } from '@/services/inventory/types';

interface UseStyleInventoryOptions {
  autoFetch?: boolean;
}

interface UseStyleInventoryReturn {
  inventory: StyleInventoryView[];
  statistics: StyleInventoryStatistics | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    total: number;
    hasMore: boolean;
  };
  searchInventory: (query: string) => void;
  clearSearch: () => void;
  loadMore: () => void;
  exportInventory: () => Promise<any[]>;
  fetchStatistics: () => Promise<void>;
}

export const useStyleInventory = (options: UseStyleInventoryOptions = {}): UseStyleInventoryReturn => {
  const { autoFetch = false } = options;
  
  const [inventory, setInventory] = useState<StyleInventoryView[]>([]);
  const [statistics, setStatistics] = useState<StyleInventoryStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    hasMore: false
  });
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fetch inventory data
  const fetchInventory = useCallback(async (page: number = 1, query?: string) => {
    try {
      console.log('🟣 [useStyleInventory] fetchInventory called', { page, query });
      setLoading(true);
      setError(null);

      const params = {
        query,
        page,
        limit: 20
      };
      console.log('🟣 [useStyleInventory] Calling getGlobalStyleInventory with params:', params);

      const result = await inventoryService.getGlobalStyleInventory(params);

      console.log('🟣 [useStyleInventory] Received result:', {
        inventoryCount: result.inventory?.length || 0,
        total: result.total,
        hasMore: result.hasMore,
        firstItem: result.inventory?.[0] || null
      });

      if (page === 1) {
        setInventory(result.inventory);
        console.log('🟣 [useStyleInventory] Set inventory (page 1):', result.inventory.length, 'items');
      } else {
        setInventory(prev => {
          const newInventory = [...prev, ...result.inventory];
          console.log('🟣 [useStyleInventory] Appended inventory (page', page, '):', newInventory.length, 'total items');
          return newInventory;
        });
      }

      setPagination({
        page,
        total: result.total,
        hasMore: result.hasMore
      });
      console.log('🟣 [useStyleInventory] Updated pagination:', { page, total: result.total, hasMore: result.hasMore });
    } catch (err) {
      console.error('❌ [useStyleInventory] Error fetching style inventory:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch style inventory');
    } finally {
      setLoading(false);
      console.log('🟣 [useStyleInventory] fetchInventory completed, loading set to false');
    }
  }, []);

  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    try {
      console.log('🟣 [useStyleInventory] fetchStatistics called');
      const stats = await inventoryService.getGlobalStyleInventoryStatistics();
      console.log('🟣 [useStyleInventory] Received statistics:', stats);
      setStatistics(stats);
    } catch (err) {
      console.error('❌ [useStyleInventory] Error fetching style inventory statistics:', err);
    }
  }, []);

  // Search inventory
  const searchInventory = useCallback((query: string) => {
    console.log('🟣 [useStyleInventory] searchInventory called with query:', query);
    setSearchQuery(query);
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchInventory(1, query);
  }, [fetchInventory]);

  // Clear search
  const clearSearch = useCallback(() => {
    console.log('🟣 [useStyleInventory] clearSearch called');
    setSearchQuery('');
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchInventory(1);
  }, [fetchInventory]);

  // Load more
  const loadMore = useCallback(() => {
    if (!loading && pagination.hasMore) {
      const nextPage = pagination.page + 1;
      fetchInventory(nextPage, searchQuery);
    }
  }, [loading, pagination.hasMore, pagination.page, fetchInventory, searchQuery]);

  // Export inventory
  const exportInventory = useCallback(async (): Promise<any[]> => {
    try {
      return await inventoryService.exportGlobalStyleInventory();
    } catch (err) {
      console.error('Error exporting style inventory:', err);
      throw err;
    }
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchInventory(1);
      fetchStatistics();
    }
  }, [autoFetch, fetchInventory, fetchStatistics]);

  return {
    inventory,
    statistics,
    loading,
    error,
    pagination,
    searchInventory,
    clearSearch,
    loadMore,
    exportInventory,
    fetchStatistics
  };
}; 