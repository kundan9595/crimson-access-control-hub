import { Size } from './types';
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

function normalizeSize(r: Record<string, unknown>): Size {
  const status =
    typeof r.status === 'string'
      ? r.status
      : r.is_deleted === true || r.is_deleted === 'true'
        ? 'inactive'
        : 'active';

  return {
    id: normalizeId(r.id ?? r.sc_size_id),
    name: String(r.name ?? ''),
    code: String(r.code ?? r.name ?? ''),
    size_group_id: String(r.size_type_id ?? r.size_group_id ?? ''),
    status,
    sort_order:
      typeof r.position === 'number'
        ? r.position
        : r.position != null
          ? Number(r.position)
          : r.sort_order != null
            ? Number(r.sort_order)
            : undefined,
    created_at:
      typeof r.created_at === 'string' ? r.created_at : new Date().toISOString(),
    updated_at:
      typeof r.updated_at === 'string' ? r.updated_at : new Date().toISOString(),
  };
}

function sizeToFormData(
  sizeData: Omit<Size, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>,
): Record<string, unknown> {
  const isActive = sizeData.status === 'active';
  return {
    name: sizeData.name,
    size_type_id: sizeData.size_group_id,
    is_deleted: isActive ? 'false' : 'true',
    position: String(sizeData.sort_order ?? 0),
  };
}

export async function fetchSizesPaginated(
  params?: Partial<ScottPageParams>,
): Promise<ScottPaginatedResult<Size>> {
  const p = normalizeScottPageParams(params);
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'sc_sizes',
    method: 'GET',
    query: {
      items: p.items,
      page: p.page,
      is_deleted: false,
    },
  });
  const data = extractRecords(body).map((r) => normalizeSize(r));
  return {
    data,
    ...buildScottPaginatedMeta(body, p, data.length),
  };
}

export const fetchSizes = async (): Promise<Size[]> =>
  fetchAllScottPages((pp) => fetchSizesPaginated(pp));

export const getSizeById = async (id: string): Promise<Size | null> => {
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'sc_sizes',
    method: 'GET',
    pathSuffix: id,
  });
  const data = (body as { data?: Record<string, unknown> }).data;
  if (!data) return null;
  return normalizeSize(data);
};

export const createSize = async (
  sizeData: Omit<Size, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>,
): Promise<Size> => {
  const form = sizeToFormData(sizeData);
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'sc_sizes',
    method: 'POST',
    body: form,
  });
  const row = extractScottEntity(body);
  if (row) {
    return normalizeSize(row);
  }
  throw new Error('Failed to create size: invalid response');
};

export const updateSize = async (
  id: string,
  updates: Partial<Omit<Size, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>>,
): Promise<Size> => {
  const form: Record<string, unknown> = {};
  if (updates.name !== undefined) form.name = updates.name;
  if (updates.size_group_id !== undefined) form.size_type_id = updates.size_group_id;
  if (updates.status !== undefined) {
    form.is_deleted = updates.status === 'active' ? 'false' : 'true';
  }
  if (updates.sort_order !== undefined) form.position = String(updates.sort_order);

  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'sc_sizes',
    method: 'PATCH',
    pathSuffix: id,
    body: form,
  });
  const row = extractScottEntity(body);
  if (row) {
    return normalizeSize(row);
  }
  throw new Error('Failed to update size: invalid response');
};

export const deleteSize = async (id: string): Promise<void> => {
  await callScottDashboard<Record<string, unknown>>({
    resource: 'sc_sizes',
    method: 'DELETE',
    pathSuffix: id,
  });
};
