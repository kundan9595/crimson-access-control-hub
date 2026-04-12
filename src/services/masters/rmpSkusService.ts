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

function normalizeRmpSku(r: Record<string, unknown>): RmpSku {
  const status =
    typeof r.status === 'string'
      ? r.status
      : r.is_deleted === true || r.is_deleted === 'true'
        ? 'inactive'
        : 'active';

  return {
    id: normalizeId(r.id ?? r.rmp_sku_id),
    name: String(r.name ?? ''),
    cgst: typeof r.cgst === 'number' ? r.cgst : Number(r.cgst ?? 0),
    igst: typeof r.igst === 'number' ? r.igst : Number(r.igst ?? 0),
    sgst: typeof r.sgst === 'number' ? r.sgst : Number(r.sgst ?? 0),
    is_deleted: r.is_deleted === true || r.is_deleted === 'true',
    rmp_size_id: r.rmp_size_id ? String(r.rmp_size_id) : undefined,
    rmp_class_id: r.rmp_class_id ? String(r.rmp_class_id) : undefined,
    rmp_brand_id: r.rmp_brand_id ? String(r.rmp_brand_id) : undefined,
    rmp_category_id: r.rmp_category_id ? String(r.rmp_category_id) : undefined,
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
    form.image = imageFile;
  }

  return form;
}

export async function fetchRmpSkusPaginated(
  params?: Partial<ScottPageParams>,
): Promise<ScottPaginatedResult<RmpSku>> {
  const p = normalizeScottPageParams(params);
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'rmp_skus',
    method: 'GET',
    query: {
      items: p.items,
      page: p.page,
      is_deleted: false,
    },
  });
  const data = extractRecords(body).map((r) => normalizeRmpSku(r));
  return {
    data,
    ...buildScottPaginatedMeta(body, p, data.length),
  };
}

export const fetchRmpSkus = async (): Promise<RmpSku[]> =>
  fetchAllScottPages((pp) => fetchRmpSkusPaginated(pp));

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
    form.image = imageFile;
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
