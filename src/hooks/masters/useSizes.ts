
import { useQuery } from '@tanstack/react-query';
import { fetchSizeGroups, createSizeGroup, updateSizeGroup, deleteSizeGroup, fetchSizes, createSize, updateSize, deleteSize, SizeGroup, Size } from '@/services/mastersService';
import { useCreateMutation, useUpdateMutation, useDeleteMutation } from './shared/utils';

// Size Group hooks
export const useSizeGroups = () => {
  return useQuery({
    queryKey: ['sizeGroups'],
    queryFn: fetchSizeGroups,
  });
};

export const useCreateSizeGroup = () => {
  return useCreateMutation({
    queryKey: ['sizeGroups'],
    successMessage: "Size group created successfully",
    errorMessage: "Failed to create size group",
    mutationFn: createSizeGroup,
  });
};

export const useUpdateSizeGroup = () => {
  return useUpdateMutation<SizeGroup>({
    queryKey: ['sizeGroups'],
    successMessage: "Size group updated successfully",
    errorMessage: "Failed to update size group",
    mutationFn: ({ id, updates }) => updateSizeGroup(id, updates),
  });
};

export const useDeleteSizeGroup = () => {
  return useDeleteMutation({
    queryKey: ['sizeGroups'],
    successMessage: "Size group deleted successfully",
    errorMessage: "Failed to delete size group",
    mutationFn: deleteSizeGroup,
  });
};

// Size hooks
export const useSizes = () => {
  return useQuery({
    queryKey: ['sizes'],
    queryFn: fetchSizes,
  });
};

export const useCreateSize = () => {
  return useCreateMutation({
    queryKey: ['sizes'],
    successMessage: "Size created successfully",
    errorMessage: "Failed to create size",
    mutationFn: createSize,
  });
};

export const useUpdateSize = () => {
  return useUpdateMutation<Size>({
    queryKey: ['sizes'],
    successMessage: "Size updated successfully",
    errorMessage: "Failed to update size",
    mutationFn: ({ id, updates }) => updateSize(id, updates),
  });
};

export const useDeleteSize = () => {
  return useDeleteMutation({
    queryKey: ['sizes'],
    successMessage: "Size deleted successfully",
    errorMessage: "Failed to delete size",
    mutationFn: deleteSize,
  });
};
