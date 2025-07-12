
import { useQuery } from '@tanstack/react-query';
import { profitMarginsService } from '@/services/masters/profitMarginsService';
import { useCreateMutation, useUpdateMutation, useDeleteMutation } from './shared/utils';

export const useProfitMargins = () => {
  return useQuery({
    queryKey: ['profitMargins'],
    queryFn: profitMarginsService.getAll,
  });
};

export const useProfitMargin = (id: string) => {
  return useQuery({
    queryKey: ['profitMargin', id],
    queryFn: () => profitMarginsService.getById(id),
    enabled: !!id,
  });
};

export const useCreateProfitMargin = () => {
  return useCreateMutation({
    queryKey: ['profitMargins'],
    mutationFn: profitMarginsService.create,
    successMessage: 'Profit margin created successfully',
    errorMessage: 'Failed to create profit margin',
  });
};

export const useUpdateProfitMargin = () => {
  return useUpdateMutation({
    queryKey: ['profitMargins'],
    mutationFn: ({ id, updates }: { id: string; updates: any }) => 
      profitMarginsService.update(id, updates),
    successMessage: 'Profit margin updated successfully',
    errorMessage: 'Failed to update profit margin',
  });
};

export const useDeleteProfitMargin = () => {
  return useDeleteMutation({
    queryKey: ['profitMargins'],
    mutationFn: profitMarginsService.delete,
    successMessage: 'Profit margin deleted successfully',
    errorMessage: 'Failed to delete profit margin',
  });
};
