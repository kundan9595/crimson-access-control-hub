import { useQuery } from '@tanstack/react-query';
import {
  fetchTailorReports,
  fetchTailorReportsPaginated,
  getTailorReportById,
} from '@/services/reports/tailorReportsService';
import type { TailorReport, TailorReportFilter } from '@/services/reports/tailorReportsService';
import { config } from '@/config/environment';

export type { TailorReport, TailorReportFilter };

export const useTailorReports = (
  page: number = 1,
  pageSize: number = config.pagination.defaultPageSize,
  filters?: TailorReportFilter,
) => {
  return useQuery({
    queryKey: ['tailor_reports', 'list', page, pageSize, filters],
    queryFn: () => fetchTailorReportsPaginated({ page, items: pageSize }, filters),
    placeholderData: (prev) => prev,
  });
};

export const useAllTailorReports = (filters?: TailorReportFilter) => {
  return useQuery({
    queryKey: ['tailor_reports', 'all', filters],
    queryFn: () => fetchTailorReports(filters),
    staleTime: 5 * 60 * 1000,
  });
};

export const useTailorReportById = (id: string | null) => {
  return useQuery({
    queryKey: ['tailor_reports', 'detail', id],
    queryFn: () => (id ? getTailorReportById(id) : null),
    enabled: !!id,
  });
};
