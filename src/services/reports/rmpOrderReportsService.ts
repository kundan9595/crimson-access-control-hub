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

function normalizeRmpOrderReport(r: Record<string, unknown>): RmpOrderReport {
  return {
    id: normalizeId(r.id ?? r.rmp_order_report_id ?? r.order_id),
    order_id: String(r.order_id ?? ''),
    order_number: String(r.order_number ?? ''),
    customer_name: String(r.customer_name ?? ''),
    customer_code: String(r.customer_code ?? ''),
    order_date: typeof r.order_date === 'string' ? r.order_date : undefined,
    total_amount: r.total_amount != null ? Number(r.total_amount) : undefined,
    status: String(r.status ?? ''),
    rmp_sku_id: String(r.rmp_sku_id ?? ''),
    rmp_sku_name: String(r.rmp_sku_name ?? ''),
    quantity: r.quantity != null ? Number(r.quantity) : undefined,
    price: r.price != null ? Number(r.price) : undefined,
    created_at:
      typeof r.created_at === 'string' ? r.created_at : new Date().toISOString(),
    updated_at:
      typeof r.updated_at === 'string' ? r.updated_at : new Date().toISOString(),
    ...r,
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
  const data = extractRecords(body).map((r) => normalizeRmpOrderReport(r));
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
