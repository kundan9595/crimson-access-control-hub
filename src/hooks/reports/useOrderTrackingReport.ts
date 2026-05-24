import { useQuery } from '@tanstack/react-query';
import {
  fetchAllOrderTracking,
  fetchOrderTrackingPaginated,
  type OrderTrackingFilter,
} from '@/services/reports/orderTrackingReportService';
import { config } from '@/config/environment';

export type {
  OrderTrackingFilter,
  OrderTrackingRow,
  OrderTrackingReportType,
  OrderTrackingReportTypeFilter,
  TriStateFilter,
} from '@/services/reports/orderTrackingReportService';

export const useOrderTrackingPaginated = (
  page: number = 1,
  pageSize: number = config.pagination.defaultPageSize,
  filters?: OrderTrackingFilter,
  enabled = true,
) => {
  return useQuery({
    queryKey: ['order_tracking', 'orders', page, pageSize, filters],
    queryFn: () => fetchOrderTrackingPaginated({ page, items: pageSize }, filters),
    staleTime: 0,
    enabled,
    placeholderData: (prev) => prev,
  });
};

export const useAllOrderTracking = (filters?: OrderTrackingFilter, enabled = true) => {
  return useQuery({
    queryKey: ['order_tracking', 'orders', 'all', filters],
    queryFn: () => fetchAllOrderTracking(filters),
    staleTime: 0,
    enabled,
  });
};
