
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPriceTypes, createPriceType, updatePriceType, deletePriceType } from '@/services/masters/priceTypesService';
import { PriceType } from '@/services/masters/types';
import { useToast } from '@/hooks/use-toast';

export const usePriceTypes = (distributorId?: string) => {
  return useQuery({
    queryKey: ['priceTypes', distributorId],
    queryFn: () => fetchPriceTypes(distributorId),
    // Always enabled - if distributorId is undefined, fetchPriceTypes will return all (for backward compatibility)
  });
};

export const useCreatePriceType = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: createPriceType,
    onSuccess: async (data) => {
      // Invalidate all priceTypes queries (with and without distributorId)
      await queryClient.invalidateQueries({ queryKey: ['priceTypes'] });
      toast({
        title: "Success",
        description: "Price type created successfully",
      });
    },
    onError: (error: any) => {
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
    onSuccess: async (data) => {
      // Invalidate all priceTypes queries (with and without distributorId)
      await queryClient.invalidateQueries({ queryKey: ['priceTypes'] });
      toast({
        title: "Success",
        description: "Price type updated successfully",
      });
    },
    onError: (error: any) => {
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
    onSuccess: async (data) => {
      // Invalidate all priceTypes queries (with and without distributorId)
      await queryClient.invalidateQueries({ queryKey: ['priceTypes'] });
      toast({
        title: "Success",
        description: "Price type deleted successfully",
      });
    },
    onError: (error: any) => {
      console.error('Error deleting price type:', error);
      toast({
        title: "Error",
        description: "Failed to delete price type",
        variant: "destructive",
      });
    },
  });
};
