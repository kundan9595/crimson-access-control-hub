import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Download, Package, AlertTriangle } from 'lucide-react';
import { MasterServerPagination } from '@/components/masters/shared/MasterServerPagination';
import { InventoryReportPeriodFilters } from '@/components/reports/InventoryReportPeriodFilters';
import {
  TOTAL_INVENTORY_EXPORT_HEADERS,
  TotalInventoryTable,
  totalInventoryExportFieldMap,
} from '@/components/reports/TotalInventoryTable';
import { useTotalInventoryPaginated } from '@/hooks/reports/useTotalInventoryReport';
import {
  auditInventoryReportFields,
  buildTotalInventoryApiFilters,
  fetchAllTotalInventory,
  isInventoryReportApiPending,
  isWhConfigPending,
} from '@/services/reports/totalInventoryReportService';
import {
  createDefaultInventoryReportPeriod,
  daysInPeriod,
  resolveInventoryReportPeriodRange,
  type InventoryReportPeriodConfig,
} from '@/utils/inventoryReportPeriod';
import {
  INVENTORY_REPORT_WH1_NAME,
  INVENTORY_REPORT_WH2_NAME,
} from '@/config/inventoryReportConfig';
import { exportToCSV, generateExportFilename } from '@/utils/exportUtils';
import { config } from '@/config/environment';
import { toast } from 'sonner';

type PeriodState = {
  draft: InventoryReportPeriodConfig;
  applied: InventoryReportPeriodConfig;
};

function createDefaultPeriodState(): PeriodState {
  const defaults = createDefaultInventoryReportPeriod();
  return { draft: defaults, applied: defaults };
}

const TotalInventoryReportPage = () => {
  const navigate = useNavigate();
  const [periodState, setPeriodState] = useState<PeriodState>(createDefaultPeriodState);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(config.pagination.defaultPageSize);

  const hasPendingPeriodChanges = useMemo(
    () => JSON.stringify(periodState.draft) !== JSON.stringify(periodState.applied),
    [periodState.draft, periodState.applied],
  );

  const appliedDaysInPeriod = useMemo(
    () => daysInPeriod(periodState.applied),
    [periodState.applied],
  );

  const apiFilters = useMemo(() => {
    const { startDate, endDate } = resolveInventoryReportPeriodRange(periodState.applied);
    return buildTotalInventoryApiFilters(startDate, endDate);
  }, [periodState.applied]);

  const {
    data: paginatedData,
    isLoading,
    isFetching,
    error,
  } = useTotalInventoryPaginated(page, pageSize, apiFilters, appliedDaysInPeriod);

  const rows = paginatedData?.data ?? [];
  const apiPending = isInventoryReportApiPending();
  const whPending = isWhConfigPending();

  useEffect(() => {
    if (rows.length > 0 && import.meta.env.DEV) {
      auditInventoryReportFields(rows);
    }
  }, [rows]);

  useEffect(() => {
    if (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load inventory report');
    }
  }, [error]);

  const applyFilters = () => {
    setPeriodState((p) => ({ ...p, applied: p.draft }));
    setPage(1);
  };

  const resetAll = () => {
    setPeriodState(createDefaultPeriodState());
    setPage(1);
  };

  const handleExport = async () => {
    const toastId = toast.loading('Preparing inventory export…');
    try {
      const exportRows = await fetchAllTotalInventory(apiFilters, appliedDaysInPeriod);
      if (!exportRows.length) {
        toast.error('No data to export', { id: toastId });
        return;
      }
      exportToCSV({
        filename: generateExportFilename('total-inventory-report'),
        headers: TOTAL_INVENTORY_EXPORT_HEADERS,
        data: exportRows,
        fieldMap: totalInventoryExportFieldMap(),
      });
      toast.success(`Export ready — ${exportRows.length} rows downloading now`, { id: toastId, duration: 3000 });
    } catch {
      toast.error('Failed to export inventory report', { id: toastId });
    }
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
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <Package className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">Total Inventory Report</h1>
                <Badge variant="outline">Inventory</Badge>
              </div>
              <p className="text-muted-foreground text-sm">
                SKU stock (WH1 + WH2), DRR, days of cover, and OOS sales loss. Sales loss uses DRR
                Value × days in selected period when status is Out of Stock.
              </p>
            </div>
          </div>
        </div>
      </div>

      {(apiPending || whPending) && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {apiPending &&
              'Waiting for Scott inventory_reports API — set INVENTORY_REPORT_API_ENABLED when ready. '}
            {whPending &&
              `Configure WH1/WH2 names in inventoryReportConfig.ts (currently "${INVENTORY_REPORT_WH1_NAME}" / "${INVENTORY_REPORT_WH2_NAME}"). `}
            {import.meta.env.DEV && apiPending && 'Showing mock data in development.'}
          </AlertDescription>
        </Alert>
      )}

      <Card className="sticky top-0 z-10 shadow-sm">
        <CardContent className="p-4 space-y-4">
          <InventoryReportPeriodFilters
            value={periodState.draft}
            onChange={(draft) => setPeriodState((p) => ({ ...p, draft }))}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={applyFilters}>Apply</Button>
            <Button variant="outline" onClick={resetAll}>
              Reset
            </Button>
            {hasPendingPeriodChanges && (
              <span className="text-sm text-muted-foreground">Unapplied filter changes</span>
            )}
            <div className="flex-1" />
            <Button variant="outline" onClick={handleExport} disabled={!rows.length}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <TotalInventoryTable rows={rows} isLoading={isLoading} error={error} />
          {!isLoading && !error && paginatedData && paginatedData.totalCount > 0 && (
            <div className="mt-4">
              <MasterServerPagination
                result={paginatedData}
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

export default TotalInventoryReportPage;
