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
    queryKey: ['rmp_categories', 'list', page, pageSize, filters?.search, filters?.includeInactive],
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
    onError: (err) => {
      toast.error('Failed to create RMP category', { description: err instanceof Error ? err.message : String(err) });
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
    onError: (err) => {
      const msg = err instanceof Error ? err.message : String(err);
      const description = msg.toLowerCase().includes('name has already been taken')
        ? `${msg} — another inactive record may have the same name. Rename it first using the Edit (✏️) button, then reactivate.`
        : msg;
      toast.error('Failed to update RMP category', { description });
    },
  });
};

export const useDeleteRmpCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRmpCategory,
    onSuccess: async (_data, id) => {
      // Scott API only soft-deletes (sets is_deleted: true). If the record was already
      // inactive, a refetch with includeInactive=true would bring it back. Instead, we
      // surgically remove the deleted id from every cached page so it disappears immediately.
      queryClient.setQueriesData(
        { queryKey: ['rmp_categories'] },
        (old: unknown) => {
          if (!old || typeof old !== 'object') return old;
          const page = old as { data?: { id: string }[]; [k: string]: unknown };
          if (!Array.isArray(page.data)) return old;
          return { ...page, data: page.data.filter((r) => r.id !== id) };
        },
      );
      await queryClient.invalidateQueries({ queryKey: ['rmp_categories'] });
      toast.success('RMP category deleted successfully');
    },
    onError: (err) => {
      toast.error('Failed to delete RMP category', { description: err instanceof Error ? err.message : String(err) });
    },
  });
};
