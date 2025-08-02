import { useState, useCallback } from 'react';
import { warehouseServiceOptimized, type CreateWarehouseData, type WarehouseWithDetails } from '@/services/warehouseServiceOptimized';
import { toast } from 'sonner';

interface UseWarehouseOperationsReturn {
  createWarehouse: (data: CreateWarehouseData) => Promise<WarehouseWithDetails | null>;
  updateWarehouse: (id: string, data: CreateWarehouseData) => Promise<WarehouseWithDetails | null>;
  deleteWarehouse: (id: string) => Promise<void>;
  getWarehouseById: (id: string) => Promise<WarehouseWithDetails | null>;
  loading: boolean;
  error: string | null;
}

export const useWarehouseOperations = (): UseWarehouseOperationsReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createWarehouse = useCallback(async (data: CreateWarehouseData): Promise<WarehouseWithDetails | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const newWarehouse = await warehouseServiceOptimized.createWarehouse(data);
      toast.success('Warehouse created successfully!');
      return newWarehouse;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create warehouse';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateWarehouse = useCallback(async (id: string, data: CreateWarehouseData): Promise<WarehouseWithDetails | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedWarehouse = await warehouseServiceOptimized.updateWarehouse(id, data);
      toast.success('Warehouse updated successfully!');
      return updatedWarehouse;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update warehouse';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteWarehouse = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await warehouseServiceOptimized.deleteWarehouse(id);
      toast.success('Warehouse deleted successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete warehouse';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err; // Re-throw to allow caller to handle
    } finally {
      setLoading(false);
    }
  }, []);

  const getWarehouseById = useCallback(async (id: string): Promise<WarehouseWithDetails | null> => {
    try {
      setError(null);
      return await warehouseServiceOptimized.getWarehouseById(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch warehouse';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    }
  }, []);

  return {
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
    getWarehouseById,
    loading,
    error
  };
}; 