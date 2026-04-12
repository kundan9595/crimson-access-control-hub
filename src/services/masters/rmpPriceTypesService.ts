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

export type PriceForType = 'customer' | 'dealer' | 'zone';

export interface RmpPriceType {
  id: string;
  name: string;
  price_for: PriceForType;
  zone_id: string;
  is_deleted: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  // Nested relation from show/index
  zone?: {
    id: string;
    name: string;
  };
}

function normalizeRmpPriceType(r: Record<string, unknown>): RmpPriceType {
  const status =
    typeof r.status === 'string'
      ? r.status
      : r.is_deleted === true || r.is_deleted === 'true'
        ? 'inactive'
        : 'active';

  const zone = r.zone;
  let zoneObj: { id: string; name: string } | undefined;
  if (zone && typeof zone === 'object' && !Array.isArray(zone)) {
    const o = zone as Record<string, unknown>;
    zoneObj = {
      id: normalizeId(o.id),
      name: String(o.name ?? ''),
    };
  }

  // Handle nested rmp_price_type from show responses
  const entity = (r as { rmp_price_type?: Record<string, unknown> }).rmp_price_type;
  const src = entity ?? r;

  return {
    id: normalizeId(src.id ?? r.rmp_price_type_id),
    name: String(src.name ?? ''),
    price_for: (String(src.price_for ?? 'zone') as PriceForType) || 'zone',
    zone_id: String(src.zone_id ?? ''),
    is_deleted: src.is_deleted === true || src.is_deleted === 'true',
    status,
    zone: zoneObj,
    created_at:
      typeof src.created_at === 'string' ? src.created_at : new Date().toISOString(),
    updated_at:
      typeof src.updated_at === 'string' ? src.updated_at : new Date().toISOString(),
  };
}

function toFormBody(
  data: Omit<RmpPriceType, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'zone'>,
): Record<string, unknown> {
  const isActive = data.status === 'active';
  return {
    name: data.name,
    price_for: data.price_for,
    zone_id: data.zone_id,
    is_deleted: isActive ? 'false' : 'true',
  };
}

export async function fetchRmpPriceTypesPaginated(
  params?: Partial<ScottPageParams>,
): Promise<ScottPaginatedResult<RmpPriceType>> {
  const p = normalizeScottPageParams(params);
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'rmp_price_types',
    method: 'GET',
    query: {
      items: p.items,
      page: p.page,
      is_deleted: false,
    },
  });
  const data = extractRecords(body).map((r) => normalizeRmpPriceType(r));
  return {
    data,
    ...buildScottPaginatedMeta(body, p, data.length),
  };
}

export const fetchRmpPriceTypes = async (): Promise<RmpPriceType[]> =>
  fetchAllScottPages((pp) => fetchRmpPriceTypesPaginated(pp));

export const getRmpPriceTypeById = async (id: string): Promise<RmpPriceType | null> => {
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'rmp_price_types',
    method: 'GET',
    pathSuffix: id,
  });
  const data = (body as { data?: Record<string, unknown> }).data;
  if (!data) return null;
  return normalizeRmpPriceType(data);
};

export const createRmpPriceType = async (
  data: Omit<RmpPriceType, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'zone'>,
): Promise<RmpPriceType> => {
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'rmp_price_types',
    method: 'POST',
    body: toFormBody(data),
  });
  const row = extractScottEntity(body);
  if (row) {
    return normalizeRmpPriceType(row);
  }
  throw new Error('Failed to create RMP price type: invalid response');
};

export const updateRmpPriceType = async (
  id: string,
  updates: Partial<Omit<RmpPriceType, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'zone'>>,
): Promise<RmpPriceType> => {
  const form: Record<string, unknown> = {};
  if (updates.name !== undefined) form.name = updates.name;
  if (updates.price_for !== undefined) form.price_for = updates.price_for;
  if (updates.zone_id !== undefined) form.zone_id = updates.zone_id;
  if (updates.status !== undefined) {
    form.is_deleted = updates.status === 'active' ? 'false' : 'true';
  }

  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'rmp_price_types',
    method: 'PATCH',
    pathSuffix: id,
    body: form,
  });
  const row = extractScottEntity(body);
  if (row) {
    return normalizeRmpPriceType(row);
  }
  throw new Error('Failed to update RMP price type: invalid response');
};

export const deleteRmpPriceType = async (id: string): Promise<void> => {
  await callScottDashboard<Record<string, unknown>>({
    resource: 'rmp_price_types',
    method: 'DELETE',
    pathSuffix: id,
  });
};
