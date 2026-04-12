import {
  callScottDashboard,
  extractRecords,
  extractScottEntity,
  normalizeId,
  urlToScottFile,
} from '@/services/scott/callScottDashboard';
import {
  buildScottPaginatedMeta,
  fetchAllScottPages,
  normalizeScottPageParams,
  type ScottPageParams,
  type ScottPaginatedResult,
} from '@/services/scott/scottPagination';

export interface RmpCategory {
  id: string;
  name: string;
  position: number;
  is_deleted: boolean;
  status: string;
  image?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

function normalizeRmpCategory(r: Record<string, unknown>): RmpCategory {
  const status =
    typeof r.status === 'string'
      ? r.status
      : r.is_deleted === true || r.is_deleted === 'true'
        ? 'inactive'
        : 'active';

  return {
    id: normalizeId(r.id ?? r.rmp_category_id),
    name: String(r.name ?? ''),
    position:
      typeof r.position === 'number'
        ? r.position
        : r.position != null
          ? Number(r.position)
          : 0,
    is_deleted: r.is_deleted === true || r.is_deleted === 'true',
    status,
    image: r.image ? String(r.image) : undefined,
    created_at:
      typeof r.created_at === 'string' ? r.created_at : new Date().toISOString(),
    updated_at:
      typeof r.updated_at === 'string' ? r.updated_at : new Date().toISOString(),
  };
}

async function toFormDataAsync(
  data: Omit<RmpCategory, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>,
  imageFile?: File,
): Promise<Record<string, unknown>> {
  const isActive = data.status === 'active';
  const form: Record<string, unknown> = {
    name: data.name,
    position: String(data.position ?? 0),
    is_deleted: isActive ? 'false' : 'true',
  };
  if (imageFile) {
    form.image = imageFile;
  } else if (data.image?.startsWith('http://') || data.image?.startsWith('https://')) {
    try {
      form.image = await urlToScottFile(data.image, 'category.png');
    } catch {
      /* optional */
    }
  }
  return form;
}

export interface RmpCategoriesFilter {
  search?: string;
}

export async function fetchRmpCategoriesPaginated(
  params?: Partial<ScottPageParams>,
  filters?: RmpCategoriesFilter,
): Promise<ScottPaginatedResult<RmpCategory>> {
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
    resource: 'rmp_categories',
    method: 'GET',
    query,
  });
  const data = extractRecords(body).map((r) => normalizeRmpCategory(r));
  return {
    data,
    ...buildScottPaginatedMeta(body, p, data.length),
  };
}

export const fetchRmpCategories = async (): Promise<RmpCategory[]> =>
  fetchAllScottPages((pp) => fetchRmpCategoriesPaginated(pp));

export const getRmpCategoryById = async (id: string): Promise<RmpCategory | null> => {
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'rmp_categories',
    method: 'GET',
    pathSuffix: id,
  });
  const data = (body as { data?: Record<string, unknown> }).data;
  if (!data) return null;
  return normalizeRmpCategory(data);
};

export const createRmpCategory = async (
  data: Omit<RmpCategory, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>,
  imageFile?: File,
): Promise<RmpCategory> => {
  const form = await toFormDataAsync(data, imageFile);
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'rmp_categories',
    method: 'POST',
    body: form,
  });
  const row = extractScottEntity(body);
  if (row) {
    return normalizeRmpCategory(row);
  }
  throw new Error('Failed to create RMP category: invalid response');
};

export const updateRmpCategory = async (
  id: string,
  updates: Partial<Omit<RmpCategory, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>>,
  imageFile?: File,
): Promise<RmpCategory> => {
  const form: Record<string, unknown> = {};
  if (updates.name !== undefined) form.name = updates.name;
  if (updates.position !== undefined) form.position = String(updates.position);
  if (updates.status !== undefined) {
    form.is_deleted = updates.status === 'active' ? 'false' : 'true';
  }
  if (imageFile) {
    form.image = imageFile;
  } else if (updates.image?.startsWith('http://') || updates.image?.startsWith('https://')) {
    try {
      form.image = await urlToScottFile(updates.image, 'category.png');
    } catch {
      /* optional */
    }
  }

  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'rmp_categories',
    method: 'PATCH',
    pathSuffix: id,
    body: form,
  });
  const row = extractScottEntity(body);
  if (row) {
    return normalizeRmpCategory(row);
  }
  throw new Error('Failed to update RMP category: invalid response');
};

export const deleteRmpCategory = async (id: string): Promise<void> => {
  await callScottDashboard<Record<string, unknown>>({
    resource: 'rmp_categories',
    method: 'DELETE',
    pathSuffix: id,
  });
};
