import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { fetchSizes, createSize, updateSize, deleteSize, Size } from '@/services/mastersService';

export const useSizes = () => {
  return useQuery({
    queryKey: ['sizes'],
    queryFn: fetchSizes,
  });
};

export const useCreateSize = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createSize,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sizes'] });
      toast({
        title: "Success",
        description: "Size created successfully",
      });
    },
    onError: (error) => {
      console.error('Error creating size:', error);
      toast({
        title: "Error",
        description: "Failed to create size",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateSize = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Size> }) =>
      updateSize(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sizes'] });
      toast({
        title: "Success",
        description: "Size updated successfully",
      });
    },
    onError: (error) => {
      console.error('Error updating size:', error);
      toast({
        title: "Error",
        description: "Failed to update size",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteSize = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteSize,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sizes'] });
      toast({
        title: "Success",
        description: "Size deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting size:', error);
      toast({
        title: "Error",
        description: "Failed to delete size",
        variant: "destructive",
      });
    },
  });
}; 