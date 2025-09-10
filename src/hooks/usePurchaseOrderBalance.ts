import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import purchaseOrderBalanceService, { 
  ProcessedBalanceViewData, 
  BalanceViewData 
} from '@/services/purchaseOrderBalanceService';

interface UsePurchaseOrderBalanceReturn {
  data: ProcessedBalanceViewData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getQuantityForClassAndSize: (classId: string, sizeId: string) => number;
  getVendorsForClassAndSize: (classId: string, sizeId: string) => any[];
}

export const usePurchaseOrderBalance = (): UsePurchaseOrderBalanceReturn => {
  const [data, setData] = useState<ProcessedBalanceViewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const balanceData = await purchaseOrderBalanceService.getProcessedBalanceViewData();
      setData(balanceData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch balance view data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const getQuantityForClassAndSize = useCallback((classId: string, sizeId: string): number => {
    if (!data) return 0;
    
    const classData = data.data[classId];
    if (!classData) return 0;
    
    const sizeData = classData[sizeId];
    if (!sizeData) return 0;
    
    return sizeData.quantity;
  }, [data]);

  const getVendorsForClassAndSize = useCallback((classId: string, sizeId: string): any[] => {
    if (!data) return [];
    
    const classData = data.data[classId];
    if (!classData) return [];
    
    const sizeData = classData[sizeId];
    if (!sizeData) return [];
    
    return purchaseOrderBalanceService.getVendorBadges(sizeData.vendors);
  }, [data]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh,
    getQuantityForClassAndSize,
    getVendorsForClassAndSize
  };
};
