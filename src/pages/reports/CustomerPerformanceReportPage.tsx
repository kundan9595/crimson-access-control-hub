import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Download, Users, AlertTriangle } from 'lucide-react';
import { MasterServerPagination } from '@/components/masters/shared/MasterServerPagination';
import {
  createDefaultCustomerPerformanceFilters,
  CustomerPerformancePeriodFilters,
} from '@/components/reports/CustomerPerformancePeriodFilters';
import { CustomerPerformanceKpiCards } from '@/components/reports/CustomerPerformanceKpiCards';
import {
  CUSTOMER_COMPARISON_EXPORT_HEADERS,
  CustomerComparisonTable,
  customerComparisonExportFieldMap,
} from '@/components/reports/CustomerComparisonTable';
import {
  useCustomerPerformanceReport,
  type CustomerPerformanceAppliedFilters,
} from '@/hooks/reports/useCustomerPerformanceReport';
import { auditCustomerPerformanceFields } from '@/services/reports/customerPerformanceReportService';
import {
  resolveCustomerPerformancePeriodRange,
  unionPeriodRange,
} from '@/utils/customerPerformancePeriod';
import { exportToCSV, generateExportFilename } from '@/utils/exportUtils';
import { config } from '@/config/environment';
import { toast } from 'sonner';

const CustomerPerformanceReportPage = () => {
  const navigate = useNavigate();
  const [filtersDraft, setFiltersDraft] = useState(createDefaultCustomerPerformanceFilters);
  const [filtersApplied, setFiltersApplied] = useState(createDefaultCustomerPerformanceFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(config.pagination.defaultPageSize);

  const hasPendingChanges = useMemo(
    () => JSON.stringify(filtersDraft) !== JSON.stringify(filtersApplied),
    [filtersDraft, filtersApplied],
  );

  const appliedQuery = useMemo((): CustomerPerformanceAppliedFilters => {
    const rangeA = resolveCustomerPerformancePeriodRange(filtersApplied.periodA);
    const rangeB = resolveCustomerPerformancePeriodRange(filtersApplied.periodB);
    const kpiRange = unionPeriodRange(filtersApplied.periodA, filtersApplied.periodB);
    return {
      growthPeriod: filtersApplied.growthPeriod,
      periodAStart: rangeA.startDate,
      periodAEnd: rangeA.endDate,
      periodBStart: rangeB.startDate,
      periodBEnd: rangeB.endDate,
      kpiStart: kpiRange.startDate,
      kpiEnd: kpiRange.endDate,
    };
  }, [filtersApplied]);

  const { data, isLoading, isFetching, error } = useCustomerPerformanceReport(appliedQuery);

  const allRows = data?.comparisonRows ?? [];
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return allRows.slice(start, start + pageSize);
  }, [allRows, page, pageSize]);

  const paginationResult = useMemo(() => {
    if (!allRows.length && !isLoading) return null;
    return {
      data: paginatedRows,
      page,
      pageSize,
      totalCount: allRows.length,
      totalPages: Math.max(1, Math.ceil(allRows.length / pageSize)),
      totalCountIsExact: true,
    };
  }, [allRows.length, paginatedRows, page, pageSize, isLoading]);

  useEffect(() => {
    if (allRows.length > 0 && import.meta.env.DEV) {
      auditCustomerPerformanceFields(allRows);
    }
  }, [allRows]);

  useEffect(() => {
    if (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load customer performance');
    }
  }, [error]);

  const applyFilters = () => {
    setFiltersApplied(filtersDraft);
    setPage(1);
  };

  const resetAll = () => {
    const defaults = createDefaultCustomerPerformanceFilters();
    setFiltersDraft(defaults);
    setFiltersApplied(defaults);
    setPage(1);
  };

  const handleExport = () => {
    if (!allRows.length) {
      toast.error('No data to export');
      return;
    }
    exportToCSV({
      filename: generateExportFilename('customer-performance-report'),
      headers: CUSTOMER_COMPARISON_EXPORT_HEADERS,
      data: allRows,
      fieldMap: customerComparisonExportFieldMap(),
    });
    toast.success(`Exported ${allRows.length} rows`);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/reports')} className="-ml-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Reports
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Customer Performance Report</h1>
              <Badge variant="outline">Customers</Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              Unique customer KPIs and dual-period comparison with WoW, MoM, quarterly, and yearly
              growth views.
            </p>
          </div>
        </div>
      </div>

      <CustomerPerformanceKpiCards summary={data?.summary} isLoading={isLoading} />

      {data?.usedMockData && import.meta.env.DEV && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Scott API returned no performance rows — showing development mock data for layout
            verification.
          </AlertDescription>
        </Alert>
      )}

      <Card className="sticky top-0 z-10 shadow-sm">
        <CardContent className="p-4 space-y-4">
          <CustomerPerformancePeriodFilters value={filtersDraft} onChange={setFiltersDraft} />
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={applyFilters}>Apply</Button>
            <Button variant="outline" onClick={resetAll}>
              Reset
            </Button>
            {hasPendingChanges && (
              <span className="text-sm text-muted-foreground">Unapplied filter changes</span>
            )}
            <div className="flex-1" />
            <Button variant="outline" onClick={handleExport} disabled={!allRows.length}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <CustomerComparisonTable
            rows={paginatedRows}
            isLoading={isLoading}
            error={error}
          />
          {!isLoading && !error && paginationResult && paginationResult.totalCount > 0 && (
            <div className="mt-4">
              <MasterServerPagination
                result={paginationResult}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
                disabled={isLoading || isFetching}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerPerformanceReportPage;
