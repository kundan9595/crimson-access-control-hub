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
      setLoading(true);
      setError(null);

      const result = await inventoryService.getGlobalClassInventory({
        query,
        page,
        limit: 20
      });

      if (page === 1) {
        setInventory(result.inventory);
      } else {
        setInventory(prev => [...prev, ...result.inventory]);
      }

      setPagination({
        page,
        total: result.total,
        hasMore: result.hasMore
      });
    } catch (err) {
      console.error('❌ [useClassInventory] Error fetching class inventory:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch class inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    try {
      const stats = await inventoryService.getGlobalClassInventoryStatistics();
      setStatistics(stats);
    } catch (err) {
      console.error('❌ [useClassInventory] Error fetching class inventory statistics:', err);
    }
  }, []);

  // Search inventory
  const searchInventory = useCallback((query: string) => {
    setSearchQuery(query);
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchInventory(1, query);
  }, [fetchInventory]);

  // Clear search
  const clearSearch = useCallback(() => {
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