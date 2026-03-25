import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchBaseProductTypes,
  createBaseProductType,
  updateBaseProductType,
  deleteBaseProductType,
  type BaseProductType,
} from '@/services/masters/baseProductTypesService';
import { toast } from 'sonner';

export const useBaseProductTypes = () => {
  return useQuery({
    queryKey: ['baseProductTypes'],
    queryFn: fetchBaseProductTypes,
  });
};

export const useCreateBaseProductType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createBaseProductType,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['baseProductTypes'] });
      toast.success('Base product type created');
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
      toast.success('Base product type updated');
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
      toast.success('Base product type deleted');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to delete'),
  });
};
