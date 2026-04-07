
import { useQuery } from '@tanstack/react-query';
import {
  fetchParts,
  fetchPartsPaginated,
  createPart,
  updatePart,
  deletePart,
} from '@/services/masters/partsServiceScott';
import type { Part } from '@/services/masters/partsServiceScott';
import { useCreateMutation, useUpdateMutation, useDeleteMutation } from './shared/utils';
import { config } from '@/config/environment';

export type { Part };

export const useParts = (
  page: number = 1,
  pageSize: number = config.pagination.defaultPageSize,
) => {
  return useQuery({
    queryKey: ['parts', 'list', page, pageSize],
    queryFn: () => fetchPartsPaginated({ page, items: pageSize }),
    placeholderData: (prev) => prev,
  });
};

export const useAllParts = () => {
  return useQuery({
    queryKey: ['parts', 'all'],
    queryFn: fetchParts,
    staleTime: config.cache.staleTime,
  });
};

export const useCreatePart = () => {
  return useCreateMutation<Omit<Part, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>>({
    queryKey: ['parts'],
    mutationFn: createPart,
    successMessage: 'Part created successfully',
    errorMessage: 'Failed to create part',
  });
};

export const useUpdatePart = () => {
  return useUpdateMutation<Part>({
    queryKey: ['parts'],
    mutationFn: ({ id, updates }) => updatePart(id, updates),
    successMessage: 'Part updated successfully',
    errorMessage: 'Failed to update part',
  });
};

export const useDeletePart = () => {
  return useDeleteMutation({
    queryKey: ['parts'],
    mutationFn: deletePart,
    successMessage: 'Part deleted successfully',
    errorMessage: 'Failed to delete part',
  });
};
