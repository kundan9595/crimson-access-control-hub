
import { useQuery } from '@tanstack/react-query';
import { fetchZones, createZone, updateZone, deleteZone, Zone } from '@/services/mastersService';
import { useCreateMutation, useUpdateMutation, useDeleteMutation } from './shared/utils';

export const useZones = () => {
  return useQuery({
    queryKey: ['zones'],
    queryFn: fetchZones,
  });
};

export const useCreateZone = () => {
  return useCreateMutation({
    queryKey: ['zones'],
    successMessage: "Zone created successfully",
    errorMessage: "Failed to create zone",
    mutationFn: createZone,
  });
};

export const useUpdateZone = () => {
  return useUpdateMutation<Zone>({
    queryKey: ['zones'],
    successMessage: "Zone updated successfully",
    errorMessage: "Failed to update zone",
    mutationFn: ({ id, updates }) => updateZone(id, updates),
  });
};

export const useDeleteZone = () => {
  return useDeleteMutation({
    queryKey: ['zones'],
    successMessage: "Zone deleted successfully",
    errorMessage: "Failed to delete zone",
    mutationFn: deleteZone,
  });
};
