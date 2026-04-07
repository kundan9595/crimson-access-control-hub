
import { useQuery } from '@tanstack/react-query';
import {
  fetchSizes,
  fetchSizesPaginated,
  createSize,
  updateSize,
  deleteSize,
} from '@/services/masters/sizesServiceScott';
import { Size } from '@/services/masters/types';
import { useCreateMutation, useUpdateMutation, useDeleteMutation } from './shared/utils';
import { config } from '@/config/environment';

export const useSizes = (
  page: number = 1,
  pageSize: number = config.pagination.defaultPageSize,
) => {
  return useQuery({
    queryKey: ['sizes', 'list', page, pageSize],
    queryFn: () => fetchSizesPaginated({ page, items: pageSize }),
    placeholderData: (prev) => prev,
  });
};

export const useAllSizes = () => {
  return useQuery({
    queryKey: ['sizes', 'all'],
    queryFn: fetchSizes,
    staleTime: config.cache.staleTime,
  });
};

export const useCreateSize = () => {
  return useCreateMutation({
    queryKey: ['sizes'],
    successMessage: "Size created successfully",
    errorMessage: "Failed to create size",
    mutationFn: createSize,
  });
};

export const useUpdateSize = () => {
  return useUpdateMutation<Size>({
    queryKey: ['sizes'],
    successMessage: "Size updated successfully",
    errorMessage: "Failed to update size",
    mutationFn: ({ id, updates }) => updateSize(id, updates),
  });
};

export const useDeleteSize = () => {
  return useDeleteMutation({
    queryKey: ['sizes'],
    successMessage: "Size deleted successfully",
    errorMessage: "Failed to delete size",
    mutationFn: deleteSize,
  });
};
