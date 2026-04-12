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

function extractLinkedEntity(
  r: Record<string, unknown>,
  relKey: 'base_product' | 'add_on' | 'part' | 'asset_info',
  pascal: string,
): { id: string; name: string } | undefined {
  const raw = r[relKey] ?? (r as Record<string, unknown>)[pascal];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const o = raw as Record<string, unknown>;
  const idKey = `${relKey}_id` as 'base_product_id' | 'add_on_id' | 'part_id' | 'asset_info_id';
  const idVal = o.id ?? o[idKey];
  if (idVal == null || idVal === '') return undefined;
  return {
    id: normalizeId(idVal),
    name: String(o.name ?? ''),
  };
}

// Normalize Scott API response
function normalizeBaseProductAssetInfo(r: Record<string, unknown>): BaseProductAssetInfo {
  const embeddedBp = extractLinkedEntity(r, 'base_product', 'BaseProduct');
  const embeddedAddOn = extractLinkedEntity(r, 'add_on', 'AddOn');
  const embeddedPart = extractLinkedEntity(r, 'part', 'Part');
  const embeddedAsset = extractLinkedEntity(r, 'asset_info', 'AssetInfo');

  const rawBp = r.base_product_id ?? r.baseProductId;
  const rawAddOn = r.add_on_id ?? r.addOnId;
  const rawPart = r.part_id ?? r.partId;
  const rawAsset = r.asset_info_id ?? r.assetInfoId;

  const base_product_id =
    rawBp != null && String(rawBp) !== '' ? String(rawBp) : embeddedBp?.id ?? '';
  const add_on_id =
    rawAddOn != null && String(rawAddOn) !== '' ? String(rawAddOn) : embeddedAddOn?.id ?? '';
  const part_id =
    rawPart != null && String(rawPart) !== '' ? String(rawPart) : embeddedPart?.id ?? '';
  const asset_info_id =
    rawAsset != null && String(rawAsset) !== '' ? String(rawAsset) : embeddedAsset?.id ?? '';

  return {
    id: normalizeId(r.id ?? r.base_product_asset_info_id),
    base_product_id,
    add_on_id,
    part_id,
    asset_info_id,
    is_deleted: r.is_deleted === true || r.is_deleted === 'true',
    created_at:
      typeof r.created_at === 'string' ? r.created_at : new Date().toISOString(),
    updated_at:
      typeof r.updated_at === 'string' ? r.updated_at : new Date().toISOString(),
    created_by: r.created_by ? String(r.created_by) : undefined,
    updated_by: r.updated_by ? String(r.updated_by) : undefined,
    base_product: embeddedBp,
    add_on: embeddedAddOn,
    part: embeddedPart,
    asset_info: embeddedAsset,
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

export interface BaseProductAssetInfoFilter {
  search?: string;
}

export async function fetchBaseProductAssetInfosPaginated(
  params?: Partial<ScottPageParams>,
  filters?: BaseProductAssetInfoFilter,
): Promise<ScottPaginatedResult<BaseProductAssetInfo>> {
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
    resource: 'base_product_asset_infos',
    method: 'GET',
    query,
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
