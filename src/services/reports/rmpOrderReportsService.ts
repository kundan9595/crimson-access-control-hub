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
import { enrichRowsByOrderId, isIncompleteOrderId } from '@/services/reports/reportDisplayUtils';

export interface RmpOrderReport {
  id: string;
  order_id?: string;
  order_number?: string;
  customer_name?: string;
  customer_code?: string;
  order_date?: string;
  total_amount?: number;
  status?: string;
  rmp_sku_id?: string;
  rmp_sku_name?: string;
  quantity?: number;
  price?: number;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface RmpOrderReportFilter {
  search?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  rmp_sku_id?: string;
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

function deriveOrderStatus(src: Record<string, unknown>): string {
  const explicit = pickString(src, ['order_status', 'status']);
  if (explicit) return explicit;

  if (pickString(src, ['dispatch_date', 'actual_delivery_date'])) return 'DISPATCHED';
  if (pickString(src, ['delivery_required_on', 'expected_delivery_date'])) return 'PENDING';
  return '';
}

function normalizeRmpOrderReport(r: Record<string, unknown>): RmpOrderReport {
  const nested =
    (r.rmp_order_report ?? r.order_report) &&
    typeof (r.rmp_order_report ?? r.order_report) === 'object' &&
    !Array.isArray(r.rmp_order_report ?? r.order_report)
      ? ((r.rmp_order_report ?? r.order_report) as Record<string, unknown>)
      : null;
  const src = nested ? { ...nested, ...r } : r;

  const totalAmount = pickNumeric(src, ['total_amount', 'amount']);
  const quantity = pickNumeric(src, ['quantity', 'total_quantity', 'qty']);
  const unitPrice = pickNumeric(src, ['per_piece_amount', 'price', 'unit_price']);

  const orderId = pickString(src, ['order_id', 'orderId']) ?? '';
  const explicitOrderNumber = pickString(src, [
    'order_number',
    'order_no',
    'jobsheet_number',
    'invoice_no',
    'ref_no',
    'po_number',
  ]);
  const orderNumber =
    explicitOrderNumber ?? (!isIncompleteOrderId(orderId) ? orderId : '');

  return {
    ...src,
    id: normalizeId(src.id ?? src.rmp_order_report_id ?? src.order_id),
    order_id: orderId,
    order_number: orderNumber,
    customer_name: pickString(src, ['customer_name', 'company_name', 'name']) ?? '',
    customer_code: pickString(src, ['customer_code', 'code', 'customer_type']) ?? '',
    order_date: pickString(src, ['order_date', 'date']),
    total_amount: totalAmount,
    status: deriveOrderStatus(src),
    rmp_sku_id: pickString(src, ['rmp_sku_id', 'sku', 'sku_id']) ?? '',
    rmp_sku_name: pickString(src, ['rmp_sku_name', 'product_name', 'sku_name']) ?? '',
    quantity,
    price: unitPrice ?? (totalAmount != null && quantity ? totalAmount / quantity : undefined),
    created_at: pickString(src, ['created_at']) ?? new Date().toISOString(),
    updated_at: pickString(src, ['updated_at']) ?? new Date().toISOString(),
  };
}

function buildQuery(
  params: ScottPageParams,
  filters?: RmpOrderReportFilter,
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
  if (filters?.rmp_sku_id) {
    query.rmp_sku_id = filters.rmp_sku_id;
  }
  return query;
}

export async function fetchRmpOrderReportsPaginated(
  params?: Partial<ScottPageParams>,
  filters?: RmpOrderReportFilter,
): Promise<ScottPaginatedResult<RmpOrderReport>> {
  const p = normalizeScottPageParams(params);
  const query = buildQuery(p, filters);
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'rmp_order_reports',
    method: 'GET',
    query,
  });
  const rawRecords = extractRecords(body);
  const data = enrichRowsByOrderId(
    rawRecords.map((r) => normalizeRmpOrderReport(r)),
    ['customer_name', 'customer_code', 'order_date', 'status', 'order_id', 'order_number'],
  );
  return {
    data,
    ...buildScottPaginatedMeta(body, p, data.length),
  };
}

export const fetchRmpOrderReports = async (
  filters?: RmpOrderReportFilter,
): Promise<RmpOrderReport[]> =>
  fetchAllScottPages((pp) => fetchRmpOrderReportsPaginated(pp, filters));

export const getRmpOrderReportById = async (id: string): Promise<RmpOrderReport | null> => {
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'rmp_order_reports',
    method: 'GET',
    pathSuffix: id,
  });
  const data = (body as { data?: Record<string, unknown> }).data;
  if (!data) return null;
  return normalizeRmpOrderReport(data);
};
