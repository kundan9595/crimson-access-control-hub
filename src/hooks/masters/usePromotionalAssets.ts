import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { promotionalAssetsService } from '@/services/masters/promotionalAssetsService';
import { PromotionalAsset } from '@/services/masters/types';
import { toast } from 'sonner';

// Get all promotional assets
export const usePromotionalAssets = () => {
  return useQuery({
    queryKey: ['promotionalAssets'],
    queryFn: promotionalAssetsService.getAll,
  });
};

// Get promotional asset by ID
export const usePromotionalAsset = (id: string) => {
  return useQuery({
    queryKey: ['promotionalAssets', id],
    queryFn: () => promotionalAssetsService.getById(id),
    enabled: !!id,
  });
};

// Create promotional asset
export const useCreatePromotionalAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: promotionalAssetsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotionalAssets'] });
      toast.success('Promotional asset created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create promotional asset: ${error.message}`);
    },
  });
};

// Update promotional asset
export const useUpdatePromotionalAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PromotionalAsset> }) =>
      promotionalAssetsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotionalAssets'] });
      toast.success('Promotional asset updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update promotional asset: ${error.message}`);
    },
  });
};

// Delete promotional asset
export const useDeletePromotionalAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: promotionalAssetsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotionalAssets'] });
      toast.success('Promotional asset deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete promotional asset: ${error.message}`);
    },
  });
};

// Bulk create promotional assets
export const useBulkCreatePromotionalAssets = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: promotionalAssetsService.bulkCreate,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['promotionalAssets'] });
      toast.success(`Successfully created ${data.length} promotional assets`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to bulk create promotional assets: ${error.message}`);
    },
  });
}; 