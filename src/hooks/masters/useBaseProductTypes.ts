import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchBaseProductTypes,
  fetchBaseProductTypesPaginated,
  createBaseProductType,
  updateBaseProductType,
  deleteBaseProductType,
  type BaseProductType,
} from '@/services/masters/baseProductTypesService';
import { toast } from 'sonner';
import { config } from '@/config/environment';

export const useBaseProductTypes = (
  page: number = 1,
  pageSize: number = config.pagination.defaultPageSize,
) => {
  return useQuery({
    queryKey: ['baseProductTypes', 'list', page, pageSize],
    queryFn: () => fetchBaseProductTypesPaginated({ page, items: pageSize }),
    placeholderData: (prev) => prev,
  });
};

export const useAllBaseProductTypes = () => {
  return useQuery({
    queryKey: ['baseProductTypes', 'all'],
    queryFn: fetchBaseProductTypes,
    staleTime: config.cache.staleTime,
  });
};

export const useCreateBaseProductType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createBaseProductType,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['baseProductTypes'] });
      toast.success('Parent category created');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to create'),
  });
};

export const useUpdateBaseProductType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Pick<BaseProductType, 'name' | 'status' | 'position' | 'image_url'>>;
    }) => updateBaseProductType(id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['baseProductTypes'] });
      toast.success('Parent category updated');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to update'),
  });
};

export const useDeleteBaseProductType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteBaseProductType,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['baseProductTypes'] });
      toast.success('Parent category deleted');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to delete'),
  });
};
