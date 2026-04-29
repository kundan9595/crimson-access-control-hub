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

export interface TailorReport {
  id: string;
  tailor_id?: string;
  tailor_name?: string;
  tailor_code?: string;
  order_id?: string;
  order_number?: string;
  assigned_date?: string;
  completion_date?: string;
  status?: string;
  items_count?: number;
  total_value?: number;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface TailorReportFilter {
  search?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  tailor_id?: string;
}

function normalizeTailorReport(r: Record<string, unknown>): TailorReport {
  return {
    id: normalizeId(r.id ?? r.tailor_report_id ?? r.tailor_id),
    tailor_id: String(r.tailor_id ?? ''),
    tailor_name: String(r.tailor_name ?? ''),
    tailor_code: String(r.tailor_code ?? ''),
    order_id: String(r.order_id ?? ''),
    order_number: String(r.order_number ?? ''),
    assigned_date: typeof r.assigned_date === 'string' ? r.assigned_date : undefined,
    completion_date: typeof r.completion_date === 'string' ? r.completion_date : undefined,
    status: String(r.status ?? ''),
    items_count: r.items_count != null ? Number(r.items_count) : undefined,
    total_value: r.total_value != null ? Number(r.total_value) : undefined,
    created_at:
      typeof r.created_at === 'string' ? r.created_at : new Date().toISOString(),
    updated_at:
      typeof r.updated_at === 'string' ? r.updated_at : new Date().toISOString(),
    ...r,
  };
}

function buildQuery(
  params: ScottPageParams,
  filters?: TailorReportFilter,
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
  if (filters?.tailor_id) {
    query.tailor_id = filters.tailor_id;
  }
  return query;
}

export async function fetchTailorReportsPaginated(
  params?: Partial<ScottPageParams>,
  filters?: TailorReportFilter,
): Promise<ScottPaginatedResult<TailorReport>> {
  const p = normalizeScottPageParams(params);
  const query = buildQuery(p, filters);
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'tailor_reports',
    method: 'GET',
    query,
  });
  const data = extractRecords(body).map((r) => normalizeTailorReport(r));
  return {
    data,
    ...buildScottPaginatedMeta(body, p, data.length),
  };
}

export const fetchTailorReports = async (
  filters?: TailorReportFilter,
): Promise<TailorReport[]> =>
  fetchAllScottPages((pp) => fetchTailorReportsPaginated(pp, filters));

export const getTailorReportById = async (id: string): Promise<TailorReport | null> => {
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'tailor_reports',
    method: 'GET',
    pathSuffix: id,
  });
  const data = (body as { data?: Record<string, unknown> }).data;
  if (!data) return null;
  return normalizeTailorReport(data);
};
