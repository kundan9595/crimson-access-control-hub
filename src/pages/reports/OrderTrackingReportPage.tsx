import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ClipboardList, Download } from 'lucide-react';
import { MasterServerPagination } from '@/components/masters/shared/MasterServerPagination';
import {
  createDefaultOrderTrackingFilters,
  OrderTrackingFilters,
  type OrderTrackingFiltersState,
} from '@/components/reports/OrderTrackingFilters';
import { OrderTrackingPeriodFilters } from '@/components/reports/OrderTrackingPeriodFilters';
import {
  ORDER_TRACKING_EXPORT_HEADERS,
  OrderTrackingTable,
  orderTrackingExportFieldMap,
} from '@/components/reports/OrderTrackingTable';
import {
  useAllOrderTracking,
  useOrderTrackingPaginated,
} from '@/hooks/reports/useOrderTrackingReport';
import {
  applyClientBooleanFilters,
  auditOrderTrackingFields,
  formatDateForScott,
  needsClientSideBooleanFiltering,
  type OrderTrackingFilter,
} from '@/services/reports/orderTrackingReportService';
import {
  createDefaultOrderTrackingPeriod,
  resolveOrderTrackingPeriodRange,
  type OrderTrackingPeriodConfig,
} from '@/utils/orderTrackingPeriod';
import { exportToCSV, generateExportFilename } from '@/utils/exportUtils';
import { config } from '@/config/environment';
import { toast } from 'sonner';

type PeriodState = {
  draft: OrderTrackingPeriodConfig;
  applied: OrderTrackingPeriodConfig;
};

function createDefaultPeriodState(): PeriodState {
  const defaults = createDefaultOrderTrackingPeriod();
  return { draft: defaults, applied: defaults };
}

function buildApiFilters(
  filters: OrderTrackingFiltersState,
  period: OrderTrackingPeriodConfig,
): OrderTrackingFilter {
  const { startDate, endDate } = resolveOrderTrackingPeriodRange(period);
  const apiFilters: OrderTrackingFilter = {
    start_date: formatDateForScott(startDate),
    end_date: formatDateForScott(endDate),
  };
  if (filters.reportType !== 'all') {
    apiFilters.report_type = filters.reportType;
  }
  return apiFilters;
}

const OrderTrackingReportPage = () => {
  const navigate = useNavigate();
  const [filtersDraft, setFiltersDraft] = useState(createDefaultOrderTrackingFilters);
  const [filtersApplied, setFiltersApplied] = useState(createDefaultOrderTrackingFilters);
  const [periodState, setPeriodState] = useState<PeriodState>(createDefaultPeriodState);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(config.pagination.defaultPageSize);

  const hasPendingFilterChanges = useMemo(
    () => JSON.stringify(filtersDraft) !== JSON.stringify(filtersApplied),
    [filtersDraft, filtersApplied],
  );

  const hasPendingPeriodChanges = useMemo(
    () => JSON.stringify(periodState.draft) !== JSON.stringify(periodState.applied),
    [periodState.draft, periodState.applied],
  );

  const clientFilterActive = useMemo(
    () => needsClientSideBooleanFiltering(filtersApplied),
    [filtersApplied],
  );

  const apiFilters = useMemo(
    () => buildApiFilters(filtersApplied, periodState.applied),
    [filtersApplied, periodState.applied],
  );

  const {
    data: paginatedData,
    isLoading: paginatedLoading,
    isFetching: paginatedFetching,
    error: paginatedError,
  } = useOrderTrackingPaginated(page, pageSize, apiFilters, !clientFilterActive);

  const {
    data: allRows,
    isLoading: allLoading,
    isFetching: allFetching,
    error: allError,
  } = useAllOrderTracking(apiFilters, clientFilterActive);

  const filteredAllRows = useMemo(() => {
    if (!clientFilterActive || !allRows) return [];
    return applyClientBooleanFilters(allRows, {
      isOverdue: filtersApplied.isOverdue,
      isFailed: filtersApplied.isFailed,
      isOos: filtersApplied.isOos,
    });
  }, [allRows, clientFilterActive, filtersApplied]);

  const clientPageRows = useMemo(() => {
    if (!clientFilterActive) return [];
    const start = (page - 1) * pageSize;
    return filteredAllRows.slice(start, start + pageSize);
  }, [clientFilterActive, filteredAllRows, page, pageSize]);

  const displayRows = clientFilterActive ? clientPageRows : (paginatedData?.data ?? []);

  const paginationResult = useMemo(() => {
    if (clientFilterActive) {
      if (!filteredAllRows.length && !allLoading) return null;
      return {
        data: clientPageRows,
        page,
        pageSize,
        totalCount: filteredAllRows.length,
        totalPages: Math.max(1, Math.ceil(filteredAllRows.length / pageSize) || 1),
        totalCountIsExact: true,
      };
    }
    return paginatedData ?? null;
  }, [
    clientFilterActive,
    clientPageRows,
    page,
    pageSize,
    filteredAllRows.length,
    allLoading,
    paginatedData,
  ]);

  const isLoading = clientFilterActive ? allLoading : paginatedLoading;
  const isFetching = clientFilterActive ? allFetching : paginatedFetching;
  const error = clientFilterActive ? allError : paginatedError;

  useEffect(() => {
    const rowsToAudit = clientFilterActive ? filteredAllRows : (paginatedData?.data ?? []);
    if (rowsToAudit.length > 0 && import.meta.env.DEV) {
      auditOrderTrackingFields(rowsToAudit);
    }
  }, [clientFilterActive, filteredAllRows, paginatedData?.data]);

  useEffect(() => {
    if (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load order tracking data');
    }
  }, [error]);

  const applyFilters = () => {
    setFiltersApplied(filtersDraft);
    setPeriodState((p) => ({ ...p, applied: p.draft }));
    setPage(1);
  };

  const resetAll = () => {
    setFiltersDraft(createDefaultOrderTrackingFilters());
    setFiltersApplied(createDefaultOrderTrackingFilters());
    const defaults = createDefaultPeriodState();
    setPeriodState(defaults);
    setPage(1);
  };

  const handleExport = async () => {
    const toastId = toast.loading('Preparing order tracking export…');
    let exportRows = displayRows;

    if (clientFilterActive) {
      exportRows = filteredAllRows;
    } else if (paginatedData?.data?.length) {
      try {
        const { fetchAllOrderTracking } = await import(
          '@/services/reports/orderTrackingReportService'
        );
        const all = await fetchAllOrderTracking(apiFilters);
        exportRows = applyClientBooleanFilters(all, {
          isOverdue: filtersApplied.isOverdue,
          isFailed: filtersApplied.isFailed,
          isOos: filtersApplied.isOos,
        });
      } catch {
        toast.error('Failed to fetch all rows for export', { id: toastId });
        return;
      }
    }

    if (!exportRows.length) {
      toast.error('No data to export', { id: toastId });
      return;
    }

    exportToCSV({
      filename: generateExportFilename('order-tracking-report'),
      headers: ORDER_TRACKING_EXPORT_HEADERS,
      data: exportRows,
      fieldMap: orderTrackingExportFieldMap(),
    });
    toast.success(`Export ready — ${exportRows.length} rows downloading now`, { id: toastId, duration: 3000 });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/reports')} className="-ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
              <ClipboardList className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">Order Tracking Report</h1>
                <Badge variant="outline">Tracking</Badge>
              </div>
              <p className="text-muted-foreground text-sm">
                Pending, overdue, and failed order line items. Some fields (e.g. Uniware_reason, Is
                OOS) may show &quot;-&quot; if not returned by the API for your environment.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Card className="sticky top-0 z-10 shadow-sm">
        <CardContent className="p-4 space-y-4">
          <OrderTrackingFilters value={filtersDraft} onChange={setFiltersDraft} />
          <OrderTrackingPeriodFilters
            value={periodState.draft}
            onChange={(draft) => setPeriodState((p) => ({ ...p, draft }))}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={applyFilters}>Apply</Button>
            <Button variant="outline" onClick={resetAll}>
              Reset
            </Button>
            {(hasPendingFilterChanges || hasPendingPeriodChanges) && (
              <span className="text-sm text-muted-foreground">Unapplied filter changes</span>
            )}
            {clientFilterActive && (
              <span className="text-sm text-muted-foreground">
                Boolean filters active — loading all pages for client-side filtering
              </span>
            )}
            <div className="flex-1" />
            <Button variant="outline" onClick={handleExport} disabled={!displayRows.length}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <OrderTrackingTable
            rows={displayRows}
            isLoading={isLoading}
            error={error}
          />
          {!isLoading && !error && paginationResult && (
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

export default OrderTrackingReportPage;
