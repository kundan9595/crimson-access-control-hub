import {
  callScottDashboard,
  extractRecords,
  extractScottEntity,
  normalizeId,
} from '@/services/scott/callScottDashboard';
import {
  buildScottPaginatedMeta,
  fetchAllScottPages,
  hasNextScottPage,
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
  rmp_price_type?: { id: string; name: string; price_for?: string };
}

export interface RmpPriceFilter {
  search?: string;
  rmp_sku_id?: string;
}

function extractIdFromRelation(
  r: Record<string, unknown>,
  relKey: 'rmp_sku' | 'rmp_price_type',
): string {
  const rel = r[relKey];
  if (!rel || typeof rel !== 'object' || Array.isArray(rel)) return '';
  const o = rel as Record<string, unknown>;
  const id = o.id ?? o[`${relKey}_id`];
  return id ? normalizeId(id) : '';
}

function normalizeRmpPrice(r: Record<string, unknown>): RmpPrice {
  const status =
    typeof r.status === 'string'
      ? r.status
      : r.is_deleted === true || r.is_deleted === 'true'
        ? 'inactive'
        : 'active';

  // Extract RMP SKU relation
  const sku = r.rmp_sku;
  let rmpSku: { id: string; name: string } | undefined;
  if (sku && typeof sku === 'object' && !Array.isArray(sku)) {
    const o = sku as Record<string, unknown>;
    rmpSku = {
      id: normalizeId(o.id),
      name: String(o.name ?? ''),
    };
  }

  // Extract RMP Price Type relation
  const priceType = r.rmp_price_type;
  let rmpPriceType: { id: string; name: string; price_for?: string } | undefined;
  if (priceType && typeof priceType === 'object' && !Array.isArray(priceType)) {
    const o = priceType as Record<string, unknown>;
    rmpPriceType = {
      id: normalizeId(o.id),
      name: String(o.name ?? ''),
      price_for: o.price_for ? String(o.price_for) : undefined,
    };
  }

  // Extract IDs from nested relation objects or use direct ID fields if present
  const rmp_sku_id = extractIdFromRelation(r, 'rmp_sku') || String(r.rmp_sku_id ?? '');
  const rmp_price_type_id = extractIdFromRelation(r, 'rmp_price_type') || String(r.rmp_price_type_id ?? '');

  return {
    id: normalizeId(r.id ?? r.rmp_price_id),
    name: String(r.name ?? ''),
    price: r.price != null ? Number(r.price) : 0,
    mrp: r.mrp != null ? Number(r.mrp) : 0,
    is_deleted: r.is_deleted === true || r.is_deleted === 'true',
    status,
    rmp_sku_id,
    rmp_price_type_id,
    created_at:
      typeof r.created_at === 'string' ? r.created_at : new Date().toISOString(),
    updated_at:
      typeof r.updated_at === 'string' ? r.updated_at : new Date().toISOString(),
    rmp_sku: rmpSku,
    rmp_price_type: rmpPriceType,
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
  filters?: RmpPriceFilter,
): Promise<ScottPaginatedResult<RmpPrice>> {
  const p = normalizeScottPageParams(params);
  const query: Record<string, string | number | boolean | undefined> = {
    items: p.items,
    page: p.page,
    is_deleted: false,
  };
  if (filters?.search) {
    query.search = filters.search;
  }
  if (filters?.rmp_sku_id) {
    query.rmp_sku_id = filters.rmp_sku_id;
  }
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'rmp_prices',
    method: 'GET',
    query,
  });
  const records = extractRecords(body);
  const data = records.map((r) => normalizeRmpPrice(r));
  return {
    data,
    ...buildScottPaginatedMeta(body, p, data.length),
  };
}

export const fetchRmpPrices = async (): Promise<RmpPrice[]> =>
  fetchAllScottPages((pp) => fetchRmpPricesPaginated(pp), { pageSize: 1000 });

export type RmpPriceMatchKey = { rmp_sku_id: string; rmp_price_type_id: string };

/** Below this unique-SKU count, per-SKU API calls are faster than a full-table scan. */
const PER_SKU_MATCH_THRESHOLD = 40;
const SKU_FETCH_CONCURRENCY = 8;
const FULL_SCAN_PAGE_SIZE = 5000;
const FULL_SCAN_CONCURRENCY = 6;

async function runBatched<T>(items: T[], concurrency: number, fn: (item: T) => Promise<void>) {
  for (let i = 0; i < items.length; i += concurrency) {
    await Promise.all(items.slice(i, i + concurrency).map(fn));
  }
}

function collectNeededPairs(matchKeys: RmpPriceMatchKey[]) {
  return new Set(
    matchKeys
      .filter((k) => k.rmp_sku_id && k.rmp_price_type_id)
      .map((k) => `${k.rmp_sku_id}|${k.rmp_price_type_id}`),
  );
}

function absorbMatchingPrices(
  prices: RmpPrice[],
  neededPairs: Set<string>,
  foundByPair: Map<string, RmpPrice>,
) {
  for (const price of prices) {
    const pairKey = `${price.rmp_sku_id}|${price.rmp_price_type_id}`;
    if (neededPairs.has(pairKey) && !foundByPair.has(pairKey)) {
      foundByPair.set(pairKey, price);
    }
  }
}

async function fetchPricesBySkuIds(
  uniqueSkuIds: string[],
  neededPairs: Set<string>,
): Promise<RmpPrice[]> {
  const foundByPair = new Map<string, RmpPrice>();
  await runBatched(uniqueSkuIds, SKU_FETCH_CONCURRENCY, async (skuId) => {
    let page = 1;
    for (;;) {
      const result = await fetchRmpPricesPaginated(
        { page, items: 500 },
        { rmp_sku_id: skuId },
      );
      absorbMatchingPrices(result.data, neededPairs, foundByPair);
      if (!hasNextScottPage(result) || foundByPair.size >= neededPairs.size) break;
      page += 1;
      if (page > 50) break;
    }
  });
  return [...foundByPair.values()];
}

async function fetchPricesByFullScan(neededPairs: Set<string>): Promise<RmpPrice[]> {
  const scanT0 = performance.now();
  const foundByPair = new Map<string, RmpPrice>();
  const pageSize = FULL_SCAN_PAGE_SIZE;
  const concurrency = FULL_SCAN_CONCURRENCY;

  const first = await fetchRmpPricesPaginated({ page: 1, items: pageSize });
  absorbMatchingPrices(first.data, neededPairs, foundByPair);

  if (foundByPair.size >= neededPairs.size) {
    return [...foundByPair.values()];
  }
  if (first.data.length < pageSize) {
    return [...foundByPair.values()];
  }

  const totalPages = first.totalCountIsExact
    ? Math.min(first.totalPages, 250)
    : 250;
  if (totalPages <= 1) {
    return [...foundByPair.values()];
  }

  const remainingPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
  for (let i = 0; i < remainingPages.length; i += concurrency) {
    if (foundByPair.size >= neededPairs.size) break;
    const batch = remainingPages.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (page) => {
        try {
          return await fetchRmpPricesPaginated({ page, items: pageSize });
        } catch (err) {
          console.error(`fetchPricesByFullScan page ${page} failed:`, err);
          return null;
        }
      }),
    );
    for (const result of batchResults) {
      if (result) absorbMatchingPrices(result.data, neededPairs, foundByPair);
    }
  }

  return [...foundByPair.values()];
}

/** Load existing prices for CSV rows — per-SKU for small imports, parallel full scan for large ones. */
export async function fetchRmpPricesForBulkImportMatch(
  matchKeys: RmpPriceMatchKey[],
  _skuIdToName: Map<string, string>,
): Promise<RmpPrice[]> {
  const t0 = performance.now();
  const neededPairs = collectNeededPairs(matchKeys);
  const uniqueSkuIds = [...new Set(matchKeys.map((k) => k.rmp_sku_id).filter(Boolean))];
  const strategy = uniqueSkuIds.length <= PER_SKU_MATCH_THRESHOLD ? 'per-sku' : 'full-scan';

  const result =
    strategy === 'per-sku'
      ? await fetchPricesBySkuIds(uniqueSkuIds, neededPairs)
      : await fetchPricesByFullScan(neededPairs);
  return result;
}

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
