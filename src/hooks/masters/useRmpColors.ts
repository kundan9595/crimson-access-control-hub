import { useQuery } from '@tanstack/react-query';
import {
  fetchRmpColors,
  fetchRmpColorsPaginated,
  createRmpColor,
  updateRmpColor,
  deleteRmpColor,
} from '@/services/masters/rmpColorsService';
import type { RmpColor, RmpColorFilter } from '@/services/masters/rmpColorsService';
import { useCreateMutation, useUpdateMutation, useDeleteMutation } from './shared/utils';
import { config } from '@/config/environment';

export type { RmpColor, RmpColorFilter };

export const useRmpColors = (
  page: number = 1,
  pageSize: number = config.pagination.defaultPageSize,
  filters?: RmpColorFilter,
) => {
  return useQuery({
    queryKey: ['rmp_colors', 'list', page, pageSize, filters?.search],
    queryFn: () => fetchRmpColorsPaginated({ page, items: pageSize }, filters),
    placeholderData: (prev) => prev,
  });
};

export const useAllRmpColors = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['rmp_colors', 'all'],
    queryFn: fetchRmpColors,
    staleTime: config.cache.staleTime,
    enabled: options?.enabled ?? true,
  });
};

export const useCreateRmpColor = () => {
  return useCreateMutation<Omit<RmpColor, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>>({
    queryKey: ['rmp_colors'],
    mutationFn: (data) => createRmpColor(data),
    successMessage: 'RMP Color created successfully',
    errorMessage: 'Failed to create RMP Color',
  });
};

export const useUpdateRmpColor = () => {
  return useUpdateMutation<RmpColor>({
    queryKey: ['rmp_colors'],
    mutationFn: ({ id, updates }) => updateRmpColor(id, updates),
    successMessage: 'RMP Color updated successfully',
    errorMessage: 'Failed to update RMP Color',
  });
};

export const useDeleteRmpColor = () => {
  return useDeleteMutation({
    queryKey: ['rmp_colors'],
    mutationFn: deleteRmpColor,
    successMessage: 'RMP Color deleted successfully',
    errorMessage: 'Failed to delete RMP Color',
  });
};
