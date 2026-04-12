import { useQuery } from '@tanstack/react-query';
import {
  fetchRmpSkus,
  fetchRmpSkusPaginated,
  createRmpSku,
  updateRmpSku,
  deleteRmpSku,
} from '@/services/masters/rmpSkusService';
import type { RmpSku, RmpSkuFilter } from '@/services/masters/rmpSkusService';
import { useCreateMutation, useUpdateMutation, useDeleteMutation } from './shared/utils';
import { config } from '@/config/environment';

export type { RmpSku, RmpSkuFilter };

export const useRmpSkus = (
  page: number = 1,
  pageSize: number = config.pagination.defaultPageSize,
  filters?: RmpSkuFilter,
) => {
  return useQuery({
    queryKey: ['rmp_skus', 'list', page, pageSize, filters?.search],
    queryFn: () => fetchRmpSkusPaginated({ page, items: pageSize }, filters),
    placeholderData: (prev) => prev,
  });
};

export const useAllRmpSkus = () => {
  return useQuery({
    queryKey: ['rmp_skus', 'all'],
    queryFn: fetchRmpSkus,
    staleTime: config.cache.staleTime,
  });
};

export const useCreateRmpSku = () => {
  return useCreateMutation<
    Omit<RmpSku, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'rmp_size' | 'rmp_class' | 'rmp_brand' | 'rmp_category'>
  >({
    queryKey: ['rmp_skus'],
    mutationFn: (data) => createRmpSku(data),
    successMessage: 'RMP SKU created successfully',
    errorMessage: 'Failed to create RMP SKU',
  });
};

export const useUpdateRmpSku = () => {
  return useUpdateMutation<RmpSku>({
    queryKey: ['rmp_skus'],
    mutationFn: ({ id, updates }) => updateRmpSku(id, updates),
    successMessage: 'RMP SKU updated successfully',
    errorMessage: 'Failed to update RMP SKU',
  });
};

export const useDeleteRmpSku = () => {
  return useDeleteMutation({
    queryKey: ['rmp_skus'],
    mutationFn: deleteRmpSku,
    successMessage: 'RMP SKU deleted successfully',
    errorMessage: 'Failed to delete RMP SKU',
  });
};
