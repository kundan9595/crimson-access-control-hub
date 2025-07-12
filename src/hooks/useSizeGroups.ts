import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { fetchSizeGroups, createSizeGroup, updateSizeGroup, deleteSizeGroup, SizeGroup } from '@/services/mastersService';

export const useSizeGroups = () => {
  return useQuery({
    queryKey: ['sizeGroups'],
    queryFn: fetchSizeGroups,
  });
};

export const useCreateSizeGroup = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createSizeGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sizeGroups'] });
      toast({
        title: "Success",
        description: "Size group created successfully",
      });
    },
    onError: (error) => {
      console.error('Error creating size group:', error);
      toast({
        title: "Error",
        description: "Failed to create size group",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateSizeGroup = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<SizeGroup> }) =>
      updateSizeGroup(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sizeGroups'] });
      toast({
        title: "Success",
        description: "Size group updated successfully",
      });
    },
    onError: (error) => {
      console.error('Error updating size group:', error);
      toast({
        title: "Error",
        description: "Failed to update size group",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteSizeGroup = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteSizeGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sizeGroups'] });
      toast({
        title: "Success",
        description: "Size group deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting size group:', error);
      toast({
        title: "Error",
        description: "Failed to delete size group",
        variant: "destructive",
      });
    },
  });
}; 