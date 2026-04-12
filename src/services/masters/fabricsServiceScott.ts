import {
  callScottDashboard,
  extractRecords,
  extractScottEntity,
  normalizeId,
} from '@/services/scott/callScottDashboard';
import { fetchColors } from '@/services/masters/colorsService';
import {
  buildScottPaginatedMeta,
  fetchAllScottPages,
  normalizeScottPageParams,
  type ScottPageParams,
  type ScottPaginatedResult,
} from '@/services/scott/scottPagination';

export interface Fabric {
  id: string;
  name: string;
  fabric_type: 'Cotton' | 'Poly Cotton' | 'Polyester' | string;
  gsm: number;
  uom: 'kg' | 'meter' | string;
  price: number;
  color_ids?: string[];
  image_url?: string;
  status: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  colors?: {
    id: string;
    name: string;
    hex_code: string;
  }[];
}

function normalizeFabric(r: Record<string, unknown>): Fabric {
  const status =
    typeof r.status === 'string'
      ? r.status
      : r.is_deleted === true || r.is_deleted === 'true'
        ? 'inactive'
        : 'active';

  return {
    id: normalizeId(r.id ?? r.fabric_id),
    name: String(r.name ?? ''),
    fabric_type: String(r.fabric_type ?? ''),
    gsm: Number(r.gsm ?? 0),
    uom: String(r.uom ?? 'kg'),
    price: Number(r.price ?? 0),
    color_ids: Array.isArray(r.color_ids)
      ? (r.color_ids as string[])
      : [],
    image_url: typeof r.image === 'string' ? r.image : r.image_url as string | undefined,
    status,
    created_at:
      typeof r.created_at === 'string' ? r.created_at : new Date().toISOString(),
    updated_at:
      typeof r.updated_at === 'string' ? r.updated_at : new Date().toISOString(),
  };
}

function fabricToFormData(
  fabricData: Omit<Fabric, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'colors'>,
  imageFile?: File,
): Record<string, unknown> {
  const isActive = fabricData.status === 'active';
  const form: Record<string, unknown> = {
    name: fabricData.name,
    fabric_type: fabricData.fabric_type,
    gsm: String(fabricData.gsm),
    uom: fabricData.uom,
    price: String(fabricData.price),
    is_deleted: isActive ? 'false' : 'true',
  };

  // Add color_ids as array
  if (fabricData.color_ids && fabricData.color_ids.length > 0) {
    fabricData.color_ids.forEach((colorId, index) => {
      form[`color_ids[${index}]`] = colorId;
    });
  }

  if (imageFile) {
    form.image = imageFile;
  }

  return form;
}

async function enrichFabricsWithColors(fabrics: Fabric[]): Promise<Fabric[]> {
  if (fabrics.length === 0) return fabrics;

  try {
    const allColors = await fetchColors();
    const colorMap = new Map(allColors.map((c) => [c.id, c]));

    return fabrics.map((fabric) => {
      if (fabric.color_ids && fabric.color_ids.length > 0) {
        const colorsData = fabric.color_ids
          .map((cid: string) => colorMap.get(cid))
          .filter(Boolean)
          .map((c) => ({
            id: c!.id,
            name: c!.name,
            hex_code: c!.hex_code,
          }));
        return { ...fabric, colors: colorsData };
      }
      return { ...fabric, colors: [] };
    });
  } catch (error) {
    return fabrics.map((f) => ({ ...f, colors: [] }));
  }
}

export interface FabricFilter {
  search?: string;
}

export async function fetchFabricsPaginated(
  params?: Partial<ScottPageParams>,
  filters?: FabricFilter,
): Promise<ScottPaginatedResult<Fabric>> {
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
    resource: 'fabrics',
    method: 'GET',
    query,
  });
  const fabrics = extractRecords(body).map((r) => normalizeFabric(r));
  const data = await enrichFabricsWithColors(fabrics);
  return {
    data,
    ...buildScottPaginatedMeta(body, p, data.length),
  };
}

export const fetchFabrics = async (): Promise<Fabric[]> =>
  fetchAllScottPages((pp) => fetchFabricsPaginated(pp));

export const getFabricById = async (id: string): Promise<Fabric | null> => {
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'fabrics',
    method: 'GET',
    pathSuffix: id,
  });
  const data = (body as { data?: Record<string, unknown> }).data;
  if (!data) return null;

  const fabric = normalizeFabric(data);
  const enriched = await enrichFabricsWithColors([fabric]);
  return enriched[0];
};

export const createFabric = async (
  fabricData: Omit<Fabric, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'colors'>,
  imageFile?: File,
): Promise<Fabric> => {
  const form = fabricToFormData(fabricData, imageFile);
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'fabrics',
    method: 'POST',
    body: form,
  });
  const row = extractScottEntity(body);
  if (row) {
    const fabric = normalizeFabric(row);
    const enriched = await enrichFabricsWithColors([fabric]);
    return enriched[0];
  }
  throw new Error('Failed to create fabric: invalid response');
};

export const updateFabric = async (
  id: string,
  updates: Partial<Omit<Fabric, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'colors'>>,
  imageFile?: File,
): Promise<Fabric> => {
  const form: Record<string, unknown> = {};

  if (updates.name !== undefined) form.name = updates.name;
  if (updates.fabric_type !== undefined) form.fabric_type = updates.fabric_type;
  if (updates.gsm !== undefined) form.gsm = String(updates.gsm);
  if (updates.uom !== undefined) form.uom = updates.uom;
  if (updates.price !== undefined) form.price = String(updates.price);
  if (updates.status !== undefined) {
    form.is_deleted = updates.status === 'active' ? 'false' : 'true';
  }
  if (updates.color_ids !== undefined) {
    updates.color_ids.forEach((colorId, index) => {
      form[`color_ids[${index}]`] = colorId;
    });
  }
  if (imageFile) {
    form.image = imageFile;
  }

  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'fabrics',
    method: 'PATCH',
    pathSuffix: id,
    body: form,
  });
  const row = extractScottEntity(body);
  if (row) {
    const fabric = normalizeFabric(row);
    const enriched = await enrichFabricsWithColors([fabric]);
    return enriched[0];
  }
  throw new Error('Failed to update fabric: invalid response');
};

export const deleteFabric = async (id: string): Promise<void> => {
  // Scott API uses PATCH for delete with is_deleted flag
  await callScottDashboard<Record<string, unknown>>({
    resource: 'fabrics',
    method: 'PATCH',
    pathSuffix: id,
    body: {
      is_deleted: 'true',
    },
  });
};
