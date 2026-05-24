import {
  callScottDashboard,
  extractRecords,
} from '@/services/scott/callScottDashboard';
import {
  buildScottPaginatedMeta,
  fetchAllScottPages,
  normalizeScottPageParams,
  type ScottPageParams,
  type ScottPaginatedResult,
} from '@/services/scott/scottPagination';

export interface ScottCustomerOption {
  id: string;
  company_name: string;
  customer_code?: string;
  contact_person?: string;
  customer_type?: string;
  status?: string;
}

export interface ScottCustomersFilters {
  search?: string;
  status?: string;
  customer_type?: string;
}

function normalizeCustomerRow(raw: Record<string, unknown>): ScottCustomerOption {
  const id = String(raw.id ?? raw.customer_id ?? '');
  const company_name = String(
    raw.company_name ?? raw.name ?? raw.customer_name ?? raw.company ?? 'Unknown',
  );
  return {
    id,
    company_name,
    customer_code: raw.customer_code != null ? String(raw.customer_code) : undefined,
    contact_person: raw.contact_person != null ? String(raw.contact_person) : undefined,
    customer_type: raw.customer_type != null ? String(raw.customer_type) : undefined,
    status: raw.status != null ? String(raw.status) : undefined,
  };
}

export async function fetchScottCustomersPaginated(
  params: ScottPageParams,
  filters?: ScottCustomersFilters,
): Promise<ScottPaginatedResult<ScottCustomerOption>> {
  const p = normalizeScottPageParams(params);
  const query: Record<string, string | number | boolean | undefined> = {
    items: p.items,
    page: p.page,
  };
  if (filters?.search?.trim()) query.search = filters.search.trim();
  if (filters?.status) query.status = filters.status;
  if (filters?.customer_type) query.customer_type = filters.customer_type;

  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'customers',
    method: 'GET',
    query,
  });

  const records = extractRecords(body);
  const data = records.map(normalizeCustomerRow).filter((c) => c.id && c.id !== 'undefined');

  return {
    data,
    ...buildScottPaginatedMeta(body, p, data.length),
  };
}

/** Load all Scott customers for client-side search in pickers. */
export async function fetchAllScottCustomers(
  filters?: Omit<ScottCustomersFilters, 'search'>,
): Promise<ScottCustomerOption[]> {
  const rows = await fetchAllScottPages(
    (p) => fetchScottCustomersPaginated(p, filters),
    { pageSize: 500, maxPages: 40 },
  );
  return rows.sort((a, b) => a.company_name.localeCompare(b.company_name));
}

export function matchesScottCustomerSearch(
  customer: ScottCustomerOption,
  searchTerm: string,
): boolean {
  const q = searchTerm.trim().toLowerCase();
  if (!q) return true;
  return [
    customer.company_name,
    customer.customer_code,
    customer.contact_person,
    customer.customer_type,
    customer.id,
  ].some((value) => value?.toLowerCase().includes(q));
}
