import { Brand } from './types';
import {
  callScottDashboard,
  extractRecords,
  extractScottEntity,
  normalizeId,
  urlToScottFile,
  type ScottFilePayload,
} from '@/services/scott/callScottDashboard';
import {
  buildScottPaginatedMeta,
  fetchAllScottPages,
  normalizeScottPageParams,
  type ScottPageParams,
  type ScottPaginatedResult,
} from '@/services/scott/scottPagination';

function normalizeBrand(r: Record<string, unknown>): Brand {
  const status =
    typeof r.status === 'string'
      ? r.status
      : r.is_deleted === true || r.is_deleted === 'true'
        ? 'inactive'
        : 'active';
  const logoUrl =
    typeof r.logo_url === 'string'
      ? r.logo_url
      : r.logo && typeof r.logo === 'object' && r.logo !== null && 'url' in (r.logo as object)
        ? String((r.logo as { url?: string }).url)
        : undefined;
  return {
    id: normalizeId(r.id ?? r.authorized_brand_id),
    name: String(r.name ?? ''),
    description: r.description != null ? String(r.description) : undefined,
    logo_url: logoUrl,
    status,
    sort_order:
      typeof r.sort_order === 'number'
        ? r.sort_order
        : r.sort_order != null
          ? Number(r.sort_order)
          : undefined,
    created_at:
      typeof r.created_at === 'string' ? r.created_at : new Date().toISOString(),
    updated_at:
      typeof r.updated_at === 'string' ? r.updated_at : new Date().toISOString(),
  };
}

async function brandPayloadToForm(
  brandData: Omit<
    Brand,
    'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'
  > & { logoFile?: ScottFilePayload | null },
): Promise<Record<string, unknown>> {
  const isActive = brandData.status === 'active';
  const body: Record<string, unknown> = {
    name: brandData.name,
    description: brandData.description ?? '',
    status: isActive ? 'active' : 'inactive',
    is_deleted: isActive ? 'false' : 'true',
    sort_order: String(brandData.sort_order ?? 0),
  };
  if (brandData.logo_url) {
    body.logo_url = brandData.logo_url;
  }
  if (brandData.logoFile) {
    body.logo = brandData.logoFile;
  } else if (
    brandData.logo_url &&
    (brandData.logo_url.startsWith('http://') || brandData.logo_url.startsWith('https://'))
  ) {
    try {
      body.logo = await urlToScottFile(brandData.logo_url, 'logo.png');
    } catch {
      /* logo optional; URL may already be on Scott side */
    }
  }
  return body;
}

export interface BrandFilter {
  search?: string;
}

export async function fetchBrandsPaginated(
  params?: Partial<ScottPageParams>,
  filters?: BrandFilter,
): Promise<ScottPaginatedResult<Brand>> {
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
    resource: 'authorized_brands',
    method: 'GET',
    query,
  });
  const data = extractRecords(body).map((r) => normalizeBrand(r));
  return {
    data,
    ...buildScottPaginatedMeta(body, p, data.length),
  };
}

/** All pages — for dropdowns, create recovery, update merge. */
export const fetchBrands = async (): Promise<Brand[]> =>
  fetchAllScottPages((pp) => fetchBrandsPaginated(pp));

export const createBrand = async (
  brandData: Omit<Brand, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>,
): Promise<Brand> => {
  const form = await brandPayloadToForm(
    brandData as Omit<Brand, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>,
  );
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'authorized_brands',
    method: 'POST',
    body: form,
  });
  const row = extractScottEntity(body);
  if (row) {
    return normalizeBrand(row);
  }
  // Some environments return a minimal body on successful POST; recover from list.
  const refreshed = await fetchBrands();
  const wantName = brandData.name.trim();
  const matches = refreshed.filter((b) => b.name.trim() === wantName);
  if (matches.length === 1) {
    return matches[0];
  }
  if (matches.length > 1) {
    return [...matches].sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    )[0];
  }
  const snippet =
    body !== null && typeof body === 'object'
      ? JSON.stringify(body).slice(0, 400)
      : String(body);
  throw new Error(`Unexpected create brand response: ${snippet}`);
};

export const updateBrand = async (id: string, updates: Partial<Brand>): Promise<Brand> => {
  const all = await fetchBrands();
  const cur = all.find((b) => b.id === id);
  if (!cur) throw new Error('Brand not found');
  const merged = { ...cur, ...updates };
  const form = await brandPayloadToForm({
    name: merged.name,
    description: merged.description,
    logo_url: merged.logo_url,
    status: merged.status,
    sort_order: merged.sort_order,
  });
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'authorized_brands',
    method: 'PATCH',
    pathSuffix: id,
    body: form,
  });
  const row = extractScottEntity(body);
  if (row) {
    return normalizeBrand(row);
  }
  const again = await fetchBrands().then((rows) => rows.find((b) => b.id === id));
  if (again) return again;
  throw new Error('Unexpected update brand response');
};

export const deleteBrand = async (id: string): Promise<void> => {
  await callScottDashboard({
    resource: 'authorized_brands',
    method: 'DELETE',
    pathSuffix: id,
  });
};
