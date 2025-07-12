
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAppAssets, createAppAsset, updateAppAsset, deleteAppAsset, type AppAsset } from '@/services/masters/appAssetsService';
import { useToast } from '@/hooks/use-toast';

export const useGetAppAssets = () => {
  return useQuery({
    queryKey: ['appAssets'],
    queryFn: getAppAssets,
  });
};

export const useCreateAppAsset = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createAppAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appAssets'] });
      toast({
        title: "Success",
        description: "App asset created successfully",
      });
    },
    onError: (error) => {
      console.error('Create app asset error:', error);
      toast({
        title: "Error",
        description: "Failed to create app asset",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateAppAsset = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Omit<AppAsset, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>> }) =>
      updateAppAsset(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appAssets'] });
      toast({
        title: "Success",
        description: "App asset updated successfully",
      });
    },
    onError: (error) => {
      console.error('Update app asset error:', error);
      toast({
        title: "Error", 
        description: "Failed to update app asset",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteAppAsset = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteAppAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appAssets'] });
      toast({
        title: "Success",
        description: "App asset deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Delete app asset error:', error);
      toast({
        title: "Error",
        description: "Failed to delete app asset",
        variant: "destructive",
      });
    },
  });
};
