import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { fetchZones, createZone, updateZone, deleteZone, Zone } from '@/services/mastersService';

export const useZones = () => {
  return useQuery({
    queryKey: ['zones'],
    queryFn: fetchZones,
  });
};

export const useCreateZone = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createZone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones'] });
      toast({
        title: "Success",
        description: "Zone created successfully",
      });
    },
    onError: (error) => {
      console.error('Error creating zone:', error);
      toast({
        title: "Error",
        description: "Failed to create zone",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateZone = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Zone> }) =>
      updateZone(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones'] });
      toast({
        title: "Success",
        description: "Zone updated successfully",
      });
    },
    onError: (error) => {
      console.error('Error updating zone:', error);
      toast({
        title: "Error",
        description: "Failed to update zone",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteZone = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteZone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones'] });
      toast({
        title: "Success",
        description: "Zone deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting zone:', error);
      toast({
        title: "Error",
        description: "Failed to delete zone",
        variant: "destructive",
      });
    },
  });
}; 