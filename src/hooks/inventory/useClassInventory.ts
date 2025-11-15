import { useState, useEffect, useCallback } from 'react';
import { inventoryService } from '@/services/inventory/inventoryService';
import { ClassInventoryView, ClassInventoryStatistics } from '@/services/inventory/types';

interface UseClassInventoryOptions {
  autoFetch?: boolean;
}

interface UseClassInventoryReturn {
  inventory: ClassInventoryView[];
  statistics: ClassInventoryStatistics | null;
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

export const useClassInventory = (options: UseClassInventoryOptions = {}): UseClassInventoryReturn => {
  const { autoFetch = false } = options;
  
  const [inventory, setInventory] = useState<ClassInventoryView[]>([]);
  const [statistics, setStatistics] = useState<ClassInventoryStatistics | null>(null);
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
      console.log('🔵 [useClassInventory] fetchInventory called', { page, query });
      setLoading(true);
      setError(null);

      const params = {
        query,
        page,
        limit: 20
      };
      console.log('🔵 [useClassInventory] Calling getGlobalClassInventory with params:', params);

      const result = await inventoryService.getGlobalClassInventory(params);

      console.log('🔵 [useClassInventory] Received result:', {
        inventoryCount: result.inventory?.length || 0,
        total: result.total,
        hasMore: result.hasMore,
        firstItem: result.inventory?.[0] || null
      });

      if (page === 1) {
        setInventory(result.inventory);
        console.log('🔵 [useClassInventory] Set inventory (page 1):', result.inventory.length, 'items');
      } else {
        setInventory(prev => {
          const newInventory = [...prev, ...result.inventory];
          console.log('🔵 [useClassInventory] Appended inventory (page', page, '):', newInventory.length, 'total items');
          return newInventory;
        });
      }

      setPagination({
        page,
        total: result.total,
        hasMore: result.hasMore
      });
      console.log('🔵 [useClassInventory] Updated pagination:', { page, total: result.total, hasMore: result.hasMore });
    } catch (err) {
      console.error('❌ [useClassInventory] Error fetching class inventory:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch class inventory');
    } finally {
      setLoading(false);
      console.log('🔵 [useClassInventory] fetchInventory completed, loading set to false');
    }
  }, []);

  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    try {
      console.log('🔵 [useClassInventory] fetchStatistics called');
      const stats = await inventoryService.getGlobalClassInventoryStatistics();
      console.log('🔵 [useClassInventory] Received statistics:', stats);
      setStatistics(stats);
    } catch (err) {
      console.error('❌ [useClassInventory] Error fetching class inventory statistics:', err);
    }
  }, []);

  // Search inventory
  const searchInventory = useCallback((query: string) => {
    console.log('🔵 [useClassInventory] searchInventory called with query:', query);
    setSearchQuery(query);
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchInventory(1, query);
  }, [fetchInventory]);

  // Clear search
  const clearSearch = useCallback(() => {
    console.log('🔵 [useClassInventory] clearSearch called');
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
      return await inventoryService.exportGlobalClassInventory();
    } catch (err) {
      console.error('Error exporting class inventory:', err);
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