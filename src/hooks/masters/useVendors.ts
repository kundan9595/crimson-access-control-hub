
import { useQuery } from '@tanstack/react-query';
import { fetchVendors, createVendor, updateVendor, deleteVendor, Vendor } from '@/services/mastersService';
import { useCreateMutation, useUpdateMutation, useDeleteMutation } from './shared/utils';

export const useVendors = () => {
  return useQuery({
    queryKey: ['vendors'],
    queryFn: fetchVendors,
  });
};

export const useCreateVendor = () => {
  return useCreateMutation({
    queryKey: ['vendors'],
    successMessage: "Vendor created successfully",
    errorMessage: "Failed to create vendor",
    mutationFn: createVendor,
  });
};

export const useUpdateVendor = () => {
  return useUpdateMutation<Vendor>({
    queryKey: ['vendors'],
    successMessage: "Vendor updated successfully",
    errorMessage: "Failed to update vendor",
    mutationFn: ({ id, updates }) => updateVendor(id, updates),
  });
};

export const useDeleteVendor = () => {
  return useDeleteMutation({
    queryKey: ['vendors'],
    successMessage: "Vendor deleted successfully",
    errorMessage: "Failed to delete vendor",
    mutationFn: deleteVendor,
  });
};
