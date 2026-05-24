import { useQuery } from '@tanstack/react-query';
import {
  fetchAllTotalInventory,
  fetchTotalInventoryPaginated,
  type TotalInventoryFilter,
} from '@/services/reports/totalInventoryReportService';
import { config } from '@/config/environment';

export type {
  TotalInventoryFilter,
  TotalInventoryRow,
} from '@/services/reports/totalInventoryReportService';

export const useTotalInventoryPaginated = (
  page: number = 1,
  pageSize: number = config.pagination.defaultPageSize,
  filters?: TotalInventoryFilter,
  daysInPeriod = 30,
  enabled = true,
) => {
  return useQuery({
    queryKey: ['total_inventory', page, pageSize, filters, daysInPeriod],
    queryFn: () => fetchTotalInventoryPaginated({ page, items: pageSize }, filters, daysInPeriod),
    staleTime: 0,
    enabled,
    placeholderData: (prev) => prev,
  });
};

export const useAllTotalInventory = (
  filters?: TotalInventoryFilter,
  daysInPeriod = 30,
  enabled = true,
) => {
  return useQuery({
    queryKey: ['total_inventory', 'all', filters, daysInPeriod],
    queryFn: () => fetchAllTotalInventory(filters, daysInPeriod),
    staleTime: 0,
    enabled,
  });
};
