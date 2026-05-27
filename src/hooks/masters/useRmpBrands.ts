import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchRmpBrands,
  fetchRmpBrandsPaginated,
  createRmpBrand,
  updateRmpBrand,
  deleteRmpBrand,
  updateRmpBrandCategories,
} from '@/services/masters/rmpBrandsService';
import type { RmpBrand, RmpBrandFilter } from '@/services/masters/rmpBrandsService';
import { useCreateMutation, useUpdateMutation, useDeleteMutation } from './shared/utils';
import { config } from '@/config/environment';

export type { RmpBrand, RmpBrandFilter };

export const useRmpBrands = (
  page: number = 1,
  pageSize: number = config.pagination.defaultPageSize,
  filters?: RmpBrandFilter,
) => {
  return useQuery({
    queryKey: ['rmp_brands', 'list', page, pageSize, filters?.search],
    queryFn: () => fetchRmpBrandsPaginated({ page, items: pageSize }, filters),
    placeholderData: (prev) => prev,
  });
};

export const useAllRmpBrands = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['rmp_brands', 'all'],
    queryFn: fetchRmpBrands,
    staleTime: config.cache.staleTime,
    enabled: options?.enabled ?? true,
  });
};

export const useCreateRmpBrand = () => {
  return useCreateMutation<
    Omit<RmpBrand, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'authorized_brand' | 'rmp_categories'>
  >({
    queryKey: ['rmp_brands'],
    mutationFn: (data) => createRmpBrand(data),
    successMessage: 'RMP Brand created successfully',
    errorMessage: 'Failed to create RMP Brand',
  });
};

export const useUpdateRmpBrand = () => {
  return useUpdateMutation<RmpBrand>({
    queryKey: ['rmp_brands'],
    mutationFn: ({ id, updates }) => updateRmpBrand(id, updates),
    successMessage: 'RMP Brand updated successfully',
    errorMessage: 'Failed to update RMP Brand',
  });
};

export const useDeleteRmpBrand = () => {
  return useDeleteMutation({
    queryKey: ['rmp_brands'],
    mutationFn: deleteRmpBrand,
    successMessage: 'RMP Brand deleted successfully',
    errorMessage: 'Failed to delete RMP Brand',
  });
};

// Special mutation for updating RMP Brand categories
export const useUpdateRmpBrandCategories = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, rmpCategoryIds }: { id: string; rmpCategoryIds: string[] }) =>
      updateRmpBrandCategories(id, rmpCategoryIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rmp_brands'] });
    },
  });
};
