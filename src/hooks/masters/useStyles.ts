
import { useQuery } from '@tanstack/react-query';
import { fetchStyles, createStyle, updateStyle, deleteStyle, Style } from '@/services/mastersService';
import { useCreateMutation, useUpdateMutation, useDeleteMutation } from './shared/utils';

export const useStyles = () => {
  return useQuery({
    queryKey: ['styles'],
    queryFn: fetchStyles,
  });
};

export const useCreateStyle = () => {
  return useCreateMutation({
    queryKey: ['styles'],
    successMessage: "Style created successfully",
    errorMessage: "Failed to create style",
    mutationFn: createStyle,
  });
};

export const useUpdateStyle = () => {
  return useUpdateMutation<Style>({
    queryKey: ['styles'],
    successMessage: "Style updated successfully",
    errorMessage: "Failed to update style",
    mutationFn: ({ id, updates }) => updateStyle(id, updates),
  });
};

export const useDeleteStyle = () => {
  return useDeleteMutation({
    queryKey: ['styles'],
    successMessage: "Style deleted successfully",
    errorMessage: "Failed to delete style",
    mutationFn: deleteStyle,
  });
};
