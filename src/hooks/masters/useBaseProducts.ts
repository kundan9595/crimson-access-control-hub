
import { useQuery } from '@tanstack/react-query';
import {
  fetchBaseProducts,
  fetchBaseProductsPaginated,
  createBaseProduct,
  updateBaseProduct,
  deleteBaseProduct,
  type ScottBaseProduct,
} from '@/services/masters/baseProductsServiceScott';
import { useCreateMutation, useUpdateMutation, useDeleteMutation } from './shared/utils';
import { config } from '@/config/environment';

export { type ScottBaseProduct } from '@/services/masters/baseProductsServiceScott';

export const useBaseProducts = (
  page: number = 1,
  pageSize: number = config.pagination.defaultPageSize,
) => {
  return useQuery({
    queryKey: ['baseProducts', 'list', page, pageSize],
    queryFn: () => fetchBaseProductsPaginated({ page, items: pageSize }),
    placeholderData: (prev) => prev,
  });
};

export const useAllBaseProducts = () => {
  return useQuery({
    queryKey: ['baseProducts', 'all'],
    queryFn: fetchBaseProducts,
    staleTime: config.cache.staleTime,
  });
};

export const useCreateBaseProduct = () => {
  return useCreateMutation<{
    data: Omit<
      ScottBaseProduct,
      'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'base_product_type' | 'asset_info'
    >;
    imageFile?: File;
  }>({
    queryKey: ['baseProducts'],
    mutationFn: ({ data, imageFile }) => createBaseProduct(data, imageFile),
    successMessage: 'Base product created successfully',
    errorMessage: 'Failed to create base product',
  });
};

export const useUpdateBaseProduct = () => {
  return useUpdateMutation<{
    id: string;
    data: Partial<
      Omit<
        ScottBaseProduct,
        'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'base_product_type' | 'asset_info'
      >
    >;
    imageFile?: File;
  }>({
    queryKey: ['baseProducts'],
    mutationFn: ({ id, data, imageFile }) => updateBaseProduct(id, data, imageFile),
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
