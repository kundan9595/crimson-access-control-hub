
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAppAssets,
  getAppAssetsPaginated,
  createAppAsset,
  updateAppAsset,
  deleteAppAsset,
  type AppAsset,
} from '@/services/masters/appAssetsService';
import { toast } from 'sonner';
import { config } from '@/config/environment';

export const useGetAppAssets = (
  page: number = 1,
  pageSize: number = config.pagination.defaultPageSize,
) => {
  return useQuery({
    queryKey: ['appAssets', 'list', page, pageSize],
    queryFn: () => getAppAssetsPaginated({ page, items: pageSize }),
    placeholderData: (prev) => prev,
  });
};

export const useAllAppAssets = () => {
  return useQuery({
    queryKey: ['appAssets', 'all'],
    queryFn: getAppAssets,
    staleTime: config.cache.staleTime,
  });
};

export const useCreateAppAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAppAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appAssets'] });
      toast.success('App asset created successfully');
    },
    onError: (error) => {
      console.error('Create app asset error:', error);
      toast.error('Failed to create app asset');
    },
  });
};

export const useUpdateAppAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Omit<AppAsset, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>> }) =>
      updateAppAsset(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appAssets'] });
      toast.success('App asset updated successfully');
    },
    onError: (error) => {
      console.error('Update app asset error:', error);
      toast.error('Failed to update app asset');
    },
  });
};

export const useDeleteAppAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAppAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appAssets'] });
      toast.success('App asset deleted successfully');
    },
    onError: (error) => {
      console.error('Delete app asset error:', error);
      toast.error('Failed to delete app asset');
    },
  });
};
