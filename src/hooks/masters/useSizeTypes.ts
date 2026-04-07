import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchSizeTypes,
  fetchSizeTypesPaginated,
  createSizeType,
  updateSizeType,
  deleteSizeType,
  type SizeType,
} from '@/services/masters/sizeTypesService';
import { toast } from 'sonner';
import { config } from '@/config/environment';

export const useSizeTypes = (
  page: number = 1,
  pageSize: number = config.pagination.defaultPageSize,
) => {
  return useQuery({
    queryKey: ['sizeTypes', 'list', page, pageSize],
    queryFn: () => fetchSizeTypesPaginated({ page, items: pageSize }),
    placeholderData: (prev) => prev,
  });
};

export const useAllSizeTypes = () => {
  return useQuery({
    queryKey: ['sizeTypes', 'all'],
    queryFn: fetchSizeTypes,
    staleTime: config.cache.staleTime,
  });
};

export const useCreateSizeType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createSizeType,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sizeTypes'] });
      toast.success('Size type created');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to create'),
  });
};

export const useUpdateSizeType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Pick<SizeType, 'name' | 'status'>> }) =>
      updateSizeType(id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sizeTypes'] });
      toast.success('Size type updated');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to update'),
  });
};

export const useDeleteSizeType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteSizeType,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sizeTypes'] });
      toast.success('Size type deleted');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to delete'),
  });
};
