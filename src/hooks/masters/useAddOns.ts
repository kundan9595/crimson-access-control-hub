
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAddOns,
  fetchAddOnsPaginated,
  getAddOnById,
  createAddOn,
  updateAddOn,
  deleteAddOn,
  updateAddOnColors,
  updateAddOnBaseProducts,
  type AddOn,
  type AddOnFilter,
} from '@/services/masters/addOnsServiceScott';
import { toast } from 'sonner';
import { config } from '@/config/environment';

export { type AddOn, type AddOnFilter } from '@/services/masters/addOnsServiceScott';

export const useAddOns = (
  page: number = 1,
  pageSize: number = config.pagination.defaultPageSize,
  filters?: AddOnFilter,
) => {
  return useQuery({
    queryKey: ['add-ons', 'list', page, pageSize, filters?.search],
    queryFn: () => fetchAddOnsPaginated({ page, items: pageSize }, filters),
    placeholderData: (prev) => prev,
  });
};

export const useAllAddOns = () => {
  return useQuery({
    queryKey: ['add-ons', 'all'],
    queryFn: fetchAddOns,
    staleTime: config.cache.staleTime,
  });
};

export const useAddOn = (id: string | undefined) => {
  return useQuery({
    queryKey: ['add-on', id],
    queryFn: () => (id ? getAddOnById(id) : null),
    enabled: !!id,
  });
};

export const useCreateAddOn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      data,
      imageFile,
    }: {
      data: Omit<AddOn, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'image_url'>;
      imageFile?: File;
    }) => createAddOn(data, imageFile),
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
    mutationFn: ({
      id,
      data,
      imageFile,
    }: {
      id: string;
      data: Partial<Omit<AddOn, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'image_url'>>;
      imageFile?: File;
    }) => updateAddOn(id, data, imageFile),
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
    mutationFn: deleteAddOn,
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

// Update add-on colors
export const useUpdateAddOnColors = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, colorIds }: { id: string; colorIds: string[] }) =>
      updateAddOnColors(id, colorIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['add-ons'] });
      toast.success('Add-on colors updated successfully');
    },
    onError: (error) => {
      console.error('Error updating add-on colors:', error);
      toast.error('Failed to update add-on colors');
    },
  });
};

// Update add-on base products
export const useUpdateAddOnBaseProducts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, baseProductIds }: { id: string; baseProductIds: string[] }) =>
      updateAddOnBaseProducts(id, baseProductIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['add-ons'] });
      toast.success('Add-on base products updated successfully');
    },
    onError: (error) => {
      console.error('Error updating add-on base products:', error);
      toast.error('Failed to update add-on base products');
    },
  });
};
