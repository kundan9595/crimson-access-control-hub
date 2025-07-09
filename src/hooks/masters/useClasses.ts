
import { useQuery } from '@tanstack/react-query';
import { fetchClasses, createClass, updateClass, deleteClass, Class } from '@/services/mastersService';
import { useCreateMutation, useUpdateMutation, useDeleteMutation } from './shared/utils';

export const useClasses = () => {
  return useQuery({
    queryKey: ['classes'],
    queryFn: fetchClasses,
  });
};

export const useCreateClass = () => {
  return useCreateMutation({
    queryKey: ['classes'],
    successMessage: "Class created successfully",
    errorMessage: "Failed to create class",
    mutationFn: createClass,
  });
};

export const useUpdateClass = () => {
  return useUpdateMutation<Class>({
    queryKey: ['classes'],
    successMessage: "Class updated successfully",
    errorMessage: "Failed to update class",
    mutationFn: ({ id, updates }) => updateClass(id, updates),
  });
};

export const useDeleteClass = () => {
  return useDeleteMutation({
    queryKey: ['classes'],
    successMessage: "Class deleted successfully",
    errorMessage: "Failed to delete class",
    mutationFn: deleteClass,
  });
};
