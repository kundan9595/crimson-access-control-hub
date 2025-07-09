
import { useQuery } from '@tanstack/react-query';
import { fetchPriceTypes, createPriceType, updatePriceType, deletePriceType, PriceType } from '@/services/mastersService';
import { useCreateMutation, useUpdateMutation, useDeleteMutation } from './shared/utils';

export const usePriceTypes = () => {
  return useQuery({
    queryKey: ['priceTypes'],
    queryFn: fetchPriceTypes,
  });
};

export const useCreatePriceType = () => {
  return useCreateMutation({
    queryKey: ['priceTypes'],
    successMessage: "Price type created successfully",
    errorMessage: "Failed to create price type",
    mutationFn: createPriceType,
  });
};

export const useUpdatePriceType = () => {
  return useUpdateMutation<PriceType>({
    queryKey: ['priceTypes'],
    successMessage: "Price type updated successfully",
    errorMessage: "Failed to update price type",
    mutationFn: ({ id, updates }) => updatePriceType(id, updates),
  });
};

export const useDeletePriceType = () => {
  return useDeleteMutation({
    queryKey: ['priceTypes'],
    successMessage: "Price type deleted successfully",
    errorMessage: "Failed to delete price type",
    mutationFn: deletePriceType,
  });
};
