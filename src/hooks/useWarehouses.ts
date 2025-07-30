import { useState, useEffect, useCallback } from 'react';
import { warehouseService, type WarehouseWithDetails, type CreateWarehouseData, type UpdateWarehouseData } from '@/services/warehouseService';
import { toast } from 'sonner';

interface UseWarehousesReturn {
  warehouses: WarehouseWithDetails[];
  loading: boolean;
  error: string | null;
  refreshWarehouses: () => Promise<void>;
  createWarehouse: (data: CreateWarehouseData) => Promise<WarehouseWithDetails | null>;
  updateWarehouse: (id: string, data: UpdateWarehouseData) => Promise<WarehouseWithDetails | null>;
  deleteWarehouse: (id: string) => Promise<void>;
  getWarehouseById: (id: string) => Promise<WarehouseWithDetails | null>;
}

export const useWarehouses = (): UseWarehousesReturn => {
  const [warehouses, setWarehouses] = useState<WarehouseWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWarehouses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await warehouseService.getWarehouses();
      setWarehouses(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch warehouses';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshWarehouses = useCallback(async () => {
    await fetchWarehouses();
  }, [fetchWarehouses]);

  const createWarehouse = useCallback(async (data: CreateWarehouseData): Promise<WarehouseWithDetails | null> => {
    try {
      setLoading(true);
      setError(null);
      const newWarehouse = await warehouseService.createWarehouse(data);
      setWarehouses(prev => [newWarehouse, ...prev]);
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

  const updateWarehouse = useCallback(async (id: string, data: UpdateWarehouseData): Promise<WarehouseWithDetails | null> => {
    try {
      setLoading(true);
      setError(null);
      const updatedWarehouse = await warehouseService.updateWarehouse(id, data);
      setWarehouses(prev => 
        prev.map(warehouse => 
          warehouse.id === id ? updatedWarehouse : warehouse
        )
      );
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
      setError(null);
      await warehouseService.deleteWarehouse(id);
      setWarehouses(prev => prev.filter(warehouse => warehouse.id !== id));
      toast.success('Warehouse deleted successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete warehouse';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, []);

  const getWarehouseById = useCallback(async (id: string): Promise<WarehouseWithDetails | null> => {
    try {
      setError(null);
      return await warehouseService.getWarehouseById(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch warehouse';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    }
  }, []);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  return {
    warehouses,
    loading,
    error,
    refreshWarehouses,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
    getWarehouseById
  };
}; 