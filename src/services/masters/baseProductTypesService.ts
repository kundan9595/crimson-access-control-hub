import {
  callScottDashboard,
  extractRecords,
  normalizeId,
  urlToScottFile,
  type ScottFilePayload,
} from '@/services/scott/callScottDashboard';

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

export async function fetchBaseProductTypes(): Promise<BaseProductType[]> {
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'base_product_types',
    method: 'GET',
    query: { items: 500, page: 1 },
  });
  return extractRecords(body).map((r) => normalize(r));
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
  const list = extractRecords(body);
  const row = list[0] ?? ((body as { data?: Record<string, unknown> }).data as Record<string, unknown>);
  if (row && typeof row === 'object' && 'id' in row) {
    return normalize(row as Record<string, unknown>);
  }
  throw new Error('Unexpected create base product type response');
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
  if (!cur) throw new Error('Base product type not found');
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
  const list = extractRecords(body);
  const row = list[0] ?? ((body as { data?: Record<string, unknown> }).data as Record<string, unknown>);
  if (row && typeof row === 'object' && 'id' in row) {
    return normalize(row as Record<string, unknown>);
  }
  const again = await fetchBaseProductTypes().then((rows) => rows.find((b) => b.id === id));
  if (again) return again;
  throw new Error('Unexpected update base product type response');
}

export async function deleteBaseProductType(id: string): Promise<void> {
  await callScottDashboard({
    resource: 'base_product_types',
    method: 'DELETE',
    pathSuffix: id,
  });
}
