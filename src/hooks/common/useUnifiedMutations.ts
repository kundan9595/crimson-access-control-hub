import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Base mutation configuration
export interface MutationConfig<T = any> {
  queryKey: string[];
  successMessage: string;
  errorMessage: string;
  mutationFn: (data: T) => Promise<any>;
  onSuccess?: (data: any, variables: T) => void;
  onError?: (error: Error, variables: T) => void;
  invalidateQueries?: string[][];
}

// Create mutation configuration
export interface CreateMutationConfig<T = any> extends MutationConfig<T> {
  successMessage?: string;
  errorMessage?: string;
}

// Update mutation configuration
export interface UpdateMutationConfig<T = any> extends MutationConfig<T> {
  successMessage?: string;
  errorMessage?: string;
}

// Delete mutation configuration
export interface DeleteMutationConfig<T = any> extends MutationConfig<T> {
  successMessage?: string;
  errorMessage?: string;
  confirmMessage?: string;
}

// Bulk operation configuration
export interface BulkMutationConfig<T = any> extends MutationConfig<T[]> {
  successMessage?: string;
  errorMessage?: string;
  progressMessage?: string;
}

// Unified create mutation hook
export const useCreateMutation = <T = any>({
  queryKey,
  successMessage = 'Created successfully',
  errorMessage = 'Failed to create',
  mutationFn,
  onSuccess,
  onError,
  invalidateQueries
}: CreateMutationConfig<T>) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (data, variables) => {
      // Invalidate main query key
      queryClient.invalidateQueries({ queryKey });
      
      // Invalidate additional queries if provided
      if (invalidateQueries) {
        invalidateQueries.forEach(key => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      }

      // Show success toast
      toast.success(successMessage);

      // Call custom success handler
      if (onSuccess) {
        onSuccess(data, variables);
      }
    },
    onError: (error: any, variables) => {
      console.error('Create mutation error:', error);
      
      // Show error toast
      toast.error(errorMessage);

      // Call custom error handler
      if (onError) {
        onError(error, variables);
      }
    },
  });
};

// Unified update mutation hook
export const useUpdateMutation = <T = any>({
  queryKey,
  successMessage = 'Updated successfully',
  errorMessage = 'Failed to update',
  mutationFn,
  onSuccess,
  onError,
  invalidateQueries
}: UpdateMutationConfig<T>) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (data, variables) => {
      // Invalidate main query key
      queryClient.invalidateQueries({ queryKey });
      
      // Invalidate additional queries if provided
      if (invalidateQueries) {
        invalidateQueries.forEach(key => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      }

      // Show success toast
      toast.success(successMessage);

      // Call custom success handler
      if (onSuccess) {
        onSuccess(data, variables);
      }
    },
    onError: (error: any, variables) => {
      console.error('Update mutation error:', error);
      
      // Show error toast
      toast.error(errorMessage);

      // Call custom error handler
      if (onError) {
        onError(error, variables);
      }
    },
  });
};

// Unified delete mutation hook
export const useDeleteMutation = <T = any>({
  queryKey,
  successMessage = 'Deleted successfully',
  errorMessage = 'Failed to delete',
  mutationFn,
  onSuccess,
  onError,
  invalidateQueries
}: DeleteMutationConfig<T>) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (data, variables) => {
      // Invalidate main query key
      queryClient.invalidateQueries({ queryKey });
      
      // Invalidate additional queries if provided
      if (invalidateQueries) {
        invalidateQueries.forEach(key => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      }

      // Show success toast
      toast.success(successMessage);

      // Call custom success handler
      if (onSuccess) {
        onSuccess(data, variables);
      }
    },
    onError: (error: any, variables) => {
      console.error('Delete mutation error:', error);
      
      // Show error toast
      toast.error(errorMessage);

      // Call custom error handler
      if (onError) {
        onError(error, variables);
      }
    },
  });
};

// Unified bulk mutation hook
export const useBulkMutation = <T = any>({
  queryKey,
  successMessage = 'Bulk operation completed successfully',
  errorMessage = 'Bulk operation failed',
  progressMessage = 'Processing...',
  mutationFn,
  onSuccess,
  onError,
  invalidateQueries
}: BulkMutationConfig<T>) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: () => {
      // Show progress toast
      if (progressMessage) {
        toast.loading(progressMessage);
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate main query key
      queryClient.invalidateQueries({ queryKey });
      
      // Invalidate additional queries if provided
      if (invalidateQueries) {
        invalidateQueries.forEach(key => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      }

      // Show success toast
      toast.success(successMessage);

      // Call custom success handler
      if (onSuccess) {
        onSuccess(data, variables);
      }
    },
    onError: (error: any, variables) => {
      console.error('Bulk mutation error:', error);
      
      // Show error toast
      toast.error(errorMessage);

      // Call custom error handler
      if (onError) {
        onError(error, variables);
      }
    },
  });
};

// Factory for creating entity-specific mutation hooks
export const createEntityMutations = <T = any>(entityName: string) => {
  const queryKey = [entityName];
  
  return {
    useCreate: (config?: Partial<CreateMutationConfig<T>>) =>
      useCreateMutation<T>({
        queryKey,
        successMessage: `${entityName} created successfully`,
        errorMessage: `Failed to create ${entityName}`,
        ...config
      }),
    
    useUpdate: (config?: Partial<UpdateMutationConfig<T>>) =>
      useUpdateMutation<T>({
        queryKey,
        successMessage: `${entityName} updated successfully`,
        errorMessage: `Failed to update ${entityName}`,
        ...config
      }),
    
    useDelete: (config?: Partial<DeleteMutationConfig<T>>) =>
      useDeleteMutation<T>({
        queryKey,
        successMessage: `${entityName} deleted successfully`,
        errorMessage: `Failed to delete ${entityName}`,
        ...config
      }),
    
    useBulk: (config?: Partial<BulkMutationConfig<T>>) =>
      useBulkMutation<T>({
        queryKey,
        successMessage: `${entityName}s processed successfully`,
        errorMessage: `Failed to process ${entityName}s`,
        ...config
      })
  };
};

// Specialized hooks for common entities
export const useBrandMutations = createEntityMutations('brands');
export const useCategoryMutations = createEntityMutations('categories');
export const useColorMutations = createEntityMutations('colors');
export const useSizeGroupMutations = createEntityMutations('sizeGroups');
export const useZoneMutations = createEntityMutations('zones');
export const useVendorMutations = createEntityMutations('vendors');
export const useStyleMutations = createEntityMutations('styles');
export const useClassMutations = createEntityMutations('classes');
export const useSkuMutations = createEntityMutations('skus');
export const usePartMutations = createEntityMutations('parts');
export const useAddOnMutations = createEntityMutations('addOns');
export const useBaseProductMutations = createEntityMutations('baseProducts');
export const useWarehouseMutations = createEntityMutations('warehouses');
export const useInventoryMutations = createEntityMutations('inventory');
