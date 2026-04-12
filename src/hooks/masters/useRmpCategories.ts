import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchRmpCategories,
  fetchRmpCategoriesPaginated,
  createRmpCategory,
  updateRmpCategory,
  deleteRmpCategory,
} from '@/services/masters/rmpCategoriesService';
import type { RmpCategory, RmpCategoriesFilter } from '@/services/masters/rmpCategoriesService';
import { useDeleteMutation } from './shared/utils';
import { config } from '@/config/environment';
import { toast } from 'sonner';

export type { RmpCategory, RmpCategoriesFilter };

export const useRmpCategories = (
  page: number = 1,
  pageSize: number = config.pagination.defaultPageSize,
  filters?: RmpCategoriesFilter,
) => {
  return useQuery({
    queryKey: ['rmp_categories', 'list', page, pageSize, filters?.search],
    queryFn: () => fetchRmpCategoriesPaginated({ page, items: pageSize }, filters),
    placeholderData: (prev) => prev,
  });
};

export const useAllRmpCategories = () => {
  return useQuery({
    queryKey: ['rmp_categories', 'all'],
    queryFn: fetchRmpCategories,
    staleTime: config.cache.staleTime,
  });
};

export const useCreateRmpCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      data,
      imageFile,
    }: {
      data: Omit<RmpCategory, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>;
      imageFile?: File;
    }) => createRmpCategory(data, imageFile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rmp_categories'] });
      toast.success('RMP category created successfully');
    },
    onError: () => {
      toast.error('Failed to create RMP category');
    },
  });
};

export const useUpdateRmpCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      updates,
      imageFile,
    }: {
      id: string;
      updates: Partial<Omit<RmpCategory, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>>;
      imageFile?: File;
    }) => updateRmpCategory(id, updates, imageFile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rmp_categories'] });
      toast.success('RMP category updated successfully');
    },
    onError: () => {
      toast.error('Failed to update RMP category');
    },
  });
};

export const useDeleteRmpCategory = () => {
  return useDeleteMutation({
    queryKey: ['rmp_categories'],
    mutationFn: deleteRmpCategory,
    successMessage: 'RMP category deleted successfully',
    errorMessage: 'Failed to delete RMP category',
  });
};
