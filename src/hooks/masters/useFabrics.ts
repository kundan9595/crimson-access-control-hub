
import { useQuery } from '@tanstack/react-query';
import {
  fetchFabrics,
  fetchFabricsPaginated,
  createFabric,
  updateFabric,
  deleteFabric,
  type Fabric,
} from '@/services/masters/fabricsServiceScott';
import { useCreateMutation, useUpdateMutation, useDeleteMutation } from './shared/utils';
import { config } from '@/config/environment';

export { type Fabric } from '@/services/masters/fabricsServiceScott';

export const useFabrics = (
  page: number = 1,
  pageSize: number = config.pagination.defaultPageSize,
) => {
  return useQuery({
    queryKey: ['fabrics', 'list', page, pageSize],
    queryFn: () => fetchFabricsPaginated({ page, items: pageSize }),
    placeholderData: (prev) => prev,
  });
};

export const useAllFabrics = () => {
  return useQuery({
    queryKey: ['fabrics', 'all'],
    queryFn: fetchFabrics,
    staleTime: config.cache.staleTime,
  });
};

export const useCreateFabric = () => {
  return useCreateMutation<{
    data: Omit<Fabric, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'colors'>;
    imageFile?: File;
  }>({
    queryKey: ['fabrics'],
    mutationFn: ({ data, imageFile }) => createFabric(data, imageFile),
    successMessage: 'Fabric created successfully',
    errorMessage: 'Failed to create fabric',
  });
};

export const useUpdateFabric = () => {
  return useUpdateMutation<{
    id: string;
    data: Partial<Omit<Fabric, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'colors'>>;
    imageFile?: File;
  }>({
    queryKey: ['fabrics'],
    mutationFn: ({ id, data, imageFile }) => updateFabric(id, data, imageFile),
    successMessage: 'Fabric updated successfully',
    errorMessage: 'Failed to update fabric',
  });
};

export const useDeleteFabric = () => {
  return useDeleteMutation({
    queryKey: ['fabrics'],
    mutationFn: deleteFabric,
    successMessage: 'Fabric deleted successfully',
    errorMessage: 'Failed to delete fabric',
  });
};
