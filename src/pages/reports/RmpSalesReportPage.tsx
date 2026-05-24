import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  BarChart3,
  Download,
  Package,
  ShoppingCart,
  TrendingUp,
  Percent,
  Users,
} from 'lucide-react';
import { MasterServerPagination } from '@/components/masters/shared/MasterServerPagination';
import { MasterTableSkeleton } from '@/components/masters/shared/MasterListPageSkeleton';
import { CustomerMultiSelectModal } from '@/components/reports/CustomerMultiSelectModal';
import {
  RmpBreakdownSalesTable,
  breakdownExportFieldMap,
  type BreakdownRow,
} from '@/components/reports/RmpBreakdownSalesTable';
import {
  RmpCoordinatorSalesTable,
  COORDINATOR_EXPORT_HEADERS,
  coordinatorExportFieldMap,
} from '@/components/reports/RmpCoordinatorSalesTable';
import { RmpSalesPeriodFilters } from '@/components/reports/RmpSalesPeriodFilters';
import {
  useAllRmpOrders,
  useRmpBrandOrders,
  useRmpClassOrders,
  useRmpOrders,
  useRmpScOrders,
  type RmpBrandOrderRow,
  type RmpClassOrderRow,
  type RmpOrderRow,
} from '@/hooks/reports/useRmpSalesReport';
import { useAllRmpBrands } from '@/hooks/masters/useRmpBrands';
import { useAllRmpClasses } from '@/hooks/masters/useRmpClasses';
import {
  formatDateForScott,
  orderMatchesCustomerFilter,
  type RmpReportType,
  type RmpReportTypeFilter,
  type RmpSalesFilter,
} from '@/services/reports/rmpSalesReportService';
import type { ScottPaginatedResult } from '@/services/scott/scottPagination';
import {
  createDefaultPeriodConfig,
  resolvePeriodDateRange,
  type RmpSalesPeriodConfig,
} from '@/utils/rmpSalesPeriod';
import { fillRateTotal } from '@/utils/rmpSalesFillRates';
import { exportToCSV, generateExportFilename } from '@/utils/exportUtils';
import { config } from '@/config/environment';

type TabKey = 'overview' | 'brand' | 'class' | 'coordinator';

type GlobalFilters = {
  reportType: RmpReportTypeFilter;
  customerIds: string[];
};

type TabPeriodState = {
  draft: RmpSalesPeriodConfig;
  applied: RmpSalesPeriodConfig;
};

function createDefaultGlobalFilters(): GlobalFilters {
  return { reportType: 'completed', customerIds: [] };
}

function createDefaultTabPeriodState(): TabPeriodState {
  const defaults = createDefaultPeriodConfig();
  return { draft: defaults, applied: defaults };
}

function formatCurrency(value?: number): string {
  if (value == null || Number.isNaN(value)) return '-';
  return `₹${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Failed to load report data';
}

function computeOverviewFillRate(rows: RmpOrderRow[]): string {
  let ordered = 0;
  let delivered = 0;
  for (const row of rows) {
    if (row.ordered_qty != null) ordered += row.ordered_qty;
    if (row.delivered_qty != null) delivered += row.delivered_qty;
  }
  if (ordered === 0) return 'N/A';
  return `${((delivered / ordered) * 100).toFixed(1)}%`;
}

const REPORT_TYPE_OPTIONS: { value: RmpReportTypeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'failed', label: 'Failed' },
];

function resolveOrderNumber(row: RmpOrderRow): string {
  return (
    row.order_number ||
    row.order_id ||
    (typeof row.id === 'string' && row.id !== '' ? row.id : undefined) ||
    '-'
  );
}

function sumField<T>(rows: T[], getter: (row: T) => number | undefined): number {
  return rows.reduce((sum, row) => sum + (getter(row) ?? 0), 0);
}

function buildApiFilters(
  global: GlobalFilters,
  period: RmpSalesPeriodConfig,
  includeCustomers: boolean,
): RmpSalesFilter {
  const { startDate, endDate } = resolvePeriodDateRange(period);
  const filters: RmpSalesFilter = {
    start_date: formatDateForScott(startDate),
    end_date: formatDateForScott(endDate),
  };
  if (global.reportType !== 'all') {
    filters.report_type = global.reportType;
  }
  if (includeCustomers && global.customerIds.length > 0) {
    filters.customer_ids = global.customerIds;
  }
  return filters;
}

function CustomerFilterScopeNote({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <p className="text-sm text-muted-foreground rounded-md border border-dashed px-3 py-2">
      Customer filter applies to the Overview tab only. Brand, Class, and Coordinator views
      reflect all customers for the selected period.
    </p>
  );
}

const RmpSalesReportPage = () => {
  const navigate = useNavigate();
  const [globalDraft, setGlobalDraft] = useState<GlobalFilters>(createDefaultGlobalFilters);
  const [globalApplied, setGlobalApplied] = useState<GlobalFilters>(createDefaultGlobalFilters);

  const [overviewPeriod, setOverviewPeriod] = useState<TabPeriodState>(createDefaultTabPeriodState);
  const [brandPeriod, setBrandPeriod] = useState<TabPeriodState>(createDefaultTabPeriodState);
  const [classPeriod, setClassPeriod] = useState<TabPeriodState>(createDefaultTabPeriodState);
  const [coordinatorPeriod, setCoordinatorPeriod] =
    useState<TabPeriodState>(createDefaultTabPeriodState);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(config.pagination.defaultPageSize);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [customerModalOpen, setCustomerModalOpen] = useState(false);

  const hasPendingGlobalChanges = useMemo(
    () => JSON.stringify(globalDraft) !== JSON.stringify(globalApplied),
    [globalDraft, globalApplied],
  );

  const customerFilterActive = globalApplied.customerIds.length > 0;

  const overviewApiFilters = useMemo(() => {
    const base = buildApiFilters(globalApplied, overviewPeriod.applied, false);
    if (customerFilterActive) return base;
    return buildApiFilters(globalApplied, overviewPeriod.applied, true);
  }, [globalApplied, overviewPeriod.applied, customerFilterActive]);

  const brandApiFilters = useMemo(
    () => buildApiFilters(globalApplied, brandPeriod.applied, false),
    [globalApplied, brandPeriod.applied],
  );

  const classApiFilters = useMemo(
    () => buildApiFilters(globalApplied, classPeriod.applied, false),
    [globalApplied, classPeriod.applied],
  );

  const coordinatorApiFilters = useMemo(
    () => buildApiFilters(globalApplied, coordinatorPeriod.applied, false),
    [globalApplied, coordinatorPeriod.applied],
  );

  const applyGlobalFilters = () => setGlobalApplied(globalDraft);

  const resetAll = () => {
    setGlobalDraft(createDefaultGlobalFilters());
    setGlobalApplied(createDefaultGlobalFilters());
    const defaults = createDefaultTabPeriodState();
    setOverviewPeriod(defaults);
    setBrandPeriod(defaults);
    setClassPeriod(defaults);
    setCoordinatorPeriod(defaults);
    setPage(1);
  };

  const applyTabPeriod = (tab: TabKey) => {
    switch (tab) {
      case 'overview':
        setOverviewPeriod((p) => ({ ...p, applied: p.draft }));
        break;
      case 'brand':
        setBrandPeriod((p) => ({ ...p, applied: p.draft }));
        break;
      case 'class':
        setClassPeriod((p) => ({ ...p, applied: p.draft }));
        break;
      case 'coordinator':
        setCoordinatorPeriod((p) => ({ ...p, applied: p.draft }));
        break;
    }
    setPage(1);
  };

  const {
    data: ordersPage,
    isLoading: ordersLoading,
    isFetching: ordersFetching,
    error: ordersError,
  } = useRmpOrders(
    page,
    pageSize,
    overviewApiFilters,
    activeTab === 'overview' && !customerFilterActive,
  );

  const {
    data: allOrders = [],
    isLoading: allOrdersLoading,
    isFetching: allOrdersFetching,
    error: allOrdersError,
  } = useAllRmpOrders(overviewApiFilters, activeTab === 'overview' && customerFilterActive);

  const {
    data: brandOrders = [],
    isLoading: brandLoading,
    error: brandError,
  } = useRmpBrandOrders(brandApiFilters, activeTab === 'brand');

  const {
    data: classOrders = [],
    isLoading: classLoading,
    error: classError,
  } = useRmpClassOrders(classApiFilters, activeTab === 'class');

  const {
    data: scOrders = [],
    isLoading: scLoading,
    error: scError,
  } = useRmpScOrders(coordinatorApiFilters, activeTab === 'coordinator');

  const { data: allClasses = [] } = useAllRmpClasses();
  const { data: allBrands = [] } = useAllRmpBrands();

  const classById = useMemo(
    () => new Map(allClasses.map((c) => [c.id, c.name])),
    [allClasses],
  );
  const brandById = useMemo(
    () => new Map(allBrands.map((b) => [b.id, b.name])),
    [allBrands],
  );

  const brandBreakdownRows = useMemo((): BreakdownRow[] => {
    return brandOrders.map((row) => {
      const id = row.brand_id ?? row.rmp_brand_id ?? row.id;
      const label =
        row.brand_name ?? (id ? brandById.get(id) : undefined) ?? '-';
      return { ...row, id: row.id, label };
    });
  }, [brandOrders, brandById]);

  const classBreakdownRows = useMemo((): BreakdownRow[] => {
    return classOrders.map((row) => {
      const id = row.class_id ?? row.rmp_class_id ?? row.id;
      const label =
        row.class_name ?? (id ? classById.get(id) : undefined) ?? '-';
      return { ...row, id: row.id, label };
    });
  }, [classOrders, classById]);

  const filteredOrders = useMemo(() => {
    if (!customerFilterActive) return [];
    return allOrders.filter((row) =>
      orderMatchesCustomerFilter(row, globalApplied.customerIds),
    );
  }, [allOrders, customerFilterActive, globalApplied.customerIds]);

  const clientOrdersPage = useMemo((): ScottPaginatedResult<RmpOrderRow> | null => {
    if (!customerFilterActive) return null;
    const totalCount = filteredOrders.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    return {
      data: filteredOrders.slice(start, start + pageSize),
      page: safePage,
      pageSize,
      totalCount,
      totalPages,
      totalCountIsExact: true,
    };
  }, [customerFilterActive, filteredOrders, page, pageSize]);

  const activeOrdersPage = customerFilterActive ? clientOrdersPage : ordersPage ?? null;
  const orders = activeOrdersPage?.data ?? [];
  const totalCount = activeOrdersPage?.totalCount ?? orders.length;

  const overviewOrdersLoading = customerFilterActive ? allOrdersLoading : ordersLoading;
  const overviewOrdersFetching = customerFilterActive ? allOrdersFetching : ordersFetching;
  const overviewOrdersError = customerFilterActive ? allOrdersError : ordersError;
  const overviewSourceOrders = customerFilterActive ? filteredOrders : orders;

  const tabMetrics = useMemo(() => {
    switch (activeTab) {
      case 'brand':
        return {
          unitsLabel: 'Item Qty (brands)',
          unitsValue: sumField(brandBreakdownRows, (r) => r.item_qty),
          salesLabel: 'Order Value (brands)',
          salesValue: sumField(brandBreakdownRows, (r) => r.order_value),
          thirdLabel: 'Fill Rate (total)',
          thirdValue: fillRateTotal(
            sumField(brandBreakdownRows, (r) => r.closed_ordered_qty),
            sumField(brandBreakdownRows, (r) => r.item_qty),
          ),
          ordersLabel: 'Brands',
          ordersValue: brandBreakdownRows.length,
        };
      case 'class':
        return {
          unitsLabel: 'Item Qty (classes)',
          unitsValue: sumField(classBreakdownRows, (r) => r.item_qty),
          salesLabel: 'Order Value (classes)',
          salesValue: sumField(classBreakdownRows, (r) => r.order_value),
          thirdLabel: 'Fill Rate (total)',
          thirdValue: fillRateTotal(
            sumField(classBreakdownRows, (r) => r.closed_ordered_qty),
            sumField(classBreakdownRows, (r) => r.item_qty),
          ),
          ordersLabel: 'Classes',
          ordersValue: classBreakdownRows.length,
        };
      case 'coordinator':
        return {
          unitsLabel: 'Ordered Qty',
          unitsValue: sumField(scOrders, (r) => r.ordered_qty ?? r.total_qty),
          salesLabel: 'Order Value',
          salesValue: sumField(scOrders, (r) => r.order_value ?? r.total_amount),
          thirdLabel: 'Fill Rate (total)',
          thirdValue: fillRateTotal(
            sumField(scOrders, (r) => r.closed_ordered_qty),
            sumField(scOrders, (r) => r.ordered_qty ?? r.total_qty),
          ),
          ordersLabel: 'Coordinators',
          ordersValue: scOrders.length,
        };
      case 'overview':
      default: {
        const pageTotalQty = overviewSourceOrders.reduce(
          (sum, r) => sum + (r.total_qty ?? 0),
          0,
        );
        const pageTotalAmount = overviewSourceOrders.reduce(
          (sum, r) => sum + (r.total_amount ?? 0),
          0,
        );
        return {
          unitsLabel: customerFilterActive ? 'Total Units (filtered)' : 'Total Units (page)',
          unitsValue: pageTotalQty,
          salesLabel: customerFilterActive ? 'Sales Value (filtered)' : 'Sales Value (page)',
          salesValue: pageTotalAmount,
          thirdLabel: customerFilterActive ? 'Fill Rate (filtered)' : 'Fill Rate (page)',
          thirdValue: computeOverviewFillRate(overviewSourceOrders),
          ordersLabel: 'Total Orders',
          ordersValue: totalCount,
        };
      }
    }
  }, [
    activeTab,
    brandBreakdownRows,
    classBreakdownRows,
    scOrders,
    overviewSourceOrders,
    customerFilterActive,
    totalCount,
  ]);

  const customerTypeBreakdown = useMemo(() => {
    const map = new Map<string, { qty: number; amount: number }>();
    for (const row of orders) {
      const key = row.customer_type || 'Unknown';
      const cur = map.get(key) ?? { qty: 0, amount: 0 };
      cur.qty += row.total_qty ?? 0;
      cur.amount += row.total_amount ?? 0;
      map.set(key, cur);
    }
    return Array.from(map.entries()).map(([type, stats]) => ({ type, ...stats }));
  }, [orders]);

  const exportBreakdown = (rows: BreakdownRow[], entityLabel: 'Brand' | 'Class', slug: string) => {
    if (!rows.length) return;
    const headers = [
      entityLabel,
      'Item Qty',
      'Order Value',
      'Closed Ordered Qty',
      'Closed Ordered Value',
      'Distributor Qty',
      'Distributor Value',
      'Distributor Closed Qty',
      'Distributor Closed Value',
      'Other Customer Qty',
      'Other Customer Value',
      'Other Customer Closed Qty',
      'Other Customer Closed Value',
      'Fill Rate Total',
      'Distributor Fill Rate',
      'Other Fill Rate',
    ];
    exportToCSV({
      filename: generateExportFilename(slug),
      headers,
      data: rows,
      fieldMap: breakdownExportFieldMap(entityLabel),
    });
  };

  const renderTabPeriodBar = (
    tab: TabKey,
    periodState: TabPeriodState,
    setPeriodState: React.Dispatch<React.SetStateAction<TabPeriodState>>,
    onExport?: () => void,
    exportDisabled?: boolean,
  ) => {
    const pendingPeriod =
      JSON.stringify(periodState.draft) !== JSON.stringify(periodState.applied);
    return (
      <div className="space-y-3">
        <RmpSalesPeriodFilters
          value={periodState.draft}
          onChange={(draft) => setPeriodState((p) => ({ ...p, draft }))}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => applyTabPeriod(tab)}>
            Apply period
          </Button>
          {pendingPeriod && (
            <span className="text-xs text-muted-foreground">Unapplied period changes</span>
          )}
          {onExport && (
            <Button
              variant="outline"
              size="sm"
              className="ml-auto"
              onClick={onExport}
              disabled={exportDisabled}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/reports')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-violet-600" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Readymade Product Sales Report</h1>
              <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200">
                RMP Sales
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Sales breakdown by brand, class, and coordinator with fill rate metrics
            </p>
          </div>
        </div>
      </div>

      <Card className="sticky top-0 z-10 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1 min-w-[160px]">
              <Label className="text-xs text-muted-foreground">Report Type</Label>
              <Select
                value={globalDraft.reportType}
                onValueChange={(v) =>
                  setGlobalDraft((g) => ({ ...g, reportType: v as RmpReportTypeFilter }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 min-w-[180px]">
              <Label className="text-xs text-muted-foreground">Customers</Label>
              <Button
                variant="outline"
                className="w-full justify-start font-normal"
                onClick={() => setCustomerModalOpen(true)}
              >
                <Users className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">
                  {globalDraft.customerIds.length === 0
                    ? 'All customers'
                    : `${globalDraft.customerIds.length} selected`}
                </span>
              </Button>
            </div>
            <Button onClick={applyGlobalFilters} className="min-w-[100px]">
              Apply
            </Button>
            <Button variant="outline" onClick={resetAll}>
              Reset
            </Button>
            {hasPendingGlobalChanges && (
              <span className="text-xs text-muted-foreground self-center">
                Unapplied filter changes
              </span>
            )}
            {globalApplied.customerIds.length > 0 && !hasPendingGlobalChanges && (
              <Badge variant="secondary" className="self-center">
                {globalApplied.customerIds.length} customer
                {globalApplied.customerIds.length === 1 ? '' : 's'} applied
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <CustomerMultiSelectModal
        open={customerModalOpen}
        onOpenChange={setCustomerModalOpen}
        selectedIds={globalDraft.customerIds}
        onConfirm={(ids) => setGlobalDraft((g) => ({ ...g, customerIds: ids }))}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
              <Package className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{tabMetrics.unitsLabel}</p>
              <p className="text-2xl font-bold">{tabMetrics.unitsValue.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{tabMetrics.salesLabel}</p>
              <p className="text-2xl font-bold">{formatCurrency(tabMetrics.salesValue)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Percent className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{tabMetrics.thirdLabel}</p>
              <p className="text-2xl font-bold">{tabMetrics.thirdValue}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <ShoppingCart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{tabMetrics.ordersLabel}</p>
              <p className="text-2xl font-bold">{tabMetrics.ordersValue.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="brand">Brand Sales</TabsTrigger>
          <TabsTrigger value="class">Class / DRR</TabsTrigger>
          <TabsTrigger value="coordinator">Coordinator Sales</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          {renderTabPeriodBar('overview', overviewPeriod, setOverviewPeriod, () => {
            const exportRows = customerFilterActive ? filteredOrders : orders;
            if (!exportRows.length) return;
            exportToCSV({
              filename: generateExportFilename('rmp-sales-overview'),
              headers: [
                'Order ID',
                'Order Number',
                'Customer',
                'Customer Code',
                'Customer Type',
                'Date',
                'Qty',
                'Amount',
                'Status',
              ],
              data: exportRows,
              fieldMap: {
                'Order ID': 'order_id',
                'Order Number': 'order_number',
                Customer: 'customer_name',
                'Customer Code': 'customer_code',
                'Customer Type': 'customer_type',
                Date: (item: RmpOrderRow) =>
                  item.order_date ? new Date(item.order_date).toLocaleDateString() : '-',
                Qty: (item: RmpOrderRow) => String(item.total_qty ?? 0),
                Amount: (item: RmpOrderRow) => formatCurrency(item.total_amount),
                Status: 'status',
              },
            });
          }, !overviewSourceOrders.length)}
          {customerFilterActive && (
            <p className="text-sm text-muted-foreground">
              Showing orders for {globalApplied.customerIds.length} selected customer
              {globalApplied.customerIds.length === 1 ? '' : 's'}.
            </p>
          )}
          {customerTypeBreakdown.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm font-medium mb-3">Customer Type Sales (current page)</p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {customerTypeBreakdown.map(({ type, qty, amount }) => (
                    <div key={type} className="rounded-lg border p-3 text-sm">
                      <p className="font-medium capitalize">{type}</p>
                      <p className="text-muted-foreground">
                        {qty.toLocaleString()} units · {formatCurrency(amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardContent className="p-6">
              {overviewOrdersError ? (
                <div className="text-center text-destructive py-8">
                  {errorMessage(overviewOrdersError)}
                </div>
              ) : overviewOrdersLoading ? (
                <MasterTableSkeleton showToolbar={false} columnCount={8} />
              ) : orders.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  {customerFilterActive
                    ? 'No orders found for the selected customers.'
                    : 'No orders found for the selected filters'}
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium">{resolveOrderNumber(row)}</TableCell>
                          <TableCell>{row.customer_name || '-'}</TableCell>
                          <TableCell className="capitalize">{row.customer_type || '-'}</TableCell>
                          <TableCell>
                            {row.order_date
                              ? new Date(row.order_date).toLocaleDateString()
                              : '-'}
                          </TableCell>
                          <TableCell>{row.total_qty ?? '-'}</TableCell>
                          <TableCell>{formatCurrency(row.total_amount)}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {row.status || globalApplied.reportType}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <MasterServerPagination
                    result={activeOrdersPage}
                    onPageChange={setPage}
                    onPageSizeChange={(size) => {
                      setPageSize(size);
                      setPage(1);
                    }}
                    disabled={overviewOrdersLoading || overviewOrdersFetching}
                    className="mt-6"
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brand" className="mt-4 space-y-4">
          <CustomerFilterScopeNote active={customerFilterActive} />
          {renderTabPeriodBar(
            'brand',
            brandPeriod,
            setBrandPeriod,
            () => exportBreakdown(brandBreakdownRows, 'Brand', 'rmp-sales-brand'),
            !brandBreakdownRows.length,
          )}
          <Card>
            <CardContent className="p-6">
              {brandError ? (
                <div className="text-center text-destructive py-8">
                  {errorMessage(brandError)}
                </div>
              ) : brandLoading ? (
                <MasterTableSkeleton showToolbar={false} columnCount={16} />
              ) : brandBreakdownRows.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No brand sales data found
                </div>
              ) : (
                <RmpBreakdownSalesTable entityColumnLabel="Brand" rows={brandBreakdownRows} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="class" className="mt-4 space-y-4">
          <CustomerFilterScopeNote active={customerFilterActive} />
          {renderTabPeriodBar(
            'class',
            classPeriod,
            setClassPeriod,
            () => exportBreakdown(classBreakdownRows, 'Class', 'rmp-sales-class-drr'),
            !classBreakdownRows.length,
          )}
          <Card>
            <CardContent className="p-6">
              {classError ? (
                <div className="text-center text-destructive py-8">
                  {errorMessage(classError)}
                </div>
              ) : classLoading ? (
                <MasterTableSkeleton showToolbar={false} columnCount={16} />
              ) : classBreakdownRows.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No class sales data found
                </div>
              ) : (
                <RmpBreakdownSalesTable entityColumnLabel="Class" rows={classBreakdownRows} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coordinator" className="mt-4 space-y-4">
          <CustomerFilterScopeNote active={customerFilterActive} />
          {renderTabPeriodBar(
            'coordinator',
            coordinatorPeriod,
            setCoordinatorPeriod,
            () => {
              if (!scOrders.length) return;
              exportToCSV({
                filename: generateExportFilename('rmp-sales-coordinator'),
                headers: COORDINATOR_EXPORT_HEADERS,
                data: scOrders,
                fieldMap: coordinatorExportFieldMap(),
              });
            },
            !scOrders.length,
          )}
          <Card>
            <CardContent className="p-6">
              {scError ? (
                <div className="text-center text-destructive py-8">
                  {errorMessage(scError)}
                </div>
              ) : scLoading ? (
                <MasterTableSkeleton showToolbar={false} columnCount={6} />
              ) : scOrders.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No coordinator sales data found
                </div>
              ) : (
                <RmpCoordinatorSalesTable rows={scOrders} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RmpSalesReportPage;
