import { useQuery } from '@tanstack/react-query';
import {
  fetchPromotionalBanners,
  fetchPromotionalBannersPaginated,
  createPromotionalBanner,
  updatePromotionalBanner,
  deletePromotionalBanner,
  type ScottPromotionalBanner,
} from '@/services/masters/scottPromotionalBannersService';
import { useCreateMutation, useUpdateMutation, useDeleteMutation } from './shared/utils';
import { config } from '@/config/environment';

export { type ScottPromotionalBanner } from '@/services/masters/scottPromotionalBannersService';

export const useScottPromotionalBanners = (
  page: number = 1,
  pageSize: number = config.pagination.defaultPageSize,
) => {
  return useQuery({
    queryKey: ['scottPromotionalBanners', 'list', page, pageSize],
    queryFn: () => fetchPromotionalBannersPaginated({ page, items: pageSize }),
    placeholderData: (prev) => prev,
  });
};

export const useAllScottPromotionalBanners = () => {
  return useQuery({
    queryKey: ['scottPromotionalBanners', 'all'],
    queryFn: fetchPromotionalBanners,
    staleTime: config.cache.staleTime,
  });
};

export const useCreateScottPromotionalBanner = () => {
  return useCreateMutation<{
    data: Omit<
      ScottPromotionalBanner,
      'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'rmp_category' | 'rmp_class' | 'rmp_brand' | 'is_deleted'
    >;
    imageFile?: File;
  }>({
    queryKey: ['scottPromotionalBanners'],
    mutationFn: ({ data, imageFile }) => createPromotionalBanner(data, imageFile),
    successMessage: 'Promotional banner created successfully',
    errorMessage: 'Failed to create promotional banner',
  });
};

export const useUpdateScottPromotionalBanner = () => {
  return useUpdateMutation<{
    id: string;
    data: Partial<
      Omit<
        ScottPromotionalBanner,
        'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'rmp_category' | 'rmp_class' | 'rmp_brand' | 'is_deleted'
      >
    >;
    imageFile?: File;
  }>({
    queryKey: ['scottPromotionalBanners'],
    mutationFn: ({ id, data, imageFile }) => updatePromotionalBanner(id, data, imageFile),
    successMessage: 'Promotional banner updated successfully',
    errorMessage: 'Failed to update promotional banner',
  });
};

export const useDeleteScottPromotionalBanner = () => {
  return useDeleteMutation({
    queryKey: ['scottPromotionalBanners'],
    mutationFn: deletePromotionalBanner,
    successMessage: 'Promotional banner deleted successfully',
    errorMessage: 'Failed to delete promotional banner',
  });
};
