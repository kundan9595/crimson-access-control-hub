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

export interface BaseProductType {
  id: string;
  name: string;
  status: string;
  position?: number;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

function normalize(r: Record<string, unknown>): BaseProductType {
  const status =
    typeof r.status === 'string'
      ? r.status
      : r.is_deleted === true || r.is_deleted === 'true'
        ? 'inactive'
        : 'active';
  return {
    id: normalizeId(r.id),
    name: String(r.name ?? ''),
    status,
    position:
      typeof r.position === 'number'
        ? r.position
        : r.position != null
          ? Number(r.position)
          : undefined,
    image_url:
      typeof r.image_url === 'string'
        ? r.image_url
        : typeof (r as { Image?: string }).Image === 'string'
          ? ((r as { Image?: string }).Image as string)
          : undefined,
    created_at: typeof r.created_at === 'string' ? r.created_at : undefined,
    updated_at: typeof r.updated_at === 'string' ? r.updated_at : undefined,
  };
}

async function toForm(data: {
  name: string;
  status: string;
  position?: number;
  image?: string;
  imageFile?: ScottFilePayload | null;
}): Promise<Record<string, unknown>> {
  const isActive = data.status === 'active';
  const body: Record<string, unknown> = {
    name: data.name,
    is_deleted: isActive ? 'false' : 'true',
    status: isActive ? 'active' : 'inactive',
    position: String(data.position ?? 0),
  };
  if (data.imageFile) {
    body.image = data.imageFile;
  } else if (
    data.image &&
    (data.image.startsWith('http://') || data.image.startsWith('https://'))
  ) {
    try {
      body.image = await urlToScottFile(data.image, 'image.png');
    } catch {
      /* optional */
    }
  }
  return body;
}

export interface BaseProductTypeFilter {
  search?: string;
}

export async function fetchBaseProductTypesPaginated(
  params?: Partial<ScottPageParams>,
  filters?: BaseProductTypeFilter,
): Promise<ScottPaginatedResult<BaseProductType>> {
  const p = normalizeScottPageParams(params);
  const query: Record<string, string | number | boolean | undefined> = {
    items: p.items,
    page: p.page,
  };
  if (filters?.search) {
    query.search = filters.search;
  }
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'base_product_types',
    method: 'GET',
    query,
  });
  const data = extractRecords(body).map((r) => normalize(r));
  return {
    data,
    ...buildScottPaginatedMeta(body, p, data.length),
  };
}

export async function fetchBaseProductTypes(): Promise<BaseProductType[]> {
  return fetchAllScottPages((pp) => fetchBaseProductTypesPaginated(pp));
}

export async function createBaseProductType(data: {
  name: string;
  status: string;
  position?: number;
  image?: string;
}): Promise<BaseProductType> {
  const form = await toForm(data);
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'base_product_types',
    method: 'POST',
    body: form,
  });
  const row = extractScottEntity(body);
  if (row) {
    return normalize(row);
  }
  throw new Error('Unexpected create parent category response');
}

export async function updateBaseProductType(
  id: string,
  updates: Partial<{
    name: string;
    status: string;
    position: number;
    image: string;
    image_url: string;
  }>,
): Promise<BaseProductType> {
  const all = await fetchBaseProductTypes();
  const cur = all.find((b) => b.id === id);
  if (!cur) throw new Error('Parent category not found');
  const merged = {
    name: updates.name ?? cur.name,
    status: updates.status ?? cur.status,
    position: updates.position ?? cur.position,
    image: updates.image ?? updates.image_url ?? cur.image_url,
  };
  const form = await toForm(merged);
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'base_product_types',
    method: 'PATCH',
    pathSuffix: id,
    body: form,
  });
  const row = extractScottEntity(body);
  if (row) {
    return normalize(row);
  }
  const again = await fetchBaseProductTypes().then((rows) => rows.find((b) => b.id === id));
  if (again) return again;
  throw new Error('Unexpected update parent category response');
}

export async function deleteBaseProductType(id: string): Promise<void> {
  await callScottDashboard({
    resource: 'base_product_types',
    method: 'DELETE',
    pathSuffix: id,
  });
}
