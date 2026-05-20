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

export interface RmpSku {
  id: string;
  name: string;
  cgst: number;
  igst: number;
  sgst: number;
  is_deleted: boolean;
  rmp_size_id?: string;
  rmp_class_id?: string;
  rmp_brand_id?: string;
  rmp_category_id?: string;
  image?: string;
  status: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  // Populated relations
  rmp_size?: { id: string; name: string };
  rmp_class?: { id: string; name: string };
  rmp_brand?: { id: string; name: string };
  rmp_category?: { id: string; name: string };
}

export interface RmpSkuFilter {
  search?: string;
}

function extractRmpSkuRelation(
  r: Record<string, unknown>,
  relKey: 'rmp_size' | 'rmp_class' | 'rmp_brand' | 'rmp_category',
  pascal: string,
): { id: string; name: string } | undefined {
  const raw = r[relKey] ?? r[pascal];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const o = raw as Record<string, unknown>;
  const idKey = `${relKey}_id` as const;
  const idVal = o.id ?? o[idKey];
  if (idVal == null || idVal === '') return undefined;
  return {
    id: normalizeId(idVal),
    name: String(o.name ?? ''),
  };
}

function normalizeRmpSku(r: Record<string, unknown>): RmpSku {
  const status =
    typeof r.status === 'string'
      ? r.status
      : r.is_deleted === true || r.is_deleted === 'true'
        ? 'inactive'
        : 'active';

  const embeddedSize = extractRmpSkuRelation(r, 'rmp_size', 'RmpSize');
  const embeddedClass = extractRmpSkuRelation(r, 'rmp_class', 'RmpClass');
  const embeddedBrand = extractRmpSkuRelation(r, 'rmp_brand', 'RmpBrand');
  const embeddedCategory = extractRmpSkuRelation(r, 'rmp_category', 'RmpCategory');

  const rawSizeId = r.rmp_size_id ?? r.rmpSizeId;
  const rawClassId = r.rmp_class_id ?? r.rmpClassId;
  const rawBrandId = r.rmp_brand_id ?? r.rmpBrandId;
  const rawCategoryId = r.rmp_category_id ?? r.rmpCategoryId;

  const rmp_size_id =
    rawSizeId != null && String(rawSizeId) !== ''
      ? String(rawSizeId)
      : embeddedSize?.id;
  const rmp_class_id =
    rawClassId != null && String(rawClassId) !== ''
      ? String(rawClassId)
      : embeddedClass?.id;
  const rmp_brand_id =
    rawBrandId != null && String(rawBrandId) !== ''
      ? String(rawBrandId)
      : embeddedBrand?.id;
  const rmp_category_id =
    rawCategoryId != null && String(rawCategoryId) !== ''
      ? String(rawCategoryId)
      : embeddedCategory?.id;

  return {
    id: normalizeId(r.id ?? r.rmp_sku_id),
    name: String(r.name ?? ''),
    cgst: typeof r.cgst === 'number' ? r.cgst : Number(r.cgst ?? 0),
    igst: typeof r.igst === 'number' ? r.igst : Number(r.igst ?? 0),
    sgst: typeof r.sgst === 'number' ? r.sgst : Number(r.sgst ?? 0),
    is_deleted: r.is_deleted === true || r.is_deleted === 'true',
    rmp_size_id,
    rmp_class_id,
    rmp_brand_id,
    rmp_category_id,
    image: r.image ? String(r.image) : undefined,
    status,
    created_at:
      typeof r.created_at === 'string' ? r.created_at : new Date().toISOString(),
    updated_at:
      typeof r.updated_at === 'string' ? r.updated_at : new Date().toISOString(),
    created_by: r.created_by ? String(r.created_by) : undefined,
    updated_by: r.updated_by ? String(r.updated_by) : undefined,
    rmp_size: embeddedSize,
    rmp_class: embeddedClass,
    rmp_brand: embeddedBrand,
    rmp_category: embeddedCategory,
  };
}

function rmpSkuToFormData(
  rmpSkuData: Omit<RmpSku, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'rmp_size' | 'rmp_class' | 'rmp_brand' | 'rmp_category'>,
  imageFile?: File,
): Record<string, unknown> {
  const isActive = rmpSkuData.status === 'active';

  const form: Record<string, unknown> = {
    name: rmpSkuData.name,
    cgst: String(rmpSkuData.cgst ?? 0),
    igst: String(rmpSkuData.igst ?? 0),
    sgst: String(rmpSkuData.sgst ?? 0),
    is_deleted: isActive ? 'false' : 'true',
  };

  if (rmpSkuData.rmp_size_id) {
    form.rmp_size_id = rmpSkuData.rmp_size_id;
  }
  if (rmpSkuData.rmp_class_id) {
    form.rmp_class_id = rmpSkuData.rmp_class_id;
  }
  if (rmpSkuData.rmp_brand_id) {
    form.rmp_brand_id = rmpSkuData.rmp_brand_id;
  }
  if (rmpSkuData.rmp_category_id) {
    form.rmp_category_id = rmpSkuData.rmp_category_id;
  }

  if (imageFile) {
    form.image = await fileToScottPayload(imageFile);
  }

  return form;
}

export async function fetchRmpSkusPaginated(
  params?: Partial<ScottPageParams>,
  filters?: RmpSkuFilter,
): Promise<ScottPaginatedResult<RmpSku>> {
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
    resource: 'rmp_skus',
    method: 'GET',
    query,
  });
  let records = extractRecords(body);

  // Client-side filtering fallback since rmp_skus API doesn't support search
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    records = records.filter((r) => {
      const name = String((r as Record<string, unknown>).name ?? '').toLowerCase();
      return name.includes(searchLower);
    });
  }

  const data = records.map((r) => normalizeRmpSku(r));
  return {
    data,
    ...buildScottPaginatedMeta(body, p, data.length),
  };
}

export const fetchRmpSkus = async (): Promise<RmpSku[]> => {
  try {
    return await fetchAllScottPages(
      (pp) => fetchRmpSkusPaginated(pp),
      { pageSize: 100, maxPages: 10 }
    );
  } catch (err) {
    console.error('fetchRmpSkus failed:', err);
    return [];
  }
};

/**
 * Fetches ALL SKU records (no page cap) for bulk import duplicate matching.
 * Unlike fetchRmpSkus, this does not cap at 10 pages so the full dataset
 * is available for accurate create vs update classification.
 */
export const fetchRmpSkusForBulkImport = async (): Promise<RmpSku[]> => {
  try {
    return await fetchAllScottPages(
      (pp) => fetchRmpSkusPaginated(pp),
      { pageSize: 100, maxPages: 250 },
    );
  } catch (err) {
    console.error('fetchRmpSkusForBulkImport failed:', err);
    return [];
  }
};

export const getRmpSkuById = async (id: string): Promise<RmpSku | null> => {
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'rmp_skus',
    method: 'GET',
    pathSuffix: id,
  });
  const data = (body as { data?: Record<string, unknown> }).data;
  if (!data) return null;
  return normalizeRmpSku(data);
};

export const createRmpSku = async (
  rmpSkuData: Omit<RmpSku, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'rmp_size' | 'rmp_class' | 'rmp_brand' | 'rmp_category'>,
  imageFile?: File,
): Promise<RmpSku> => {
  const form = rmpSkuToFormData(rmpSkuData, imageFile);
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'rmp_skus',
    method: 'POST',
    body: form,
  });
  const row = extractScottEntity(body);
  if (row) {
    return normalizeRmpSku(row);
  }
  throw new Error('Failed to create RMP SKU: invalid response');
};

export const updateRmpSku = async (
  id: string,
  updates: Partial<Omit<RmpSku, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'rmp_size' | 'rmp_class' | 'rmp_brand' | 'rmp_category'>>,
  imageFile?: File,
): Promise<RmpSku> => {
  const form: Record<string, unknown> = {};

  if (updates.name !== undefined) form.name = updates.name;
  if (updates.cgst !== undefined) form.cgst = String(updates.cgst);
  if (updates.igst !== undefined) form.igst = String(updates.igst);
  if (updates.sgst !== undefined) form.sgst = String(updates.sgst);
  if (updates.status !== undefined) {
    form.is_deleted = updates.status === 'active' ? 'false' : 'true';
  }
  if (updates.rmp_size_id !== undefined) {
    form.rmp_size_id = updates.rmp_size_id || '';
  }
  if (updates.rmp_class_id !== undefined) {
    form.rmp_class_id = updates.rmp_class_id || '';
  }
  if (updates.rmp_brand_id !== undefined) {
    form.rmp_brand_id = updates.rmp_brand_id || '';
  }
  if (updates.rmp_category_id !== undefined) {
    form.rmp_category_id = updates.rmp_category_id || '';
  }
  if (imageFile) {
    form.image = await fileToScottPayload(imageFile);
  }

  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'rmp_skus',
    method: 'PATCH',
    pathSuffix: id,
    body: form,
  });
  const row = extractScottEntity(body);
  if (row) {
    return normalizeRmpSku(row);
  }
  throw new Error('Failed to update RMP SKU: invalid response');
};

export const deleteRmpSku = async (id: string): Promise<void> => {
  await callScottDashboard<Record<string, unknown>>({
    resource: 'rmp_skus',
    method: 'DELETE',
    pathSuffix: id,
  });
};
