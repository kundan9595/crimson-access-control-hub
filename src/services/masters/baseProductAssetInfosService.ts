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

// Interface for Base Product Asset Info linking table
export interface BaseProductAssetInfo {
  id: string;
  base_product_id: string;
  add_on_id: string;
  part_id: string;
  asset_info_id: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  // Populated relations (may be returned by API)
  base_product?: {
    id: string;
    name: string;
  };
  add_on?: {
    id: string;
    name: string;
  };
  part?: {
    id: string;
    name: string;
  };
  asset_info?: {
    id: string;
    name: string;
  };
}

// Normalize Scott API response
function normalizeBaseProductAssetInfo(r: Record<string, unknown>): BaseProductAssetInfo {
  return {
    id: normalizeId(r.id ?? r.base_product_asset_info_id),
    base_product_id: String(r.base_product_id ?? ''),
    add_on_id: String(r.add_on_id ?? ''),
    part_id: String(r.part_id ?? ''),
    asset_info_id: String(r.asset_info_id ?? ''),
    is_deleted: r.is_deleted === true || r.is_deleted === 'true',
    created_at:
      typeof r.created_at === 'string' ? r.created_at : new Date().toISOString(),
    updated_at:
      typeof r.updated_at === 'string' ? r.updated_at : new Date().toISOString(),
  };
}

// Transform UI data to Scott API form data
function baseProductAssetInfoToFormData(
  data: Omit<BaseProductAssetInfo, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'base_product' | 'add_on' | 'part' | 'asset_info'>,
): Record<string, unknown> {
  const form: Record<string, unknown> = {
    base_product_id: data.base_product_id,
    add_on_id: data.add_on_id,
    part_id: data.part_id,
    asset_info_id: data.asset_info_id,
    is_deleted: data.is_deleted ? 'true' : 'false',
  };

  return form;
}

export async function fetchBaseProductAssetInfosPaginated(
  params?: Partial<ScottPageParams>,
): Promise<ScottPaginatedResult<BaseProductAssetInfo>> {
  const p = normalizeScottPageParams(params);
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'base_product_asset_infos',
    method: 'GET',
    query: {
      items: p.items,
      page: p.page,
      is_deleted: false,
    },
  });
  const data = extractRecords(body).map((r) => normalizeBaseProductAssetInfo(r));
  return {
    data,
    ...buildScottPaginatedMeta(body, p, data.length),
  };
}

export const fetchBaseProductAssetInfos = async (): Promise<BaseProductAssetInfo[]> =>
  fetchAllScottPages((pp) => fetchBaseProductAssetInfosPaginated(pp));

export const getBaseProductAssetInfoById = async (id: string): Promise<BaseProductAssetInfo | null> => {
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'base_product_asset_infos',
    method: 'GET',
    pathSuffix: id,
  });
  const data = (body as { data?: Record<string, unknown> }).data;
  if (!data) return null;
  return normalizeBaseProductAssetInfo(data);
};

export const createBaseProductAssetInfo = async (
  data: Omit<BaseProductAssetInfo, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'base_product' | 'add_on' | 'part' | 'asset_info'>,
): Promise<BaseProductAssetInfo> => {
  const form = baseProductAssetInfoToFormData(data);

  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'base_product_asset_infos',
    method: 'POST',
    body: form,
  });
  const row = extractScottEntity(body);
  if (row) {
    return normalizeBaseProductAssetInfo(row);
  }
  throw new Error('Failed to create base product asset info: invalid response');
};

export const updateBaseProductAssetInfo = async (
  id: string,
  updates: Partial<
    Omit<
      BaseProductAssetInfo,
      'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'base_product' | 'add_on' | 'part' | 'asset_info'
    >
  >,
): Promise<BaseProductAssetInfo> => {
  const form: Record<string, unknown> = {};

  if (updates.base_product_id !== undefined) form.base_product_id = updates.base_product_id;
  if (updates.add_on_id !== undefined) form.add_on_id = updates.add_on_id;
  if (updates.part_id !== undefined) form.part_id = updates.part_id;
  if (updates.asset_info_id !== undefined) form.asset_info_id = updates.asset_info_id;
  if (updates.is_deleted !== undefined) form.is_deleted = updates.is_deleted ? 'true' : 'false';

  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'base_product_asset_infos',
    method: 'PATCH',
    pathSuffix: id,
    body: form,
  });
  const row = extractScottEntity(body);
  if (row) {
    return normalizeBaseProductAssetInfo(row);
  }
  throw new Error('Failed to update base product asset info: invalid response');
};

export const deleteBaseProductAssetInfo = async (id: string): Promise<void> => {
  await callScottDashboard<Record<string, unknown>>({
    resource: 'base_product_asset_infos',
    method: 'DELETE',
    pathSuffix: id,
  });
};
