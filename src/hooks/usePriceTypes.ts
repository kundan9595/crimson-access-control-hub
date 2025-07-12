import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { fetchPriceTypes, createPriceType, updatePriceType, deletePriceType, PriceType } from '@/services/mastersService';

export const usePriceTypes = () => {
  return useQuery({
    queryKey: ['priceTypes'],
    queryFn: fetchPriceTypes,
  });
};

export const useCreatePriceType = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createPriceType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priceTypes'] });
      toast({
        title: "Success",
        description: "Price type created successfully",
      });
    },
    onError: (error) => {
      console.error('Error creating price type:', error);
      toast({
        title: "Error",
        description: "Failed to create price type",
        variant: "destructive",
      });
    },
  });
};

export const useUpdatePriceType = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<PriceType> }) =>
      updatePriceType(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priceTypes'] });
      toast({
        title: "Success",
        description: "Price type updated successfully",
      });
    },
    onError: (error) => {
      console.error('Error updating price type:', error);
      toast({
        title: "Error",
        description: "Failed to update price type",
        variant: "destructive",
      });
    },
  });
};

export const useDeletePriceType = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deletePriceType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priceTypes'] });
      toast({
        title: "Success",
        description: "Price type deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting price type:', error);
      toast({
        title: "Error",
        description: "Failed to delete price type",
        variant: "destructive",
      });
    },
  });
}; 