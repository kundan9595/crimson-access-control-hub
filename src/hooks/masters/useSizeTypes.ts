import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchSizeTypes,
  createSizeType,
  updateSizeType,
  deleteSizeType,
  type SizeType,
} from '@/services/masters/sizeTypesService';
import { toast } from 'sonner';

export const useSizeTypes = () => {
  return useQuery({
    queryKey: ['sizeTypes'],
    queryFn: fetchSizeTypes,
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
