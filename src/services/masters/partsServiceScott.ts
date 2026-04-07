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

export interface Part {
  id: string;
  name: string;
  order_criteria: boolean;
  sort_position: number;
  status: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  // Legacy fields for compatibility
  selected_add_ons?: string[];
  selected_colors?: string[];
}

function normalizePart(r: Record<string, unknown>): Part {
  const status =
    typeof r.status === 'string'
      ? r.status
      : r.is_deleted === true || r.is_deleted === 'true'
        ? 'inactive'
        : 'active';

  return {
    id: normalizeId(r.id ?? r.part_id),
    name: String(r.name ?? ''),
    order_criteria:
      r.order_criteria === true ||
      r.order_criteria === 'true' ||
      r.order_criteria === '1',
    sort_position:
      typeof r.position === 'number'
        ? r.position
        : r.position != null
          ? Number(r.position)
          : typeof r.sort_position === 'number'
            ? r.sort_position
            : r.sort_position != null
              ? Number(r.sort_position)
              : 0,
    status,
    created_at:
      typeof r.created_at === 'string' ? r.created_at : new Date().toISOString(),
    updated_at:
      typeof r.updated_at === 'string' ? r.updated_at : new Date().toISOString(),
  };
}

function partToFormData(
  partData: Omit<Part, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>,
): Record<string, unknown> {
  const isActive = partData.status === 'active';
  return {
    name: partData.name,
    is_deleted: isActive ? 'false' : 'true',
    order_criteria: partData.order_criteria ? 'true' : 'false',
    position: String(partData.sort_position ?? 0),
  };
}

export async function fetchPartsPaginated(
  params?: Partial<ScottPageParams>,
): Promise<ScottPaginatedResult<Part>> {
  const p = normalizeScottPageParams(params);
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'parts',
    method: 'GET',
    query: {
      items: p.items,
      page: p.page,
      is_deleted: false,
    },
  });
  const data = extractRecords(body).map((r) => normalizePart(r));
  return {
    data,
    ...buildScottPaginatedMeta(body, p, data.length),
  };
}

export const fetchParts = async (): Promise<Part[]> =>
  fetchAllScottPages((pp) => fetchPartsPaginated(pp));

export const getPartById = async (id: string): Promise<Part | null> => {
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'parts',
    method: 'GET',
    pathSuffix: id,
  });
  const data = (body as { data?: Record<string, unknown> }).data;
  if (!data) return null;
  return normalizePart(data);
};

export const createPart = async (
  partData: Omit<Part, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>,
): Promise<Part> => {
  const form = partToFormData(partData);
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'parts',
    method: 'POST',
    body: form,
  });
  const row = extractScottEntity(body);
  if (row) {
    return normalizePart(row);
  }
  throw new Error('Failed to create part: invalid response');
};

export const updatePart = async (
  id: string,
  updates: Partial<Omit<Part, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>>,
): Promise<Part> => {
  const form: Record<string, unknown> = {};
  if (updates.name !== undefined) form.name = updates.name;
  if (updates.status !== undefined) {
    form.is_deleted = updates.status === 'active' ? 'false' : 'true';
  }
  if (updates.order_criteria !== undefined) {
    form.order_criteria = updates.order_criteria ? 'true' : 'false';
  }
  if (updates.sort_position !== undefined) form.position = String(updates.sort_position);

  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'parts',
    method: 'PATCH',
    pathSuffix: id,
    body: form,
  });
  const row = extractScottEntity(body);
  if (row) {
    return normalizePart(row);
  }
  throw new Error('Failed to update part: invalid response');
};

export const deletePart = async (id: string): Promise<void> => {
  await callScottDashboard<Record<string, unknown>>({
    resource: 'parts',
    method: 'DELETE',
    pathSuffix: id,
  });
};
