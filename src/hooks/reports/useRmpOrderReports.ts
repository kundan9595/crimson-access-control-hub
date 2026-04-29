import { useQuery } from '@tanstack/react-query';
import {
  fetchRmpOrderReports,
  fetchRmpOrderReportsPaginated,
  getRmpOrderReportById,
} from '@/services/reports/rmpOrderReportsService';
import type { RmpOrderReport, RmpOrderReportFilter } from '@/services/reports/rmpOrderReportsService';
import { config } from '@/config/environment';

export type { RmpOrderReport, RmpOrderReportFilter };

export const useRmpOrderReports = (
  page: number = 1,
  pageSize: number = config.pagination.defaultPageSize,
  filters?: RmpOrderReportFilter,
) => {
  return useQuery({
    queryKey: ['rmp_order_reports', 'list', page, pageSize, filters],
    queryFn: () => fetchRmpOrderReportsPaginated({ page, items: pageSize }, filters),
    placeholderData: (prev) => prev,
  });
};

export const useAllRmpOrderReports = (filters?: RmpOrderReportFilter) => {
  return useQuery({
    queryKey: ['rmp_order_reports', 'all', filters],
    queryFn: () => fetchRmpOrderReports(filters),
    staleTime: 5 * 60 * 1000,
  });
};

export const useRmpOrderReportById = (id: string | null) => {
  return useQuery({
    queryKey: ['rmp_order_reports', 'detail', id],
    queryFn: () => (id ? getRmpOrderReportById(id) : null),
    enabled: !!id,
  });
};
