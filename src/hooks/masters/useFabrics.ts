
import { useQuery } from '@tanstack/react-query';
import { fetchFabrics, createFabric, updateFabric, deleteFabric } from '@/services/masters/fabricsService';
import { useCreateMutation, useUpdateMutation, useDeleteMutation } from './shared/utils';
import { Fabric } from '@/services/masters/types';

export const useFabrics = () => {
  return useQuery({
    queryKey: ['fabrics'],
    queryFn: fetchFabrics,
  });
};

export const useCreateFabric = () => {
  return useCreateMutation<Omit<Fabric, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>>({
    queryKey: ['fabrics'],
    mutationFn: createFabric,
    successMessage: 'Fabric created successfully',
    errorMessage: 'Failed to create fabric',
  });
};

export const useUpdateFabric = () => {
  return useUpdateMutation<Fabric>({
    queryKey: ['fabrics'],
    mutationFn: ({ id, updates }) => updateFabric(id, updates),
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
