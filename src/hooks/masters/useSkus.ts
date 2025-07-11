
import { useQuery } from '@tanstack/react-query';
import { fetchSkus, createSku, updateSku, deleteSku } from '@/services/masters/skusService';
import { useCreateMutation, useUpdateMutation, useDeleteMutation } from './shared/utils';
import { Sku } from '@/services/masters/types';

export const useSkus = () => {
  return useQuery({
    queryKey: ['skus'],
    queryFn: fetchSkus,
  });
};

export const useCreateSku = () => {
  return useCreateMutation<Omit<Sku, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'class' | 'size'>>({
    queryKey: ['skus'],
    successMessage: 'SKU created successfully',
    errorMessage: 'Failed to create SKU',
    mutationFn: createSku,
  });
};

export const useUpdateSku = () => {
  return useUpdateMutation<Sku>({
    queryKey: ['skus'],
    successMessage: 'SKU updated successfully',
    errorMessage: 'Failed to update SKU',
    mutationFn: updateSku,
  });
};

export const useDeleteSku = () => {
  return useDeleteMutation({
    queryKey: ['skus'],
    successMessage: 'SKU deleted successfully',
    errorMessage: 'Failed to delete SKU',
    mutationFn: deleteSku,
  });
};
