import { useQuery } from '@tanstack/react-query';
import {
  fetchRmpBrandOrders,
  fetchRmpClassOrders,
  fetchRmpOrders,
  fetchRmpOrdersPaginated,
  fetchRmpScOrders,
  type RmpBrandOrdersFilter,
  type RmpClassOrdersFilter,
  type RmpScOrdersFilter,
  type RmpSalesFilter,
} from '@/services/reports/rmpSalesReportService';
import { config } from '@/config/environment';

export type {
  RmpSalesFilter,
  RmpBrandOrdersFilter,
  RmpClassOrdersFilter,
  RmpScOrdersFilter,
  RmpOrderRow,
  RmpBrandOrderRow,
  RmpClassOrderRow,
  RmpScOrderRow,
  RmpBreakdownMetrics,
} from '@/services/reports/rmpSalesReportService';

export const useRmpOrders = (
  page: number = 1,
  pageSize: number = config.pagination.defaultPageSize,
  filters?: RmpSalesFilter,
  enabled = true,
) => {
  return useQuery({
    queryKey: ['rmp_sales', 'orders', page, pageSize, filters],
    queryFn: () => fetchRmpOrdersPaginated({ page, items: pageSize }, filters),
    staleTime: 0,
    enabled,
    placeholderData: (prev) => prev,
  });
};

export const useAllRmpOrders = (filters?: RmpSalesFilter, enabled = true) => {
  return useQuery({
    queryKey: ['rmp_sales', 'orders', 'all', filters],
    queryFn: () => fetchRmpOrders(filters),
    staleTime: 0,
    enabled,
  });
};

export const useRmpBrandOrders = (filters?: RmpBrandOrdersFilter, enabled = true) => {
  return useQuery({
    queryKey: ['rmp_sales', 'brand_orders', filters],
    queryFn: () => fetchRmpBrandOrders(filters),
    staleTime: 0,
    enabled,
  });
};

export const useRmpClassOrders = (filters?: RmpClassOrdersFilter, enabled = true) => {
  return useQuery({
    queryKey: ['rmp_sales', 'class_orders', filters],
    queryFn: () => fetchRmpClassOrders(filters),
    staleTime: 0,
    enabled,
  });
};

export const useRmpScOrders = (filters?: RmpScOrdersFilter, enabled = true) => {
  return useQuery({
    queryKey: ['rmp_sales', 'sc_orders', filters],
    queryFn: () => fetchRmpScOrders(filters),
    staleTime: 0,
    enabled,
  });
};
