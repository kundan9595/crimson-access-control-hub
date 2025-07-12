import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { fetchVendors, createVendor, updateVendor, deleteVendor, Vendor } from '@/services/mastersService';

export const useVendors = () => {
  return useQuery({
    queryKey: ['vendors'],
    queryFn: fetchVendors,
  });
};

export const useCreateVendor = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createVendor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast({
        title: "Success",
        description: "Vendor created successfully",
      });
    },
    onError: (error) => {
      console.error('Error creating vendor:', error);
      toast({
        title: "Error",
        description: "Failed to create vendor",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateVendor = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Vendor> }) =>
      updateVendor(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast({
        title: "Success",
        description: "Vendor updated successfully",
      });
    },
    onError: (error) => {
      console.error('Error updating vendor:', error);
      toast({
        title: "Error",
        description: "Failed to update vendor",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteVendor = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteVendor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast({
        title: "Success",
        description: "Vendor deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting vendor:', error);
      toast({
        title: "Error",
        description: "Failed to delete vendor",
        variant: "destructive",
      });
    },
  });
}; 