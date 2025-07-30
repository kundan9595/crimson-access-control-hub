import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { promotionalBannersService, type PromotionalBanner } from '@/services/masters/promotionalBannersService';
import { toast } from 'sonner';

export const usePromotionalBanners = () => {
  return useQuery({
    queryKey: ['promotional-banners'],
    queryFn: promotionalBannersService.getAll,
  });
};

export const usePromotionalBanner = (id: string | undefined) => {
  return useQuery({
    queryKey: ['promotional-banner', id],
    queryFn: () => id ? promotionalBannersService.getById(id) : null,
    enabled: !!id,
  });
};

export const useCreatePromotionalBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: promotionalBannersService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotional-banners'] });
      toast.success('Promotional banner created successfully');
    },
    onError: (error) => {
      console.error('Error creating promotional banner:', error);
      toast.error('Failed to create promotional banner');
    },
  });
};

export const useUpdatePromotionalBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<PromotionalBanner> }) =>
      promotionalBannersService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotional-banners'] });
      toast.success('Promotional banner updated successfully');
    },
    onError: (error) => {
      console.error('Error updating promotional banner:', error);
      toast.error('Failed to update promotional banner');
    },
  });
};

export const useDeletePromotionalBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: promotionalBannersService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotional-banners'] });
      toast.success('Promotional banner deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting promotional banner:', error);
      toast.error('Failed to delete promotional banner');
    },
  });
};

export const useBulkCreatePromotionalBanners = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: promotionalBannersService.bulkCreate,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['promotional-banners'] });
      toast.success(`${data.length} promotional banners created successfully`);
    },
    onError: (error) => {
      console.error('Error bulk creating promotional banners:', error);
      toast.error('Failed to create promotional banners');
    },
  });
}; 