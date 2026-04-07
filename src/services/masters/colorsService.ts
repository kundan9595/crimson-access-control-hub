import { Color } from './types';
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

function normalizeColor(r: Record<string, unknown>): Color {
  const status =
    typeof r.status === 'string'
      ? r.status
      : r.is_deleted === true || r.is_deleted === 'true'
        ? 'inactive'
        : 'active';
  return {
    id: normalizeId(r.id),
    name: String(r.name ?? ''),
    hex_code: String(r.hex_code ?? ''),
    status,
    created_at:
      typeof r.created_at === 'string' ? r.created_at : new Date().toISOString(),
    updated_at:
      typeof r.updated_at === 'string' ? r.updated_at : new Date().toISOString(),
    created_by: r.created_by ? String(r.created_by) : undefined,
    updated_by: r.updated_by ? String(r.updated_by) : undefined,
  };
}

function colorFormToBody(
  data: Omit<Color, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>,
): Record<string, unknown> {
  const isActive = data.status === 'active';
  return {
    name: data.name,
    hex_code: data.hex_code,
    status: isActive ? 'active' : 'inactive',
    is_deleted: isActive ? 'false' : 'true',
  };
}

export async function fetchColorsPaginated(
  params?: Partial<ScottPageParams>,
): Promise<ScottPaginatedResult<Color>> {
  const p = normalizeScottPageParams(params);
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'colors',
    method: 'GET',
    query: {
      items: p.items,
      page: p.page,
      is_deleted: false,
    },
  });
  const data = extractRecords(body).map((r) => normalizeColor(r));
  return {
    data,
    ...buildScottPaginatedMeta(body, p, data.length),
  };
}

/** All pages — for dropdowns, imports, merge helpers. */
export const fetchColors = async (): Promise<Color[]> =>
  fetchAllScottPages((pp) => fetchColorsPaginated(pp));

export const createColor = async (
  colorData: Omit<Color, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>,
): Promise<Color> => {
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'colors',
    method: 'POST',
    body: colorFormToBody(colorData),
  });
  const row = extractScottEntity(body);
  if (row) {
    return normalizeColor(row);
  }
  throw new Error('Unexpected create color response');
};

export const updateColor = async (
  id: string,
  updates: Partial<Color>,
): Promise<Color> => {
  const all = await fetchColors();
  const current = all.find((c) => c.id === id);
  if (!current) throw new Error('Color not found');
  const merged = { ...current, ...updates };
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'colors',
    method: 'PATCH',
    pathSuffix: id,
    body: colorFormToBody({
      name: merged.name,
      hex_code: merged.hex_code,
      status: merged.status,
    }),
  });
  const row = extractScottEntity(body);
  if (row) {
    return normalizeColor(row);
  }
  return fetchColors().then((rows) => {
    const found = rows.find((c) => c.id === id);
    if (found) return found;
    throw new Error('Unexpected update color response');
  });
};

export const deleteColor = async (id: string): Promise<void> => {
  await callScottDashboard({
    resource: 'colors',
    method: 'DELETE',
    pathSuffix: id,
  });
};
