import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchRmpPrices,
  fetchRmpPricesPaginated,
  createRmpPrice,
  updateRmpPrice,
  deleteRmpPrice,
} from '@/services/masters/rmpPricesService';
import type { RmpPrice, RmpPriceFilter } from '@/services/masters/rmpPricesService';
import { config } from '@/config/environment';
import { toast } from 'sonner';

export type { RmpPrice, RmpPriceFilter };

export const useRmpPrices = (
  page: number = 1,
  pageSize: number = config.pagination.defaultPageSize,
  filters?: RmpPriceFilter,
) => {
  return useQuery({
    queryKey: ['rmp_prices', 'list', page, pageSize, filters?.search],
    queryFn: () => fetchRmpPricesPaginated({ page, items: pageSize }, filters),
    placeholderData: (prev) => prev,
  });
};

export const useAllRmpPrices = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['rmp_prices', 'all'],
    queryFn: fetchRmpPrices,
    staleTime: config.cache.staleTime,
    enabled: options?.enabled ?? true,
  });
};

export const useCreateRmpPrice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<RmpPrice, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'rmp_sku'>) =>
      createRmpPrice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rmp_prices'] });
      toast.success('RMP price created successfully');
    },
    onError: () => {
      toast.error('Failed to create RMP price');
    },
  });
};

export const useUpdateRmpPrice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<RmpPrice, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'rmp_sku'>>;
    }) => updateRmpPrice(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rmp_prices'] });
      toast.success('RMP price updated successfully');
    },
    onError: () => {
      toast.error('Failed to update RMP price');
    },
  });
};

export const useDeleteRmpPrice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRmpPrice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rmp_prices'] });
      toast.success('RMP price deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete RMP price');
    },
  });
};
