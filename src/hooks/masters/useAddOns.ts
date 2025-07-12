
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { addOnsService, addOnOptionsService, type AddOn, type AddOnOption } from '@/services/masters/addOnsService';
import { toast } from 'sonner';

export const useAddOns = () => {
  return useQuery({
    queryKey: ['add-ons'],
    queryFn: addOnsService.getAll,
  });
};

export const useAddOn = (id: string | undefined) => {
  return useQuery({
    queryKey: ['add-on', id],
    queryFn: () => id ? addOnsService.getById(id) : null,
    enabled: !!id,
  });
};

export const useCreateAddOn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addOnsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['add-ons'] });
      toast.success('Add-on created successfully');
    },
    onError: (error) => {
      console.error('Error creating add-on:', error);
      toast.error('Failed to create add-on');
    },
  });
};

export const useUpdateAddOn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AddOn> }) =>
      addOnsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['add-ons'] });
      toast.success('Add-on updated successfully');
    },
    onError: (error) => {
      console.error('Error updating add-on:', error);
      toast.error('Failed to update add-on');
    },
  });
};

export const useDeleteAddOn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addOnsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['add-ons'] });
      toast.success('Add-on deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting add-on:', error);
      toast.error('Failed to delete add-on');
    },
  });
};

export const useBulkCreateAddOns = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addOnsService.bulkCreate,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['add-ons'] });
      toast.success(`${data.length} add-ons created successfully`);
    },
    onError: (error) => {
      console.error('Error bulk creating add-ons:', error);
      toast.error('Failed to create add-ons');
    },
  });
};

// Add-on options hooks
export const useAddOnOptions = (addOnId: string | undefined) => {
  return useQuery({
    queryKey: ['add-on-options', addOnId],
    queryFn: () => addOnId ? addOnOptionsService.getByAddOnId(addOnId) : [],
    enabled: !!addOnId,
  });
};

export const useCreateAddOnOption = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addOnOptionsService.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['add-on-options', data.add_on_id] });
      queryClient.invalidateQueries({ queryKey: ['add-ons'] });
      toast.success('Add-on option created successfully');
    },
    onError: (error) => {
      console.error('Error creating add-on option:', error);
      toast.error('Failed to create add-on option');
    },
  });
};

export const useUpdateAddOnOption = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AddOnOption> }) =>
      addOnOptionsService.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['add-on-options', data.add_on_id] });
      queryClient.invalidateQueries({ queryKey: ['add-ons'] });
      toast.success('Add-on option updated successfully');
    },
    onError: (error) => {
      console.error('Error updating add-on option:', error);
      toast.error('Failed to update add-on option');
    },
  });
};

export const useDeleteAddOnOption = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addOnOptionsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['add-on-options'] });
      queryClient.invalidateQueries({ queryKey: ['add-ons'] });
      toast.success('Add-on option deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting add-on option:', error);
      toast.error('Failed to delete add-on option');
    },
  });
};
