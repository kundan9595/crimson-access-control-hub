import {
  callScottDashboard,
  extractRecords,
  type ScottQueryValue,
} from '@/services/scott/callScottDashboard';
import {
  buildScottPaginatedMeta,
  fetchAllScottPages,
  type ScottPageParams,
  type ScottPaginatedResult,
} from '@/services/scott/scottPagination';
import { formatDateForScott } from '@/services/reports/rmpSalesReportService';
import type { CustomerPerformanceGrowthPeriod } from '@/utils/customerPerformancePeriod';

export interface CustomerPerformanceFilter {
  start_date?: string;
  end_date?: string;
  period?: CustomerPerformanceGrowthPeriod;
}

export interface UniqueCustomersSummary {
  totalUniqueCustomers?: number;
  uniqueCustomOrder?: number;
  uniqueReadymade?: number;
}

export interface CustomerPerformanceRow {
  id: string;
  customer_id?: string;
  customer_code?: string;
  customer_type?: string;
  customer_name?: string;
  qty?: number;
  value?: number;
  zone?: string;
  last_order_date?: string;
  [key: string]: unknown;
}

export interface CustomerComparisonRow {
  id: string;
  customer_id: string;
  customer_type?: string;
  customer_name?: string;
  zone?: string;
  qtyA?: number;
  valueA?: number;
  qtyB?: number;
  valueB?: number;
  qtyChange?: number;
  valueChange?: number;
  qtyChangePct?: number;
  valueChangePct?: number;
  last_order_date?: string;
}

function num(v: unknown): number | undefined {
  if (v === null || v === undefined || v === '') return undefined;
  if (typeof v === 'string') {
    const cleaned = v.replace(/[₹,\s]/g, '');
    if (cleaned === '') return undefined;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : undefined;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function extractPeriodMetrics(
  raw: unknown,
): { qty?: number; value?: number } {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const period = raw as Record<string, unknown>;
  return {
    qty: pickNumeric(period, [
      'qty',
      'quantity',
      'total_qty',
      'ordered_qty',
      'units',
      'order_qty',
    ]),
    value: pickNumeric(period, [
      'value',
      'order_value',
      'total_amount',
      'sales_value',
      'amount',
      'revenue',
      'total_sales',
      'grand_total',
      'net_value',
      'sales',
    ]),
  };
}

function str(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined;
  const s = String(v).trim();
  return s === '' ? undefined : s;
}

function pickNumeric(r: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = num(r[key]);
    if (value != null) return value;
  }
  return undefined;
}

function pickString(r: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = str(r[key]);
    if (value) return value;
  }
  return undefined;
}

function parseDateMs(value?: string): number {
  if (!value) return 0;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

function latestDate(a?: string, b?: string): string | undefined {
  const aMs = parseDateMs(a);
  const bMs = parseDateMs(b);
  if (aMs === 0 && bMs === 0) return undefined;
  if (aMs >= bMs) return a;
  return b;
}

function extractNestedCustomer(r: Record<string, unknown>): {
  id?: string;
  name?: string;
  type?: string;
  zone?: string;
} {
  const raw = r.customer ?? r.Customer;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }
  const c = raw as Record<string, unknown>;
  const zoneRaw = c.zone ?? c.Zone;
  let zone: string | undefined;
  if (typeof zoneRaw === 'string') zone = zoneRaw;
  else if (zoneRaw && typeof zoneRaw === 'object' && !Array.isArray(zoneRaw)) {
    zone = pickString(zoneRaw as Record<string, unknown>, ['name', 'zone_name', 'title']);
  }
  return {
    id: pickString(c, ['id', 'customer_id']),
    name: pickString(c, ['company_name', 'customer_name', 'name']),
    type: pickString(c, ['customer_type', 'type', 'customer_type_name']),
    zone,
  };
}

export function normalizeCustomerPerformanceRow(
  r: Record<string, unknown>,
): CustomerPerformanceRow {
  const nested = extractNestedCustomer(r);
  const customerId =
    pickString(r, ['customer_id', 'customerId', 'id']) ?? nested.id ?? pickString(r, ['customer_code']);
  const customerName =
    pickString(r, ['customer_name', 'company_name', 'name']) ?? nested.name;

  // Scott `customers/performance` nests period metrics under current_period / previous_period.
  const currentMetrics = extractPeriodMetrics(r.current_period ?? r.currentPeriod);
  const topLevelQty = pickNumeric(r, [
    'qty',
    'quantity',
    'total_qty',
    'ordered_qty',
    'units',
    'item_qty',
    'total_quantity',
    'order_qty',
    'units_sold',
  ]);
  const topLevelValue = pickNumeric(r, [
    'value',
    'order_value',
    'total_amount',
    'sales_value',
    'amount',
    'revenue',
    'total_sales',
    'grand_total',
    'net_value',
    'sales',
  ]);

  const row: CustomerPerformanceRow = {
    ...r,
    id: customerId ?? String(r.id ?? Math.random()),
    customer_id: customerId,
    customer_code: pickString(r, ['customer_code', 'code']),
    customer_type: pickString(r, ['customer_type', 'type', 'customer_type_name']) ?? nested.type,
    customer_name: customerName,
    qty: currentMetrics.qty ?? topLevelQty,
    value: currentMetrics.value ?? topLevelValue,
    zone:
      pickString(r, ['zone', 'zone_name', 'region', 'area']) ??
      nested.zone ??
      pickString(r, ['zone_id']),
    last_order_date: pickString(r, [
      'last_order_date',
      'last_order',
      'most_recent_order_date',
      'latest_order_date',
      'recent_order_date',
    ]),
  };

  if (import.meta.env.DEV && row.qty == null && row.value == null) {
    console.debug('[customer-performance] row keys:', Object.keys(r), r);
  }

  return row;
}

export function normalizeUniqueCustomersSummary(body: unknown): UniqueCustomersSummary {
  if (!body || typeof body !== 'object') return {};

  const root = body as Record<string, unknown>;
  const data =
    root.data && typeof root.data === 'object' && !Array.isArray(root.data)
      ? (root.data as Record<string, unknown>)
      : root;

  const nested = data.unique_customers;
  const source =
    nested && typeof nested === 'object' && !Array.isArray(nested)
      ? (nested as Record<string, unknown>)
      : data;

  return {
    totalUniqueCustomers: pickNumeric(source, [
      'total_unique_customers',
      'total_unique',
      'total',
      'count',
      'unique_customers',
      'unique_customer_count',
    ]),
    uniqueCustomOrder: pickNumeric(source, [
      'custom_order_customers',
      'unique_custom_order',
      'custom_order_count',
      'unique_custom_orders',
      'custom_orders',
      'unique_customer_custom_order',
      'custom_order',
    ]),
    uniqueReadymade: pickNumeric(source, [
      'rmp_order_customers',
      'unique_readymade',
      'readymade_count',
      'unique_rmp',
      'rmp_count',
      'readymade',
      'unique_customer_readymade',
      'unique_customer_rmp',
    ]),
  };
}

function rowKey(row: CustomerPerformanceRow): string {
  return row.customer_id ?? row.customer_code ?? row.id;
}

function pctChange(current: number | undefined, previous: number | undefined): number | undefined {
  if (current == null || previous == null || previous === 0) return undefined;
  return ((current - previous) / previous) * 100;
}

export function mergeComparisonRows(
  periodA: CustomerPerformanceRow[],
  periodB: CustomerPerformanceRow[],
): CustomerComparisonRow[] {
  const mapA = new Map(periodA.map((r) => [rowKey(r), r]));
  const mapB = new Map(periodB.map((r) => [rowKey(r), r]));
  const allKeys = new Set([...mapA.keys(), ...mapB.keys()]);

  return Array.from(allKeys).map((key) => {
    const a = mapA.get(key);
    const b = mapB.get(key);
    const qtyA = a?.qty;
    const qtyB = b?.qty;
    const valueA = a?.value;
    const valueB = b?.value;

    return {
      id: key,
      customer_id: a?.customer_id ?? b?.customer_id ?? key,
      customer_type: a?.customer_type ?? b?.customer_type,
      customer_name: a?.customer_name ?? b?.customer_name,
      zone: a?.zone ?? b?.zone,
      qtyA,
      valueA,
      qtyB,
      valueB,
      qtyChange:
        qtyA != null && qtyB != null ? qtyB - qtyA : qtyB ?? (qtyA != null ? -qtyA : undefined),
      valueChange:
        valueA != null && valueB != null
          ? valueB - valueA
          : valueB ?? (valueA != null ? -valueA : undefined),
      qtyChangePct: pctChange(qtyB, qtyA),
      valueChangePct: pctChange(valueB, valueA),
      last_order_date: latestDate(a?.last_order_date, b?.last_order_date),
    };
  });
}

export const MOCK_PERIOD_A: CustomerPerformanceRow[] = [
  {
    id: '1001',
    customer_id: '1001',
    customer_type: 'Retail',
    customer_name: 'Krishna multi brand',
    qty: 120,
    value: 450000,
    zone: 'South',
    last_order_date: '2026-04-15',
  },
  {
    id: '1002',
    customer_id: '1002',
    customer_type: 'Distributor',
    customer_name: 'Metro Fashion Hub',
    qty: 80,
    value: 320000,
    zone: 'West',
    last_order_date: '2026-04-20',
  },
  {
    id: '1003',
    customer_id: '1003',
    customer_type: 'Retail',
    customer_name: 'City Styles',
    qty: 45,
    value: 98000,
    zone: 'North',
    last_order_date: '2026-03-28',
  },
];

export const MOCK_PERIOD_B: CustomerPerformanceRow[] = [
  {
    id: '1001',
    customer_id: '1001',
    customer_type: 'Retail',
    customer_name: 'Krishna multi brand',
    qty: 150,
    value: 520000,
    zone: 'South',
    last_order_date: '2026-05-10',
  },
  {
    id: '1002',
    customer_id: '1002',
    customer_type: 'Distributor',
    customer_name: 'Metro Fashion Hub',
    qty: 60,
    value: 240000,
    zone: 'West',
    last_order_date: '2026-05-05',
  },
  {
    id: '1004',
    customer_id: '1004',
    customer_type: 'Retail',
    customer_name: 'New Era Retail',
    qty: 30,
    value: 75000,
    zone: 'East',
    last_order_date: '2026-05-12',
  },
];

export const MOCK_UNIQUE_CUSTOMERS: UniqueCustomersSummary = {
  totalUniqueCustomers: 80,
  uniqueCustomOrder: 50,
  uniqueReadymade: 50,
};

async function fetchCustomerPerformancePaginated(
  params: ScottPageParams,
  filters: CustomerPerformanceFilter,
): Promise<ScottPaginatedResult<CustomerPerformanceRow>> {
  const query: Record<string, ScottQueryValue> = {
    items: params.items,
    page: params.page,
  };
  if (filters.start_date) query.start_date = filters.start_date;
  if (filters.end_date) query.end_date = filters.end_date;
  if (filters.period) query.period = filters.period;

  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'customers',
    method: 'GET',
    pathSuffix: 'performance',
    query,
  });

  const records = extractRecords(body);
  const data = records.map((r) => normalizeCustomerPerformanceRow(r));
  return {
    data,
    ...buildScottPaginatedMeta(body, params, data.length),
  };
}

export async function fetchCustomerPerformance(
  filters: CustomerPerformanceFilter,
): Promise<CustomerPerformanceRow[]> {
  try {
    const rows = await fetchAllScottPages(
      (p) => fetchCustomerPerformancePaginated(p, filters),
      { pageSize: 100, maxPages: 50 },
    );
    if (rows.length > 0) return rows;
  } catch {
    // fall through to mock in dev
  }

  return [];
}

export async function fetchUniqueCustomersSummary(
  startDate?: string,
  endDate?: string,
): Promise<UniqueCustomersSummary> {
  const query: Record<string, ScottQueryValue> = {};
  if (startDate) query.start_date = formatDateForScott(startDate);
  if (endDate) query.end_date = formatDateForScott(endDate);

  try {
    const { body } = await callScottDashboard<Record<string, unknown>>({
      resource: 'customers',
      method: 'GET',
      pathSuffix: 'unique_customers',
      query,
    });
    const summary = normalizeUniqueCustomersSummary(body);
    if (
      summary.totalUniqueCustomers != null ||
      summary.uniqueCustomOrder != null ||
      summary.uniqueReadymade != null
    ) {
      return summary;
    }
  } catch {
    // fall through
  }

  if (import.meta.env.DEV) {
    return MOCK_UNIQUE_CUSTOMERS;
  }
  return {};
}

export function buildPerformanceFilters(
  startDate: string,
  endDate: string,
  period: CustomerPerformanceGrowthPeriod,
): CustomerPerformanceFilter {
  return {
    start_date: formatDateForScott(startDate),
    end_date: formatDateForScott(endDate),
    period,
  };
}

export function auditCustomerPerformanceFields(
  rows: CustomerComparisonRow[],
): Record<string, string> {
  const total = rows.length || 1;
  const fields: (keyof CustomerComparisonRow)[] = [
    'customer_id',
    'customer_type',
    'customer_name',
    'zone',
    'qtyA',
    'valueA',
    'qtyB',
    'valueB',
    'qtyChange',
    'valueChange',
    'qtyChangePct',
    'valueChangePct',
    'last_order_date',
  ];

  const report: Record<string, string> = {};
  for (const field of fields) {
    const filled = rows.filter((row) => {
      const v = row[field];
      return v != null && v !== '';
    }).length;
    report[field] = `${((filled / total) * 100).toFixed(1)}% (${filled}/${rows.length})`;
  }

  if (import.meta.env.DEV) {
    console.table(report);
  }
  return report;
}

export function getMockComparisonData(): {
  periodA: CustomerPerformanceRow[];
  periodB: CustomerPerformanceRow[];
} {
  return { periodA: MOCK_PERIOD_A, periodB: MOCK_PERIOD_B };
}

export { formatDateForScott };
