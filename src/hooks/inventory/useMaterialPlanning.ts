import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { materialPlanningService } from '@/services/inventory/materialPlanningService';
import {
  MaterialPlanningSearchParams,
  MaterialPlanningResult,
  MaterialPlanningStatistics
} from '@/services/inventory/materialPlanningTypes';
import { toast } from 'sonner';

// Query keys
export const materialPlanningKeys = {
  all: ['material-planning'] as const,
  data: (params: MaterialPlanningSearchParams) => [...materialPlanningKeys.all, 'data', params] as const,
  statistics: () => [...materialPlanningKeys.all, 'statistics'] as const,
  filterOptions: () => [...materialPlanningKeys.all, 'filter-options'] as const,
};

/**
 * Hook to fetch material planning data
 */
export const useMaterialPlanningData = (params: MaterialPlanningSearchParams = {}) => {
  return useQuery({
    queryKey: materialPlanningKeys.data(params),
    queryFn: () => materialPlanningService.getMaterialPlanningData(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
};

/**
 * Hook to fetch material planning statistics
 */
export const useMaterialPlanningStatistics = () => {
  return useQuery({
    queryKey: materialPlanningKeys.statistics(),
    queryFn: () => materialPlanningService.getMaterialPlanningStatistics(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
};

/**
 * Hook to fetch filter options
 */
export const useMaterialPlanningFilterOptions = () => {
  return useQuery({
    queryKey: materialPlanningKeys.filterOptions(),
    queryFn: () => materialPlanningService.getFilterOptions(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
};

/**
 * Hook to invalidate and refresh material planning data
 */
export const useMaterialPlanningRefresh = () => {
  const queryClient = useQueryClient();

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: materialPlanningKeys.all });
  };

  const refreshData = (params?: MaterialPlanningSearchParams) => {
    if (params) {
      queryClient.invalidateQueries({ queryKey: materialPlanningKeys.data(params) });
    } else {
      queryClient.invalidateQueries({ queryKey: [...materialPlanningKeys.all, 'data'] });
    }
  };

  const refreshStatistics = () => {
    queryClient.invalidateQueries({ queryKey: materialPlanningKeys.statistics() });
  };

  return {
    refreshAll,
    refreshData,
    refreshStatistics,
  };
};

/**
 * Hook for manual reorder functionality
 */
export const useManualReorder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ skuId, vendorId }: { skuId: string; vendorId: string }) => 
      materialPlanningService.createManualReorder(skuId, vendorId),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`Purchase Order created successfully! PO ID: ${result.po_id}`);
        // Refresh material planning data
        queryClient.invalidateQueries({ queryKey: materialPlanningKeys.all });
      } else {
        toast.error(result.error || 'Failed to create Purchase Order');
      }
    },
    onError: (error) => {
      toast.error(`Error creating Purchase Order: ${error.message}`);
    },
  });
};

/**
 * Hook for auto reorder functionality
 */
export const useAutoReorder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => materialPlanningService.processAutoReorder(),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`Auto reorder processed: ${result.processed_count} items, ${result.created_pos.length} POs created`);
        // Refresh material planning data
        queryClient.invalidateQueries({ queryKey: materialPlanningKeys.all });
      } else {
        toast.error(`Auto reorder failed: ${result.errors.join(', ')}`);
      }
    },
    onError: (error) => {
      toast.error(`Error processing auto reorder: ${error.message}`);
    },
  });
};

/**
 * Hook for updating auto reorder settings
 */
export const useUpdateAutoReorderSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ skuId, autoReorderEnabled, preferredVendorId }: {
      skuId: string;
      autoReorderEnabled: boolean;
      preferredVendorId?: string;
    }) => materialPlanningService.updateAutoReorderSettings(skuId, autoReorderEnabled, preferredVendorId),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Auto reorder settings updated successfully');
        // Refresh material planning data
        queryClient.invalidateQueries({ queryKey: materialPlanningKeys.all });
      } else {
        toast.error(result.error || 'Failed to update auto reorder settings');
      }
    },
    onError: (error) => {
      toast.error(`Error updating auto reorder settings: ${error.message}`);
    },
  });
};

/**
 * Combined hook for material planning with all related data
 */
export const useMaterialPlanning = (params: MaterialPlanningSearchParams = {}) => {
  const dataQuery = useMaterialPlanningData(params);
  const statisticsQuery = useMaterialPlanningStatistics();
  const filterOptionsQuery = useMaterialPlanningFilterOptions();
  const refresh = useMaterialPlanningRefresh();
  
  // Mutations
  const manualReorder = useManualReorder();
  const autoReorder = useAutoReorder();
  const updateAutoReorderSettings = useUpdateAutoReorderSettings();

  return {
    // Data
    data: dataQuery.data,
    statistics: statisticsQuery.data,
    filterOptions: filterOptionsQuery.data,
    
    // Loading states
    isLoading: dataQuery.isLoading,
    isLoadingStatistics: statisticsQuery.isLoading,
    isLoadingFilterOptions: filterOptionsQuery.isLoading,
    
    // Error states
    error: dataQuery.error,
    statisticsError: statisticsQuery.error,
    filterOptionsError: filterOptionsQuery.error,
    
    // Status flags
    isError: dataQuery.isError,
    isSuccess: dataQuery.isSuccess,
    isFetching: dataQuery.isFetching,
    
    // Refresh functions
    refetch: dataQuery.refetch,
    refresh,
    
    // Reorder functions
    manualReorder: manualReorder.mutate,
    isManualReorderLoading: manualReorder.isPending,
    autoReorder: autoReorder.mutate,
    isAutoReorderLoading: autoReorder.isPending,
    updateAutoReorderSettings: updateAutoReorderSettings.mutate,
    isUpdatingAutoReorderSettings: updateAutoReorderSettings.isPending,
  };
};
