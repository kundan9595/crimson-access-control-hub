import {
  callScottDashboard,
  extractRecords,
  normalizeId,
} from '@/services/scott/callScottDashboard';

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

export async function fetchSizeTypes(): Promise<SizeType[]> {
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'size_types',
    method: 'GET',
    query: { items: 500, page: 1, is_deleted: false },
  });
  return extractRecords(body).map((r) => normalize(r));
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
  const list = extractRecords(body);
  const row = list[0] ?? ((body as { data?: Record<string, unknown> }).data as Record<string, unknown>);
  if (row && typeof row === 'object' && 'id' in row) {
    return normalize(row as Record<string, unknown>);
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
  const list = extractRecords(body);
  const row = list[0] ?? ((body as { data?: Record<string, unknown> }).data as Record<string, unknown>);
  if (row && typeof row === 'object' && 'id' in row) {
    return normalize(row as Record<string, unknown>);
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
