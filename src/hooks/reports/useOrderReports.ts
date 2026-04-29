import { useQuery } from '@tanstack/react-query';
import {
  fetchOrderReports,
  fetchOrderReportsPaginated,
  getOrderReportById,
} from '@/services/reports/orderReportsService';
import type { OrderReport, OrderReportFilter } from '@/services/reports/orderReportsService';
import { config } from '@/config/environment';

export type { OrderReport, OrderReportFilter };

export const useOrderReports = (
  page: number = 1,
  pageSize: number = config.pagination.defaultPageSize,
  filters?: OrderReportFilter,
) => {
  return useQuery({
    queryKey: ['order_reports', 'list', page, pageSize, filters],
    queryFn: () => fetchOrderReportsPaginated({ page, items: pageSize }, filters),
    placeholderData: (prev) => prev,
  });
};

export const useAllOrderReports = (filters?: OrderReportFilter) => {
  return useQuery({
    queryKey: ['order_reports', 'all', filters],
    queryFn: () => fetchOrderReports(filters),
    staleTime: 5 * 60 * 1000,
  });
};

export const useOrderReportById = (id: string | null) => {
  return useQuery({
    queryKey: ['order_reports', 'detail', id],
    queryFn: () => (id ? getOrderReportById(id) : null),
    enabled: !!id,
  });
};
