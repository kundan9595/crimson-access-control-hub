import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchRmpPriceTypes,
  fetchRmpPriceTypesPaginated,
  createRmpPriceType,
  updateRmpPriceType,
  deleteRmpPriceType,
} from '@/services/masters/rmpPriceTypesService';
import type { RmpPriceType } from '@/services/masters/rmpPriceTypesService';
import { config } from '@/config/environment';
import { toast } from 'sonner';

export type { RmpPriceType };

export const useRmpPriceTypes = (
  page: number = 1,
  pageSize: number = config.pagination.defaultPageSize,
) => {
  return useQuery({
    queryKey: ['rmp_price_types', 'list', page, pageSize],
    queryFn: () => fetchRmpPriceTypesPaginated({ page, items: pageSize }),
    placeholderData: (prev) => prev,
  });
};

export const useAllRmpPriceTypes = () => {
  return useQuery({
    queryKey: ['rmp_price_types', 'all'],
    queryFn: fetchRmpPriceTypes,
    staleTime: config.cache.staleTime,
  });
};

export const useCreateRmpPriceType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      data: Omit<RmpPriceType, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'zone'>,
    ) => createRmpPriceType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rmp_price_types'] });
      toast.success('RMP price type created successfully');
    },
    onError: () => {
      toast.error('Failed to create RMP price type');
    },
  });
};

export const useUpdateRmpPriceType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<
        Omit<RmpPriceType, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'zone'>
      >;
    }) => updateRmpPriceType(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rmp_price_types'] });
      toast.success('RMP price type updated successfully');
    },
    onError: () => {
      toast.error('Failed to update RMP price type');
    },
  });
};

export const useDeleteRmpPriceType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRmpPriceType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rmp_price_types'] });
      toast.success('RMP price type deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete RMP price type');
    },
  });
};
