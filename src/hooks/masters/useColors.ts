import { useQuery } from '@tanstack/react-query';
import { useCreateMutation, useUpdateMutation, useDeleteMutation } from './shared/utils';
import {
  fetchColors,
  createColor,
  updateColor,
  deleteColor,
} from '@/services/masters/colorsService';

export const useColors = () => {
  return useQuery({
    queryKey: ['colors'],
    queryFn: fetchColors,
  });
};

export const useCreateColor = () => {
  return useCreateMutation({
    queryKey: ['colors'],
    successMessage: 'Color created successfully',
    errorMessage: 'Failed to create color',
    mutationFn: createColor,
  });
};

export const useUpdateColor = () => {
  return useUpdateMutation({
    queryKey: ['colors'],
    successMessage: 'Color updated successfully',
    errorMessage: 'Failed to update color',
    mutationFn: async ({ id, updates }) => updateColor(id, updates),
  });
};

export const useDeleteColor = () => {
  return useDeleteMutation({
    queryKey: ['colors'],
    successMessage: 'Color deleted successfully',
    errorMessage: 'Failed to delete color',
    mutationFn: deleteColor,
  });
};
