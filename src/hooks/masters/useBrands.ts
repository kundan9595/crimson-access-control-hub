
import { useQuery } from '@tanstack/react-query';
import {
  fetchBrands,
  fetchBrandsPaginated,
  createBrand,
  updateBrand,
  deleteBrand,
  Brand,
} from '@/services/mastersService';
import { useCreateMutation, useUpdateMutation, useDeleteMutation } from './shared/utils';
import { config } from '@/config/environment';

/** Server-paginated list for table views. */
export const useBrands = (
  page: number = 1,
  pageSize: number = config.pagination.defaultPageSize,
) => {
  return useQuery({
    queryKey: ['brands', 'list', page, pageSize],
    queryFn: () => fetchBrandsPaginated({ page, items: pageSize }),
    placeholderData: (prev) => prev,
  });
};

/** Full list (all pages) for dropdowns. */
export const useAllBrands = () => {
  return useQuery({
    queryKey: ['brands', 'all'],
    queryFn: fetchBrands,
    staleTime: config.cache.staleTime,
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
