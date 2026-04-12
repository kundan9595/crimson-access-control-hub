import { useQuery } from '@tanstack/react-query';
import { useCreateMutation, useUpdateMutation, useDeleteMutation } from './shared/utils';
import {
  fetchColors,
  fetchColorsPaginated,
  createColor,
  updateColor,
  deleteColor,
  type ColorFilter,
} from '@/services/masters/colorsService';
import { config } from '@/config/environment';

export { type ColorFilter } from '@/services/masters/colorsService';

/** Server-paginated list for table views. */
export const useColors = (
  page: number = 1,
  pageSize: number = config.pagination.defaultPageSize,
  filters?: ColorFilter,
) => {
  return useQuery({
    queryKey: ['colors', 'list', page, pageSize, filters?.search],
    queryFn: () => fetchColorsPaginated({ page, items: pageSize }, filters),
    placeholderData: (prev) => prev,
  });
};

/** Full list (all pages) for dropdowns and relations. */
export const useAllColors = () => {
  return useQuery({
    queryKey: ['colors', 'all'],
    queryFn: fetchColors,
    staleTime: config.cache.staleTime,
  });
};

export const useCreateColor = () => {
  return useCreateMutation({
    queryKey: ['colors'],
    successMessage: 'Color created successfully',
    errorMessage: 'Failed to create color',
    mutationFn: createColor,
  });
};

export const useUpdateColor = () => {
  return useUpdateMutation({
    queryKey: ['colors'],
    successMessage: 'Color updated successfully',
    errorMessage: 'Failed to update color',
    mutationFn: async ({ id, updates }) => updateColor(id, updates),
  });
};

export const useDeleteColor = () => {
  return useDeleteMutation({
    queryKey: ['colors'],
    successMessage: 'Color deleted successfully',
    errorMessage: 'Failed to delete color',
    mutationFn: deleteColor,
  });
};
