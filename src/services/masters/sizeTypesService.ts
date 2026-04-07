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

export interface SizeType {
  id: string;
  name: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

function normalize(r: Record<string, unknown>): SizeType {
  const status =
    typeof r.status === 'string'
      ? r.status
      : r.is_deleted === true || r.is_deleted === 'true'
        ? 'inactive'
        : 'active';
  return {
    id: normalizeId(r.id),
    name: String(r.name ?? ''),
    status,
    created_at: typeof r.created_at === 'string' ? r.created_at : undefined,
    updated_at: typeof r.updated_at === 'string' ? r.updated_at : undefined,
  };
}

export async function fetchSizeTypesPaginated(
  params?: Partial<ScottPageParams>,
): Promise<ScottPaginatedResult<SizeType>> {
  const p = normalizeScottPageParams(params);
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'size_types',
    method: 'GET',
    query: { items: p.items, page: p.page, is_deleted: false },
  });
  const data = extractRecords(body).map((r) => normalize(r));
  return {
    data,
    ...buildScottPaginatedMeta(body, p, data.length),
  };
}

export async function fetchSizeTypes(): Promise<SizeType[]> {
  return fetchAllScottPages((pp) => fetchSizeTypesPaginated(pp));
}

export async function createSizeType(data: {
  name: string;
  status: string;
}): Promise<SizeType> {
  const isActive = data.status === 'active';
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'size_types',
    method: 'POST',
    body: {
      name: data.name,
      status: isActive ? 'active' : 'inactive',
      is_deleted: isActive ? 'false' : 'true',
    },
  });
  const row = extractScottEntity(body);
  if (row) {
    return normalize(row);
  }
  throw new Error('Unexpected create size type response');
}

export async function updateSizeType(
  id: string,
  updates: Partial<{ name: string; status: string }>,
): Promise<SizeType> {
  const all = await fetchSizeTypes();
  const cur = all.find((s) => s.id === id);
  if (!cur) throw new Error('Size type not found');
  const merged = { name: updates.name ?? cur.name, status: updates.status ?? cur.status };
  const isActive = merged.status === 'active';
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'size_types',
    method: 'PATCH',
    pathSuffix: id,
    body: {
      name: merged.name,
      status: isActive ? 'active' : 'inactive',
      is_deleted: isActive ? 'false' : 'true',
    },
  });
  const row = extractScottEntity(body);
  if (row) {
    return normalize(row);
  }
  const again = await fetchSizeTypes().then((rows) => rows.find((s) => s.id === id));
  if (again) return again;
  throw new Error('Unexpected update size type response');
}

export async function deleteSizeType(id: string): Promise<void> {
  await callScottDashboard({
    resource: 'size_types',
    method: 'DELETE',
    pathSuffix: id,
  });
}
