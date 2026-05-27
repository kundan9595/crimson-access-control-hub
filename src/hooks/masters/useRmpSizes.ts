import { useQuery } from '@tanstack/react-query';
import {
  fetchRmpSizes,
  fetchRmpSizesPaginated,
  createRmpSize,
  updateRmpSize,
  deleteRmpSize,
} from '@/services/masters/rmpSizesService';
import type { RmpSize, RmpSizeType, RmpSizeFilter } from '@/services/masters/rmpSizesService';
import { useCreateMutation, useUpdateMutation, useDeleteMutation } from './shared/utils';
import { config } from '@/config/environment';

export type { RmpSize, RmpSizeType, RmpSizeFilter };

export const useRmpSizes = (
  page: number = 1,
  pageSize: number = config.pagination.defaultPageSize,
  filters?: RmpSizeFilter,
) => {
  return useQuery({
    queryKey: ['rmp_sizes', 'list', page, pageSize, filters?.search],
    queryFn: () => fetchRmpSizesPaginated({ page, items: pageSize }, filters),
    placeholderData: (prev) => prev,
  });
};

export const useAllRmpSizes = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['rmp_sizes', 'all'],
    queryFn: fetchRmpSizes,
    staleTime: config.cache.staleTime,
    enabled: options?.enabled ?? true,
  });
};

export const useCreateRmpSize = () => {
  return useCreateMutation<Omit<RmpSize, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>>({
    queryKey: ['rmp_sizes'],
    mutationFn: (data) => createRmpSize(data),
    successMessage: 'RMP Size created successfully',
    errorMessage: 'Failed to create RMP Size',
  });
};

export const useUpdateRmpSize = () => {
  return useUpdateMutation<RmpSize>({
    queryKey: ['rmp_sizes'],
    mutationFn: ({ id, updates }) => updateRmpSize(id, updates),
    successMessage: 'RMP Size updated successfully',
    errorMessage: 'Failed to update RMP Size',
  });
};

export const useDeleteRmpSize = () => {
  return useDeleteMutation({
    queryKey: ['rmp_sizes'],
    mutationFn: deleteRmpSize,
    successMessage: 'RMP Size deleted successfully',
    errorMessage: 'Failed to delete RMP Size',
  });
};
