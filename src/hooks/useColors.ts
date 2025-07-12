import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { fetchColors, createColor, updateColor, deleteColor, Color } from '@/services/mastersService';

export const useColors = () => {
  return useQuery({
    queryKey: ['colors'],
    queryFn: fetchColors,
  });
};

export const useCreateColor = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createColor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colors'] });
      toast({
        title: "Success",
        description: "Color created successfully",
      });
    },
    onError: (error) => {
      console.error('Error creating color:', error);
      toast({
        title: "Error",
        description: "Failed to create color",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateColor = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Color> }) =>
      updateColor(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colors'] });
      toast({
        title: "Success",
        description: "Color updated successfully",
      });
    },
    onError: (error) => {
      console.error('Error updating color:', error);
      toast({
        title: "Error",
        description: "Failed to update color",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteColor = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteColor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colors'] });
      toast({
        title: "Success",
        description: "Color deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting color:', error);
      toast({
        title: "Error",
        description: "Failed to delete color",
        variant: "destructive",
      });
    },
  });
}; 