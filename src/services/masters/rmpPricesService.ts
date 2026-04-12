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

export interface RmpPrice {
  id: string;
  name: string;
  price: number;
  mrp: number;
  is_deleted: boolean;
  status: string;
  rmp_sku_id: string;
  rmp_price_type_id: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  rmp_sku?: { id: string; name: string };
}

function normalizeRmpPrice(r: Record<string, unknown>): RmpPrice {
  const status =
    typeof r.status === 'string'
      ? r.status
      : r.is_deleted === true || r.is_deleted === 'true'
        ? 'inactive'
        : 'active';

  const sku = r.rmp_sku;
  let rmpSku: { id: string; name: string } | undefined;
  if (sku && typeof sku === 'object' && !Array.isArray(sku)) {
    const o = sku as Record<string, unknown>;
    rmpSku = {
      id: normalizeId(o.id),
      name: String(o.name ?? ''),
    };
  }

  return {
    id: normalizeId(r.id ?? r.rmp_price_id),
    name: String(r.name ?? ''),
    price: r.price != null ? Number(r.price) : 0,
    mrp: r.mrp != null ? Number(r.mrp) : 0,
    is_deleted: r.is_deleted === true || r.is_deleted === 'true',
    status,
    rmp_sku_id: String(r.rmp_sku_id ?? ''),
    rmp_price_type_id: String(r.rmp_price_type_id ?? ''),
    created_at:
      typeof r.created_at === 'string' ? r.created_at : new Date().toISOString(),
    updated_at:
      typeof r.updated_at === 'string' ? r.updated_at : new Date().toISOString(),
    rmp_sku: rmpSku,
  };
}

function toFormBody(
  data: Omit<RmpPrice, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'rmp_sku'>,
): Record<string, unknown> {
  const isActive = data.status === 'active';
  return {
    name: data.name,
    price: String(data.price),
    mrp: String(data.mrp),
    is_deleted: isActive ? 'false' : 'true',
    rmp_sku_id: data.rmp_sku_id,
    rmp_price_type_id: data.rmp_price_type_id,
  };
}

export async function fetchRmpPricesPaginated(
  params?: Partial<ScottPageParams>,
): Promise<ScottPaginatedResult<RmpPrice>> {
  const p = normalizeScottPageParams(params);
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'rmp_prices',
    method: 'GET',
    query: {
      items: p.items,
      page: p.page,
      is_deleted: false,
    },
  });
  const data = extractRecords(body).map((r) => normalizeRmpPrice(r));
  return {
    data,
    ...buildScottPaginatedMeta(body, p, data.length),
  };
}

export const fetchRmpPrices = async (): Promise<RmpPrice[]> =>
  fetchAllScottPages((pp) => fetchRmpPricesPaginated(pp));

export const getRmpPriceById = async (id: string): Promise<RmpPrice | null> => {
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'rmp_prices',
    method: 'GET',
    pathSuffix: id,
  });
  const data = (body as { data?: Record<string, unknown> }).data;
  if (!data) return null;
  return normalizeRmpPrice(data);
};

export const createRmpPrice = async (
  data: Omit<RmpPrice, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'rmp_sku'>,
): Promise<RmpPrice> => {
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'rmp_prices',
    method: 'POST',
    body: toFormBody(data),
  });
  const row = extractScottEntity(body);
  if (row) {
    return normalizeRmpPrice(row);
  }
  throw new Error('Failed to create RMP price: invalid response');
};

export const updateRmpPrice = async (
  id: string,
  updates: Partial<Omit<RmpPrice, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'rmp_sku'>>,
): Promise<RmpPrice> => {
  const form: Record<string, unknown> = {};
  if (updates.name !== undefined) form.name = updates.name;
  if (updates.price !== undefined) form.price = String(updates.price);
  if (updates.mrp !== undefined) form.mrp = String(updates.mrp);
  if (updates.status !== undefined) {
    form.is_deleted = updates.status === 'active' ? 'false' : 'true';
  }
  if (updates.rmp_sku_id !== undefined) form.rmp_sku_id = updates.rmp_sku_id;
  if (updates.rmp_price_type_id !== undefined) form.rmp_price_type_id = updates.rmp_price_type_id;

  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'rmp_prices',
    method: 'PATCH',
    pathSuffix: id,
    body: form,
  });
  const row = extractScottEntity(body);
  if (row) {
    return normalizeRmpPrice(row);
  }
  throw new Error('Failed to update RMP price: invalid response');
};

export const deleteRmpPrice = async (id: string): Promise<void> => {
  await callScottDashboard<Record<string, unknown>>({
    resource: 'rmp_prices',
    method: 'DELETE',
    pathSuffix: id,
  });
};
