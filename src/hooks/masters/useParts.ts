
import { useQuery } from '@tanstack/react-query';
import { fetchParts, createPart, updatePart, deletePart } from '@/services/masters/partsService';
import { useCreateMutation, useUpdateMutation, useDeleteMutation } from './shared/utils';
import { Part } from '@/services/masters/partsService';

export const useParts = () => {
  return useQuery({
    queryKey: ['parts'],
    queryFn: fetchParts,
  });
};

export const useCreatePart = () => {
  return useCreateMutation<Omit<Part, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>>({
    queryKey: ['parts'],
    mutationFn: createPart,
    successMessage: 'Part created successfully',
    errorMessage: 'Failed to create part',
  });
};

export const useUpdatePart = () => {
  return useUpdateMutation<Part>({
    queryKey: ['parts'],
    mutationFn: ({ id, updates }) => updatePart(id, updates),
    successMessage: 'Part updated successfully',
    errorMessage: 'Failed to update part',
  });
};

export const useDeletePart = () => {
  return useDeleteMutation({
    queryKey: ['parts'],
    mutationFn: deletePart,
    successMessage: 'Part deleted successfully',
    errorMessage: 'Failed to delete part',
  });
};
