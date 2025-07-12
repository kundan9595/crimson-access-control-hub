import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { fetchBrands, createBrand, updateBrand, deleteBrand, Brand } from '@/services/mastersService';

export const useBrands = () => {
  return useQuery({
    queryKey: ['brands'],
    queryFn: fetchBrands,
  });
};

export const useCreateBrand = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createBrand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast({
        title: "Success",
        description: "Brand created successfully",
      });
    },
    onError: (error) => {
      console.error('Error creating brand:', error);
      toast({
        title: "Error",
        description: "Failed to create brand",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateBrand = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Brand> }) =>
      updateBrand(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast({
        title: "Success",
        description: "Brand updated successfully",
      });
    },
    onError: (error) => {
      console.error('Error updating brand:', error);
      toast({
        title: "Error",
        description: "Failed to update brand",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteBrand = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteBrand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast({
        title: "Success",
        description: "Brand deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting brand:', error);
      toast({
        title: "Error",
        description: "Failed to delete brand",
        variant: "destructive",
      });
    },
  });
}; 