import { useQuery } from '@tanstack/react-query';
import {
  buildPerformanceFilters,
  fetchCustomerPerformance,
  fetchUniqueCustomersSummary,
  getMockComparisonData,
  mergeComparisonRows,
  type CustomerComparisonRow,
  type CustomerPerformanceFilter,
  type UniqueCustomersSummary,
} from '@/services/reports/customerPerformanceReportService';
import type { CustomerPerformanceGrowthPeriod } from '@/utils/customerPerformancePeriod';

export type CustomerPerformanceAppliedFilters = {
  growthPeriod: CustomerPerformanceGrowthPeriod;
  periodAStart: string;
  periodAEnd: string;
  periodBStart: string;
  periodBEnd: string;
  kpiStart: string;
  kpiEnd: string;
};

export type CustomerPerformanceReportData = {
  summary: UniqueCustomersSummary;
  comparisonRows: CustomerComparisonRow[];
  usedMockData: boolean;
};

async function loadReportData(
  filters: CustomerPerformanceAppliedFilters,
): Promise<CustomerPerformanceReportData> {
  const filtersA = buildPerformanceFilters(
    filters.periodAStart,
    filters.periodAEnd,
    filters.growthPeriod,
  );
  const filtersB = buildPerformanceFilters(
    filters.periodBStart,
    filters.periodBEnd,
    filters.growthPeriod,
  );

  const [summary, periodA, periodB] = await Promise.all([
    fetchUniqueCustomersSummary(filters.kpiStart, filters.kpiEnd),
    fetchCustomerPerformance(filtersA),
    fetchCustomerPerformance(filtersB),
  ]);

  let rowsA = periodA;
  let rowsB = periodB;
  let usedMockData = false;

  if (import.meta.env.DEV && rowsA.length === 0 && rowsB.length === 0) {
    const mock = getMockComparisonData();
    rowsA = mock.periodA;
    rowsB = mock.periodB;
    usedMockData = true;
  }

  return {
    summary,
    comparisonRows: mergeComparisonRows(rowsA, rowsB),
    usedMockData,
  };
}

export const useCustomerPerformanceReport = (
  filters: CustomerPerformanceAppliedFilters | null,
  enabled = true,
) => {
  return useQuery({
    queryKey: ['customer_performance', filters],
    queryFn: () => loadReportData(filters!),
    staleTime: 0,
    enabled: enabled && filters != null,
  });
};

export type {
  CustomerComparisonRow,
  CustomerPerformanceFilter,
  UniqueCustomersSummary,
};
