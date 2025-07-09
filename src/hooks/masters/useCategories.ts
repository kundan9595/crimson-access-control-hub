
import { useQuery } from '@tanstack/react-query';
import { fetchCategories, createCategory, updateCategory, deleteCategory, Category } from '@/services/mastersService';
import { useCreateMutation, useUpdateMutation, useDeleteMutation } from './shared/utils';

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });
};

export const useCreateCategory = () => {
  return useCreateMutation({
    queryKey: ['categories'],
    successMessage: "Category created successfully",
    errorMessage: "Failed to create category",
    mutationFn: createCategory,
  });
};

export const useUpdateCategory = () => {
  return useUpdateMutation<Category>({
    queryKey: ['categories'],
    successMessage: "Category updated successfully",
    errorMessage: "Failed to update category",
    mutationFn: ({ id, updates }) => updateCategory(id, updates),
  });
};

export const useDeleteCategory = () => {
  return useDeleteMutation({
    queryKey: ['categories'],
    successMessage: "Category deleted successfully",
    errorMessage: "Failed to delete category",
    mutationFn: deleteCategory,
  });
};
