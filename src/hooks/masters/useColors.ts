
import { useQuery } from '@tanstack/react-query';
import { fetchColors, createColor, updateColor, deleteColor, Color } from '@/services/mastersService';
import { useCreateMutation, useUpdateMutation, useDeleteMutation } from './shared/utils';

export const useColors = () => {
  return useQuery({
    queryKey: ['colors'],
    queryFn: fetchColors,
  });
};

export const useCreateColor = () => {
  return useCreateMutation({
    queryKey: ['colors'],
    successMessage: "Color created successfully",
    errorMessage: "Failed to create color",
    mutationFn: createColor,
  });
};

export const useUpdateColor = () => {
  return useUpdateMutation<Color>({
    queryKey: ['colors'],
    successMessage: "Color updated successfully",
    errorMessage: "Failed to update color",
    mutationFn: ({ id, updates }) => updateColor(id, updates),
  });
};

export const useDeleteColor = () => {
  return useDeleteMutation({
    queryKey: ['colors'],
    successMessage: "Color deleted successfully",
    errorMessage: "Failed to delete color",
    mutationFn: deleteColor,
  });
};
