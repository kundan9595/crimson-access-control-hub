import {
  callScottDashboard,
  extractRecords,
  extractScottEntity,
  normalizeId,
} from '@/services/scott/callScottDashboard';
import {
  buildScottPaginatedMeta,
  fetchAllScottPages,
  normalizeScottPageParams,
  type ScottPageParams,
  type ScottPaginatedResult,
} from '@/services/scott/scottPagination';
import { enrichRowsByOrderId } from '@/services/reports/reportDisplayUtils';

export interface OrderReport {
  id: string;
  order_id?: string;
  order_number?: string;
  customer_name?: string;
  customer_code?: string;
  order_date?: string;
  total_amount?: number;
  status?: string;
  order_type?: string;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface OrderReportFilter {
  search?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
}

function str(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined;
  const s = String(v).trim();
  return s === '' ? undefined : s;
}

function pickString(r: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = str(r[key]);
    if (value) return value;
  }
  return undefined;
}

function num(v: unknown): number | undefined {
  if (v === null || v === undefined || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function pickNumeric(r: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = num(r[key]);
    if (value != null) return value;
  }
  return undefined;
}

function computeCustomOrderAmount(src: Record<string, unknown>): number | undefined {
  const direct = pickNumeric(src, ['total_amount', 'amount', 'grand_total']);
  if (direct != null) return direct;

  const qty = pickNumeric(src, ['total_quantity', 'quantity', 'qty']) ?? 1;
  const unitCost =
    (pickNumeric(src, ['fabric_rate']) ?? 0) +
    (pickNumeric(src, ['trims_cost']) ?? 0) +
    (pickNumeric(src, ['overhead']) ?? 0) +
    (pickNumeric(src, ['add_on_cost']) ?? 0) +
    (pickNumeric(src, ['branding_cost']) ?? 0);

  if (unitCost <= 0) return undefined;
  return unitCost * qty;
}

function deriveOrderStatus(src: Record<string, unknown>): string {
  const explicit = pickString(src, ['order_status', 'status']);
  if (explicit) return explicit;

  if (pickString(src, ['actual_delivery_date'])) return 'DELIVERED';
  if (pickString(src, ['expected_delivery_date'])) return 'PENDING';
  return '';
}

function normalizeOrderReport(r: Record<string, unknown>): OrderReport {
  const nested =
    r.order_report && typeof r.order_report === 'object' && !Array.isArray(r.order_report)
      ? (r.order_report as Record<string, unknown>)
      : null;
  const src = nested ? { ...nested, ...r } : r;

  return {
    ...src,
    id: normalizeId(src.id ?? src.order_report_id ?? src.order_id),
    order_id: pickString(src, ['order_id', 'orderId']) ?? '',
    order_number: pickString(src, [
      'order_number',
      'jobsheet_number',
      'order_no',
      'number',
    ]) ?? '',
    customer_name: pickString(src, ['customer_name', 'company_name', 'name']) ?? '',
    customer_code: pickString(src, ['customer_code', 'code']) ?? '',
    product: pickString(src, ['product', 'description']) ?? '',
    order_date: pickString(src, ['order_date', 'date']),
    total_amount: computeCustomOrderAmount(src),
    status: deriveOrderStatus(src),
    order_type: pickString(src, ['order_type', 'item_type']) ?? '',
    created_at: pickString(src, ['created_at']) ?? new Date().toISOString(),
    updated_at: pickString(src, ['updated_at']) ?? new Date().toISOString(),
  };
}

function buildQuery(
  params: ScottPageParams,
  filters?: OrderReportFilter,
): Record<string, string | number | boolean | undefined> {
  const query: Record<string, string | number | boolean | undefined> = {
    items: params.items,
    page: params.page,
  };
  if (filters?.search) {
    query.search = filters.search;
  }
  if (filters?.start_date) {
    query.start_date = filters.start_date;
  }
  if (filters?.end_date) {
    query.end_date = filters.end_date;
  }
  if (filters?.status) {
    query.status = filters.status;
  }
  return query;
}

export async function fetchOrderReportsPaginated(
  params?: Partial<ScottPageParams>,
  filters?: OrderReportFilter,
): Promise<ScottPaginatedResult<OrderReport>> {
  const p = normalizeScottPageParams(params);
  const query = buildQuery(p, filters);
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'order_reports',
    method: 'GET',
    query,
  });
  const rawRecords = extractRecords(body);
  const data = enrichRowsByOrderId(
    rawRecords.map((r) => normalizeOrderReport(r)),
    ['customer_name', 'customer_code', 'order_date', 'status'],
  );
  return {
    data,
    ...buildScottPaginatedMeta(body, p, data.length),
  };
}

export const fetchOrderReports = async (
  filters?: OrderReportFilter,
): Promise<OrderReport[]> =>
  fetchAllScottPages((pp) => fetchOrderReportsPaginated(pp, filters));

export const getOrderReportById = async (id: string): Promise<OrderReport | null> => {
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'order_reports',
    method: 'GET',
    pathSuffix: id,
  });
  const data = (body as { data?: Record<string, unknown> }).data;
  if (!data) return null;
  return normalizeOrderReport(data);
};
