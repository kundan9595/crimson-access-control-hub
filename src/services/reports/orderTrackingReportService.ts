import {
  callScottDashboard,
  normalizeId,
  type ScottQueryValue,
} from '@/services/scott/callScottDashboard';
import {
  buildScottPaginatedMeta,
  fetchAllScottPages,
  normalizeScottPageParams,
  type ScottPageParams,
  type ScottPaginatedResult,
} from '@/services/scott/scottPagination';
import {
  extractOrderTrackingRecords,
  extractOrdersPageMeta,
  formatDateForScott,
} from '@/services/reports/rmpSalesReportService';

export type OrderTrackingReportType = 'pending' | 'completed' | 'overdue' | 'failed';
export type OrderTrackingReportTypeFilter = OrderTrackingReportType | 'all';
export type TriStateFilter = 'all' | 'yes' | 'no';

export interface OrderTrackingFilter {
  report_type?: OrderTrackingReportType;
  start_date?: string;
  end_date?: string;
}

export interface OrderTrackingRow {
  id: string;
  order_id?: string;
  order_number?: string;
  customer_id?: string;
  customer_name?: string;
  customer_type?: string;
  class_id?: string;
  class_name?: string;
  order_date?: string;
  qty?: number;
  price?: number;
  value?: number;
  status?: string;
  report_type?: string;
  uniware_reason?: string;
  is_overdue?: boolean;
  is_failed?: boolean;
  is_oos?: boolean;
  sla_date?: string;
  [key: string]: unknown;
}

export const ORDER_TRACKING_TABLE_COLUMNS = [
  'order_date',
  'order_id',
  'customer_type',
  'customer_name',
  'class_name',
  'qty',
  'price',
  'value',
  'status',
  'uniware_reason',
] as const;

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

function pickBool(r: Record<string, unknown>, keys: string[]): boolean | undefined {
  for (const key of keys) {
    const v = r[key];
    if (v === true || v === 1 || v === '1' || v === 'true' || v === 'yes') return true;
    if (v === false || v === 0 || v === '0' || v === 'false' || v === 'no') return false;
  }
  return undefined;
}

function extractNestedCustomer(r: Record<string, unknown>): {
  id?: string;
  name?: string;
  type?: string;
} {
  const raw = r.customer ?? r.Customer;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }
  const c = raw as Record<string, unknown>;
  return {
    id: pickString(c, ['id', 'customer_id', 'customerId']),
    name: pickString(c, ['company_name', 'customer_name', 'name']),
    type: pickString(c, ['customer_type', 'type']),
  };
}

function extractEmbeddedClass(r: Record<string, unknown>): { id?: string; name?: string } {
  const raw = r.rmp_class ?? r.RmpClass ?? r.class;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const c = raw as Record<string, unknown>;
  return {
    id: pickString(c, ['id', 'class_id', 'rmp_class_id']),
    name: pickString(c, ['name', 'class_name', 'title']),
  };
}

function deriveIsOverdue(r: Record<string, unknown>, reportType?: string): boolean {
  const explicit = pickBool(r, ['is_overdue', 'isOverdue', 'overdue']);
  if (explicit != null) return explicit;
  const status = pickString(r, ['status', 'order_status', 'report_type']) ?? reportType ?? '';
  return /overdue/i.test(status) || reportType === 'overdue';
}

function deriveIsFailed(r: Record<string, unknown>, reportType?: string): boolean {
  const explicit = pickBool(r, ['is_failed', 'isFailed', 'failed']);
  if (explicit != null) return explicit;
  const status = pickString(r, ['status', 'order_status', 'report_type']) ?? reportType ?? '';
  const hasError = Boolean(
    pickString(r, [
      'uniware_reason',
      'uniwareReason',
      'error_reason',
      'failure_reason',
      'reason',
      'error_message',
    ]),
  );
  return /fail/i.test(status) || reportType === 'failed' || hasError;
}

function deriveIsOos(r: Record<string, unknown>): boolean {
  const explicit = pickBool(r, ['is_oos', 'isOos', 'oos', 'out_of_stock', 'is_out_of_stock']);
  if (explicit != null) return explicit;
  const status = pickString(r, ['status', 'order_status']) ?? '';
  return /oos|out.?of.?stock/i.test(status);
}

export function normalizeOrderTrackingRow(r: Record<string, unknown>): OrderTrackingRow {
  const nestedCustomer = extractNestedCustomer(r);
  const embeddedClass = extractEmbeddedClass(r);
  const reportType = pickString(r, ['report_type', 'ReportType']);

  const qty = pickNumeric(r, [
    'qty',
    'quantity',
    'ordered_qty',
    'ordered_quantity',
    'order_qty',
    'total_qty',
    'total_quantity',
    'item_qty',
  ]);

  const price = pickNumeric(r, [
    'price',
    'unit_price',
    'rate',
    'mrp',
    'selling_price',
    'item_price',
    'unit_rate',
  ]);

  const value = pickNumeric(r, [
    'value',
    'order_value',
    'total_amount',
    'amount',
    'total_value',
    'net_amount',
    'sales_value',
    'grand_total',
  ]);

  const row: OrderTrackingRow = {
    ...r,
    id: normalizeId(
      pickString(r, ['id', 'order_id', 'orderId']) ?? r.id ?? r.order_id,
    ),
    order_id: pickString(r, ['order_id', 'orderId', 'id']),
    order_number: pickString(r, [
      'order_number',
      'order_no',
      'number',
      'invoice_no',
      'ref_no',
      'reference_number',
      'po_number',
      'order_code',
    ]),
    customer_id: pickString(r, ['customer_id', 'customerId']) ?? nestedCustomer.id,
    customer_name:
      pickString(r, ['customer_name', 'company_name', 'name']) ?? nestedCustomer.name,
    customer_type: pickString(r, ['customer_type', 'type']) ?? nestedCustomer.type,
    class_id:
      pickString(r, ['class_id', 'rmp_class_id', 'classId']) ?? embeddedClass.id,
    class_name:
      pickString(r, ['class_name', 'rmp_class_name', 'class']) ?? embeddedClass.name,
    order_date: pickString(r, [
      'order_date',
      'date',
      'created_at',
      'order_created_at',
      'placed_at',
    ]),
    qty,
    price,
    value,
    status: pickString(r, ['status', 'order_status', 'report_type']),
    report_type: reportType,
    uniware_reason: pickString(r, [
      'uniware_reason',
      'uniwareReason',
      'error_reason',
      'failure_reason',
      'reason',
      'error_message',
      'fail_reason',
    ]),
    sla_date: pickString(r, ['sla_date', 'slaDate', 'expected_delivery_date', 'due_date']),
    is_overdue: deriveIsOverdue(r, reportType),
    is_failed: deriveIsFailed(r, reportType),
    is_oos: deriveIsOos(r),
  };

  return row;
}

function buildOrderTrackingQuery(
  params: ScottPageParams | undefined,
  filters?: OrderTrackingFilter,
): Record<string, ScottQueryValue> {
  const query: Record<string, ScottQueryValue> = {};
  if (params) {
    query.items = params.items;
    query.page = params.page;
  }
  if (filters?.report_type) query.report_type = filters.report_type;
  if (filters?.start_date) query.start_date = filters.start_date;
  if (filters?.end_date) query.end_date = filters.end_date;
  return query;
}

export function resolveOrderTrackingOrderId(row: OrderTrackingRow): string {
  return (
    row.order_number ||
    row.order_id ||
    (typeof row.id === 'string' && row.id !== '' ? row.id : undefined) ||
    '-'
  );
}

export function matchesTriStateFilter(
  value: boolean | undefined,
  filter: TriStateFilter,
): boolean {
  if (filter === 'all') return true;
  if (filter === 'yes') return value === true;
  return value !== true;
}

export function applyClientBooleanFilters(
  rows: OrderTrackingRow[],
  filters: {
    isOverdue: TriStateFilter;
    isFailed: TriStateFilter;
    isOos: TriStateFilter;
  },
): OrderTrackingRow[] {
  return rows.filter(
    (row) =>
      matchesTriStateFilter(row.is_overdue, filters.isOverdue) &&
      matchesTriStateFilter(row.is_failed, filters.isFailed) &&
      matchesTriStateFilter(row.is_oos, filters.isOos),
  );
}

export function needsClientSideBooleanFiltering(filters: {
  isOverdue: TriStateFilter;
  isFailed: TriStateFilter;
  isOos: TriStateFilter;
}): boolean {
  return (
    filters.isOverdue !== 'all' ||
    filters.isFailed !== 'all' ||
    filters.isOos !== 'all'
  );
}

/** Dev helper: log per-column fill rates for verification. */
export function auditOrderTrackingFields(rows: OrderTrackingRow[]): Record<string, string> {
  const total = rows.length || 1;
  const fields: (keyof OrderTrackingRow)[] = [
    'order_date',
    'order_id',
    'customer_type',
    'customer_name',
    'class_name',
    'qty',
    'price',
    'value',
    'status',
    'uniware_reason',
  ];

  const report: Record<string, string> = {};
  for (const field of fields) {
    const filled = rows.filter((row) => {
      const v = row[field];
      if (v == null || v === '') return false;
      if (field === 'order_id') {
        return resolveOrderTrackingOrderId(row) !== '-';
      }
      return true;
    }).length;
    report[field] = `${((filled / total) * 100).toFixed(1)}% (${filled}/${rows.length})`;
  }

  if (import.meta.env.DEV) {
    console.table(report);
  }
  return report;
}

export async function fetchOrderTrackingPaginated(
  params?: Partial<ScottPageParams>,
  filters?: OrderTrackingFilter,
): Promise<ScottPaginatedResult<OrderTrackingRow>> {
  const p = normalizeScottPageParams(params);
  const query = buildOrderTrackingQuery(p, filters);
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'orders',
    method: 'GET',
    query,
  });
  const records = extractOrderTrackingRecords(body);
  const data = records.map((r) => normalizeOrderTrackingRow(r));
  return {
    data,
    ...extractOrdersPageMeta(body, p, data.length),
  };
}

export const fetchAllOrderTracking = async (
  filters?: OrderTrackingFilter,
): Promise<OrderTrackingRow[]> =>
  fetchAllScottPages((pp) => fetchOrderTrackingPaginated(pp, filters), {
    pageSize: 100,
    maxPages: 100,
  });

export { formatDateForScott };
