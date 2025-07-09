
import { useQuery } from '@tanstack/react-query';
import { fetchBrands, createBrand, updateBrand, deleteBrand, Brand } from '@/services/mastersService';
import { useCreateMutation, useUpdateMutation, useDeleteMutation } from './shared/utils';

export const useBrands = () => {
  return useQuery({
    queryKey: ['brands'],
    queryFn: fetchBrands,
  });
};

export const useCreateBrand = () => {
  return useCreateMutation({
    queryKey: ['brands'],
    successMessage: "Brand created successfully",
    errorMessage: "Failed to create brand",
    mutationFn: createBrand,
  });
};

export const useUpdateBrand = () => {
  return useUpdateMutation<Brand>({
    queryKey: ['brands'],
    successMessage: "Brand updated successfully",
    errorMessage: "Failed to update brand",
    mutationFn: ({ id, updates }) => updateBrand(id, updates),
  });
};

export const useDeleteBrand = () => {
  return useDeleteMutation({
    queryKey: ['brands'],
    successMessage: "Brand deleted successfully",
    errorMessage: "Failed to delete brand",
    mutationFn: deleteBrand,
  });
};
