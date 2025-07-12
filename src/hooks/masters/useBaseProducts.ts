
import { useQuery } from '@tanstack/react-query';
import { fetchBaseProducts, createBaseProduct, updateBaseProduct, deleteBaseProduct } from '@/services/masters/baseProductsService';
import { useCreateMutation, useUpdateMutation, useDeleteMutation } from './shared/utils';
import { BaseProduct } from '@/services/masters/baseProductsService';

export const useBaseProducts = () => {
  return useQuery({
    queryKey: ['baseProducts'],
    queryFn: fetchBaseProducts,
  });
};

export const useCreateBaseProduct = () => {
  return useCreateMutation<Omit<BaseProduct, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'category' | 'fabric' | 'size_group'>>({
    queryKey: ['baseProducts'],
    mutationFn: createBaseProduct,
    successMessage: 'Base product created successfully',
    errorMessage: 'Failed to create base product',
  });
};

export const useUpdateBaseProduct = () => {
  return useUpdateMutation<BaseProduct>({
    queryKey: ['baseProducts'],
    mutationFn: ({ id, updates }) => updateBaseProduct(id, updates),
    successMessage: 'Base product updated successfully',
    errorMessage: 'Failed to update base product',
  });
};

export const useDeleteBaseProduct = () => {
  return useDeleteMutation({
    queryKey: ['baseProducts'],
    mutationFn: deleteBaseProduct,
    successMessage: 'Base product deleted successfully',
    errorMessage: 'Failed to delete base product',
  });
};
