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

function normalizeOrderReport(r: Record<string, unknown>): OrderReport {
  return {
    id: normalizeId(r.id ?? r.order_report_id ?? r.order_id),
    order_id: String(r.order_id ?? ''),
    order_number: String(r.order_number ?? ''),
    customer_name: String(r.customer_name ?? ''),
    customer_code: String(r.customer_code ?? ''),
    order_date: typeof r.order_date === 'string' ? r.order_date : undefined,
    total_amount: r.total_amount != null ? Number(r.total_amount) : undefined,
    status: String(r.status ?? ''),
    order_type: String(r.order_type ?? ''),
    created_at:
      typeof r.created_at === 'string' ? r.created_at : new Date().toISOString(),
    updated_at:
      typeof r.updated_at === 'string' ? r.updated_at : new Date().toISOString(),
    ...r,
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
  const data = extractRecords(body).map((r) => normalizeOrderReport(r));
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
