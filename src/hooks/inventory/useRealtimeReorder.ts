import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { realtimeReorderService, PendingReorderProcessResult } from '@/services/inventory/realtimeReorderService';

// Query keys
export const realtimeReorderKeys = {
  all: ['realtime-reorder'] as const,
  pending: () => [...realtimeReorderKeys.all, 'pending'] as const,
  history: (skuId?: string) => [...realtimeReorderKeys.all, 'history', skuId] as const,
  statistics: () => [...realtimeReorderKeys.all, 'statistics'] as const,
};

/**
 * Hook to get pending reorders
 */
export const usePendingReorders = () => {
  return useQuery({
    queryKey: realtimeReorderKeys.pending(),
    queryFn: () => realtimeReorderService.getPendingReorders(),
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 15000, // Consider data stale after 15 seconds
  });
};

/**
 * Hook to get reorder history for a specific SKU
 */
export const useReorderHistory = (skuId?: string) => {
  return useQuery({
    queryKey: realtimeReorderKeys.history(skuId),
    queryFn: () => skuId ? realtimeReorderService.getReorderHistoryForSKU(skuId) : Promise.resolve({ success: true, data: [] }),
    enabled: !!skuId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to get reorder statistics
 */
export const useReorderStatistics = () => {
  return useQuery({
    queryKey: realtimeReorderKeys.statistics(),
    queryFn: () => realtimeReorderService.getReorderStatistics(),
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000, // Consider data stale after 30 seconds
  });
};

/**
 * Hook to process pending reorders
 */
export const useProcessPendingReorders = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => realtimeReorderService.processPendingReorders(),
    onSuccess: (result: PendingReorderProcessResult) => {
      if (result.success) {
        toast.success(
          `Processed ${result.processed_count} pending reorders. Created ${result.created_pos.length} POs.`,
          {
            description: result.message
          }
        );
      } else {
        toast.error('Failed to process pending reorders', {
          description: result.message
        });
      }
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: realtimeReorderKeys.pending() });
      queryClient.invalidateQueries({ queryKey: realtimeReorderKeys.statistics() });
    },
    onError: (error) => {
      toast.error('Error processing pending reorders', {
        description: error.message
      });
    },
  });
};

/**
 * Hook to check if SKU has pending reorder
 */
export const useHasPendingReorder = (skuId?: string) => {
  return useQuery({
    queryKey: [...realtimeReorderKeys.all, 'has-pending', skuId],
    queryFn: () => skuId ? realtimeReorderService.hasPendingReorder(skuId) : Promise.resolve(false),
    enabled: !!skuId,
    staleTime: 30000, // 30 seconds
  });
};

/**
 * Hook for real-time inventory and reorder monitoring
 */
export const useRealtimeReorderMonitoring = () => {
  const queryClient = useQueryClient();

  const handleInventoryChange = useCallback((payload: any) => {
    console.log('Inventory change detected:', payload);
    
    // Invalidate pending reorders query to check for new reorders
    queryClient.invalidateQueries({ queryKey: realtimeReorderKeys.pending() });
    
    // Show notification if it's a significant change
    if (payload.new && payload.old) {
      const oldQty = payload.old.available_quantity;
      const newQty = payload.new.available_quantity;
      
      if (oldQty > newQty) {
        toast.info('Inventory decreased - checking for auto reorder triggers', {
          description: `Available quantity changed from ${oldQty} to ${newQty}`
        });
      }
    }
  }, [queryClient]);

  const handleReorderHistoryChange = useCallback((payload: any) => {
    console.log('New reorder history entry:', payload);
    
    // Invalidate all reorder-related queries
    queryClient.invalidateQueries({ queryKey: realtimeReorderKeys.all });
    
    // Show notification for new auto reorder
    if (payload.new && payload.new.trigger_type === 'inventory_change') {
      toast.warning('Auto reorder triggered by inventory change', {
        description: `SKU: ${payload.new.notes || 'Unknown SKU'}`
      });
    }
  }, [queryClient]);

  useEffect(() => {
    // Subscribe to inventory changes
    const inventoryChannel = realtimeReorderService.subscribeToInventoryChanges(handleInventoryChange);
    
    // Subscribe to reorder history changes
    const reorderChannel = realtimeReorderService.subscribeToReorderHistory(handleReorderHistoryChange);

    // Cleanup subscriptions on unmount
    return () => {
      realtimeReorderService.unsubscribe(inventoryChannel);
      realtimeReorderService.unsubscribe(reorderChannel);
    };
  }, [handleInventoryChange, handleReorderHistoryChange]);

  return {
    // Return functions that components can use
    processPendingReorders: useProcessPendingReorders(),
  };
};

/**
 * Main hook that combines all reorder functionality
 */
export const useRealtimeReorder = () => {
  const pendingReorders = usePendingReorders();
  const statistics = useReorderStatistics();
  const processPendingReorders = useProcessPendingReorders();
  const monitoring = useRealtimeReorderMonitoring();

  return {
    // Data
    pendingReorders: pendingReorders.data,
    statistics: statistics.data,
    
    // Loading states
    isPendingReordersLoading: pendingReorders.isLoading,
    isStatisticsLoading: statistics.isLoading,
    isProcessingPending: processPendingReorders.isPending,
    
    // Error states
    pendingReordersError: pendingReorders.error,
    statisticsError: statistics.error,
    
    // Actions
    processPendingReorders: processPendingReorders.mutate,
    
    // Refetch functions
    refetchPendingReorders: pendingReorders.refetch,
    refetchStatistics: statistics.refetch,
  };
};
