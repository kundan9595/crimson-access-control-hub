import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchRmpClasses,
  fetchRmpClassesForBulkImport,
  fetchRmpClassesPaginated,
  createRmpClass,
  updateRmpClass,
  deleteRmpClass,
} from '@/services/masters/rmpClassesService';
import type { RmpClass, RmpClassImageFiles, RmpClassFilter } from '@/services/masters/rmpClassesService';
import { useDeleteMutation } from './shared/utils';
import { config } from '@/config/environment';
import { toast } from 'sonner';

export type { RmpClass, RmpClassImageFiles, RmpClassFilter };

export const useRmpClasses = (
  page: number = 1,
  pageSize: number = config.pagination.defaultPageSize,
  filters?: RmpClassFilter,
) => {
  return useQuery({
    queryKey: ['rmp_classes', 'list', page, pageSize, filters?.search],
    queryFn: () => fetchRmpClassesPaginated({ page, items: pageSize }, filters),
    placeholderData: (prev) => prev,
  });
};

export const useAllRmpClasses = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['rmp_classes', 'all'],
    queryFn: fetchRmpClasses,
    staleTime: config.cache.staleTime,
    enabled: options?.enabled ?? true,
  });
};

export const useAllRmpClassesForImport = () => {
  return useQuery({
    queryKey: ['rmp_classes', 'all_for_import'],
    queryFn: fetchRmpClassesForBulkImport,
    staleTime: config.cache.staleTime,
  });
};

// Custom create hook with multi-image support
export const useCreateRmpClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      data,
      imageFiles,
    }: {
      data: Omit<RmpClass, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'rmp_color'>;
      imageFiles?: RmpClassImageFiles;
    }) => createRmpClass(data, imageFiles),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rmp_classes'] });
      toast.success('RMP Class created successfully');
    },
    onError: () => {
      toast.error('Failed to create RMP Class');
    },
  });
};

// Custom update hook with multi-image support
export const useUpdateRmpClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
      imageFiles,
    }: {
      id: string;
      updates: Partial<Omit<RmpClass, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'rmp_color'>>;
      imageFiles?: RmpClassImageFiles;
    }) => updateRmpClass(id, updates, imageFiles),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rmp_classes'] });
      toast.success('RMP Class updated successfully');
    },
    onError: () => {
      toast.error('Failed to update RMP Class');
    },
  });
};

export const useDeleteRmpClass = () => {
  return useDeleteMutation({
    queryKey: ['rmp_classes'],
    mutationFn: deleteRmpClass,
    successMessage: 'RMP Class deleted successfully',
    errorMessage: 'Failed to delete RMP Class',
  });
};
