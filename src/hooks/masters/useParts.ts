
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchParts,
  fetchPartsPaginated,
  createPart,
  updatePart,
  deletePart,
  updatePartColors,
  updatePartAddOns,
} from '@/services/masters/partsServiceScott';
import type { Part } from '@/services/masters/partsServiceScott';
import { useCreateMutation, useUpdateMutation, useDeleteMutation } from './shared/utils';
import { config } from '@/config/environment';
import { toast } from 'sonner';

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

// Update Part Colors relationship
export const useUpdatePartColors = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, colorIds }: { id: string; colorIds: string[] }) =>
      updatePartColors(id, colorIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts'] });
      toast.success('Part colors updated successfully');
    },
    onError: () => {
      toast.error('Failed to update part colors');
    },
  });
};

// Update Part AddOns relationship
export const useUpdatePartAddOns = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, addOnIds }: { id: string; addOnIds: string[] }) =>
      updatePartAddOns(id, addOnIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts'] });
      toast.success('Part add-ons updated successfully');
    },
    onError: () => {
      toast.error('Failed to update part add-ons');
    },
  });
};
