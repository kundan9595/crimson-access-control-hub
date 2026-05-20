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

export interface RmpBrand {
  id: string;
  name: string;
  position: number;
  is_deleted: boolean;
  main_category?: string;
  authorized_brand_id?: string;
  image?: string;
  status: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  // Populated relations
  authorized_brand?: { id: string; name: string };
  rmp_categories?: { id: string; name: string }[];
}

export interface RmpBrandFilter {
  search?: string;
}

function extractEmbeddedAuthorizedBrand(
  r: Record<string, unknown>,
): { id: string; name: string } | undefined {
  const raw = r.authorized_brand ?? r.AuthorizedBrand;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const o = raw as Record<string, unknown>;
  const idVal = o.id ?? o.authorized_brand_id;
  if (idVal == null || idVal === '') return undefined;
  return {
    id: normalizeId(idVal),
    name: String(o.name ?? ''),
  };
}

function normalizeRmpBrand(r: Record<string, unknown>): RmpBrand {
  const status =
    typeof r.status === 'string'
      ? r.status
      : r.is_deleted === true || r.is_deleted === 'true'
        ? 'inactive'
        : 'active';

  const embeddedAuth = extractEmbeddedAuthorizedBrand(r);
  const rawAuthId = r.authorized_brand_id ?? r.authorizedBrandId;
  const authorized_brand_id =
    rawAuthId != null && String(rawAuthId) !== ''
      ? String(rawAuthId)
      : embeddedAuth?.id;

  return {
    id: normalizeId(r.id ?? r.rmp_brand_id),
    name: String(r.name ?? ''),
    position:
      typeof r.position === 'number'
        ? r.position
        : r.position != null
          ? Number(r.position)
          : 0,
    is_deleted: r.is_deleted === true || r.is_deleted === 'true',
    main_category: r.main_category ? String(r.main_category) : undefined,
    authorized_brand_id,
    authorized_brand: embeddedAuth,
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

function rmpBrandToFormData(
  rmpBrandData: Omit<RmpBrand, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'authorized_brand' | 'rmp_categories'>,
  imageFile?: File,
): Record<string, unknown> {
  const isActive = rmpBrandData.status === 'active';

  const form: Record<string, unknown> = {
    name: rmpBrandData.name,
    position: String(rmpBrandData.position ?? 0),
    is_deleted: isActive ? 'false' : 'true',
  };

  if (rmpBrandData.main_category) {
    form.main_category = rmpBrandData.main_category;
  }
  if (rmpBrandData.authorized_brand_id) {
    form.authorized_brand_id = rmpBrandData.authorized_brand_id;
  }

  if (imageFile) {
    form.image = await fileToScottPayload(imageFile);
  }

  return form;
}

export async function fetchRmpBrandsPaginated(
  params?: Partial<ScottPageParams>,
  filters?: RmpBrandFilter,
): Promise<ScottPaginatedResult<RmpBrand>> {
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
    resource: 'rmp_brands',
    method: 'GET',
    query,
  });
  const data = extractRecords(body).map((r) => normalizeRmpBrand(r));
  return {
    data,
    ...buildScottPaginatedMeta(body, p, data.length),
  };
}

export const fetchRmpBrands = async (): Promise<RmpBrand[]> =>
  fetchAllScottPages((pp) => fetchRmpBrandsPaginated(pp));

export const getRmpBrandById = async (id: string): Promise<RmpBrand | null> => {
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'rmp_brands',
    method: 'GET',
    pathSuffix: id,
  });
  const data = (body as { data?: Record<string, unknown> }).data;
  if (!data) return null;
  return normalizeRmpBrand(data);
};

export const createRmpBrand = async (
  rmpBrandData: Omit<RmpBrand, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'authorized_brand' | 'rmp_categories'>,
  imageFile?: File,
): Promise<RmpBrand> => {
  const form = rmpBrandToFormData(rmpBrandData, imageFile);
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'rmp_brands',
    method: 'POST',
    body: form,
  });
  const row = extractScottEntity(body);
  if (row) {
    return normalizeRmpBrand(row);
  }
  throw new Error('Failed to create RMP Brand: invalid response');
};

export const updateRmpBrand = async (
  id: string,
  updates: Partial<Omit<RmpBrand, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'authorized_brand' | 'rmp_categories'>>,
  imageFile?: File,
): Promise<RmpBrand> => {
  const form: Record<string, unknown> = {};

  if (updates.name !== undefined) form.name = updates.name;
  if (updates.position !== undefined) form.position = String(updates.position);
  if (updates.status !== undefined) {
    form.is_deleted = updates.status === 'active' ? 'false' : 'true';
  }
  if (updates.main_category !== undefined) {
    form.main_category = updates.main_category || '';
  }
  if (updates.authorized_brand_id !== undefined) {
    form.authorized_brand_id = updates.authorized_brand_id || '';
  }
  if (imageFile) {
    form.image = await fileToScottPayload(imageFile);
  }

  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'rmp_brands',
    method: 'PATCH',
    pathSuffix: id,
    body: form,
  });
  const row = extractScottEntity(body);
  if (row) {
    return normalizeRmpBrand(row);
  }
  throw new Error('Failed to update RMP Brand: invalid response');
};

export const deleteRmpBrand = async (id: string): Promise<void> => {
  await callScottDashboard<Record<string, unknown>>({
    resource: 'rmp_brands',
    method: 'DELETE',
    pathSuffix: id,
  });
};

// Special endpoint to update RMP Brand categories
export const updateRmpBrandCategories = async (
  id: string,
  rmpCategoryIds: string[],
): Promise<void> => {
  const formData: Record<string, unknown> = {};
  rmpCategoryIds.forEach((categoryId, index) => {
    formData[`rmp_category_ids[${index}]`] = categoryId;
  });

  await callScottDashboard<Record<string, unknown>>({
    resource: 'rmp_brands',
    method: 'PATCH',
    pathSuffix: `${id}/update_categories`,
    body: formData,
  });
};
