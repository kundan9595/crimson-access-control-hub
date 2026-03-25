import { Brand } from './types';
import {
  callScottDashboard,
  extractRecords,
  normalizeId,
  urlToScottFile,
  type ScottFilePayload,
} from '@/services/scott/callScottDashboard';

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
    id: normalizeId(r.id),
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

export const fetchBrands = async (): Promise<Brand[]> => {
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'authorized_brands',
    method: 'GET',
    query: {
      items: 500,
      page: 1,
      is_deleted: false,
    },
  });
  return extractRecords(body).map((r) => normalizeBrand(r));
};

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
  const list = extractRecords(body);
  const row = list[0] ?? ((body as { data?: Record<string, unknown> }).data as Record<string, unknown>);
  if (row && typeof row === 'object' && 'id' in row) {
    return normalizeBrand(row as Record<string, unknown>);
  }
  throw new Error('Unexpected create brand response');
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
  const list = extractRecords(body);
  const row = list[0] ?? ((body as { data?: Record<string, unknown> }).data as Record<string, unknown>);
  if (row && typeof row === 'object' && 'id' in row) {
    return normalizeBrand(row as Record<string, unknown>);
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
