import {
  callScottDashboard,
  extractRecords,
  extractScottEntity,
  normalizeId,
  fileToScottPayload,
} from '@/services/scott/callScottDashboard';
import {
  buildScottPaginatedMeta,
  fetchAllScottPages,
  normalizeScottPageParams,
  type ScottPageParams,
  type ScottPaginatedResult,
} from '@/services/scott/scottPagination';

export type RmpSizeType = 'alpha' | 'numeric' | 'free_size' | 'kids' | 'bags';

export interface RmpSize {
  id: string;
  name: string;
  position: number;
  is_deleted: boolean;
  size_type: RmpSizeType;
  image?: string;
  status: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface RmpSizeFilter {
  search?: string;
}

const VALID_SIZE_TYPES: RmpSizeType[] = ['alpha', 'numeric', 'free_size', 'kids', 'bags'];

function normalizeRmpSize(r: Record<string, unknown>): RmpSize {
  const status =
    typeof r.status === 'string'
      ? r.status
      : r.is_deleted === true || r.is_deleted === 'true'
        ? 'inactive'
        : 'active';

  // Validate and normalize size_type
  let sizeType: RmpSizeType = 'alpha'; // default
  if (typeof r.size_type === 'string' && VALID_SIZE_TYPES.includes(r.size_type as RmpSizeType)) {
    sizeType = r.size_type as RmpSizeType;
  } else if (typeof r.size_type === 'string') {
    // If it's a string but not valid, try to find a match or default
    const normalizedType = r.size_type.toLowerCase().replace(/\s+/g, '_');
    if (VALID_SIZE_TYPES.includes(normalizedType as RmpSizeType)) {
      sizeType = normalizedType as RmpSizeType;
    }
  }

  return {
    id: normalizeId(r.id ?? r.rmp_size_id),
    name: String(r.name ?? ''),
    position:
      typeof r.position === 'number'
        ? r.position
        : r.position != null
          ? Number(r.position)
          : 0,
    is_deleted: r.is_deleted === true || r.is_deleted === 'true',
    size_type: sizeType,
    image: r.image ? String(r.image) : undefined,
    status,
    created_at:
      typeof r.created_at === 'string' ? r.created_at : new Date().toISOString(),
    updated_at:
      typeof r.updated_at === 'string' ? r.updated_at : new Date().toISOString(),
    created_by: r.created_by ? String(r.created_by) : undefined,
    updated_by: r.updated_by ? String(r.updated_by) : undefined,
  };
}

async function rmpSizeToFormData(
  rmpSizeData: Omit<RmpSize, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>,
  imageFile?: File,
): Promise<Record<string, unknown>> {
  const isActive = rmpSizeData.status === 'active';

  const form: Record<string, unknown> = {
    name: rmpSizeData.name,
    position: String(rmpSizeData.position ?? 0),
    size_type: rmpSizeData.size_type,
    is_deleted: isActive ? 'false' : 'true',
  };

  if (imageFile) {
    form.image = await fileToScottPayload(imageFile);
  }

  return form;
}

export async function fetchRmpSizesPaginated(
  params?: Partial<ScottPageParams>,
  filters?: RmpSizeFilter,
): Promise<ScottPaginatedResult<RmpSize>> {
  const p = normalizeScottPageParams(params);
  const query: Record<string, string | number | boolean | undefined> = {
    items: p.items,
    page: p.page,
    is_deleted: false,
  };
  if (filters?.search) {
    query.search = filters.search;
  }
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'rmp_sizes',
    method: 'GET',
    query,
  });
  const data = extractRecords(body).map((r) => normalizeRmpSize(r));
  return {
    data,
    ...buildScottPaginatedMeta(body, p, data.length),
  };
}

export const fetchRmpSizes = async (): Promise<RmpSize[]> =>
  fetchAllScottPages((pp) => fetchRmpSizesPaginated(pp));

export const getRmpSizeById = async (id: string): Promise<RmpSize | null> => {
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'rmp_sizes',
    method: 'GET',
    pathSuffix: id,
  });
  const data = (body as { data?: Record<string, unknown> }).data;
  if (!data) return null;
  return normalizeRmpSize(data);
};

export const createRmpSize = async (
  rmpSizeData: Omit<RmpSize, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>,
  imageFile?: File,
): Promise<RmpSize> => {
  const form = await rmpSizeToFormData(rmpSizeData, imageFile);
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'rmp_sizes',
    method: 'POST',
    body: form,
  });
  const row = extractScottEntity(body);
  if (row) {
    return normalizeRmpSize(row);
  }
  throw new Error('Failed to create RMP Size: invalid response');
};

export const updateRmpSize = async (
  id: string,
  updates: Partial<Omit<RmpSize, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>>,
  imageFile?: File,
): Promise<RmpSize> => {
  const form: Record<string, unknown> = {};

  if (updates.name !== undefined) form.name = updates.name;
  if (updates.position !== undefined) form.position = String(updates.position);
  if (updates.size_type !== undefined) form.size_type = updates.size_type;
  if (updates.status !== undefined) {
    form.is_deleted = updates.status === 'active' ? 'false' : 'true';
  }
  if (imageFile) {
    form.image = await fileToScottPayload(imageFile);
  }

  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'rmp_sizes',
    method: 'PATCH',
    pathSuffix: id,
    body: form,
  });
  const row = extractScottEntity(body);
  if (row) {
    return normalizeRmpSize(row);
  }
  throw new Error('Failed to update RMP Size: invalid response');
};

export const deleteRmpSize = async (id: string): Promise<void> => {
  await callScottDashboard<Record<string, unknown>>({
    resource: 'rmp_sizes',
    method: 'DELETE',
    pathSuffix: id,
  });
};
