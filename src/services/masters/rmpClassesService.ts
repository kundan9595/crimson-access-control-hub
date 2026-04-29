import {
  callScottDashboard,
  extractRecords,
  extractScottEntity,
  normalizeId,
} from '@/services/scott/callScottDashboard';
import { normalizeHexCode } from '@/services/masters/rmpColorsService';
import {
  buildScottPaginatedMeta,
  fetchAllScottPages,
  normalizeScottPageParams,
  type ScottPageParams,
  type ScottPaginatedResult,
} from '@/services/scott/scottPagination';

export interface RmpClass {
  id: string;
  name: string;
  position: number;
  is_deleted: boolean;
  rmp_color_id?: string;
  image_1?: string;
  image_1_thumb?: string;
  image_2?: string;
  image_2_thumb?: string;
  image_3?: string;
  image_3_thumb?: string;
  image_4?: string;
  image_4_thumb?: string;
  image_5?: string;
  image_5_thumb?: string;
  status: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  // Populated relations
  rmp_color?: { id: string; name: string; code: string };
}

export interface RmpClassFilter {
  search?: string;
}

// Type for multiple image files
export interface RmpClassImageFiles {
  image_1?: File;
  image_2?: File;
  image_3?: File;
  image_4?: File;
  image_5?: File;
}

function extractEmbeddedRmpColor(
  r: Record<string, unknown>,
): { id: string; name: string; code: string } | undefined {
  const raw = r.rmp_color ?? r.RmpColor ?? r.color;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const o = raw as Record<string, unknown>;
  const idVal = o.id ?? o.rmp_color_id;
  if (idVal == null || idVal === '') return undefined;
  return {
    id: normalizeId(idVal),
    name: String(o.name ?? ''),
    code: normalizeHexCode(o.code),
  };
}

function normalizeRmpClass(r: Record<string, unknown>): RmpClass {
  const status =
    typeof r.status === 'string'
      ? r.status
      : r.is_deleted === true || r.is_deleted === 'true'
        ? 'inactive'
        : 'active';

  const embeddedColor = extractEmbeddedRmpColor(r);
  const rawColorId =
    r.rmp_color_id ?? r.rmpColorId ?? r.color_id ?? (r as { colorId?: unknown }).colorId;
  const rmpColorId =
    rawColorId != null && String(rawColorId) !== ''
      ? String(rawColorId)
      : embeddedColor?.id;

  // Handle both old individual image fields and new "images" array format
  let image1: string | undefined, image1Thumb: string | undefined;
  let image2: string | undefined, image2Thumb: string | undefined;
  let image3: string | undefined, image3Thumb: string | undefined;
  let image4: string | undefined, image4Thumb: string | undefined;
  let image5: string | undefined, image5Thumb: string | undefined;

  // Check for "images" array format - API returns array of URL strings
  const imagesArray = r.images;
  if (Array.isArray(imagesArray)) {
    imagesArray.forEach((img, idx) => {
      // API returns strings directly, not objects
      const url = typeof img === 'string' ? img : img?.url || img?.image_url;
      // For thumb, use same URL (API doesn't provide separate thumbs in array)
      const thumb = url;
      switch (idx) {
        case 0:
          image1 = url; image1Thumb = thumb;
          break;
        case 1:
          image2 = url; image2Thumb = thumb;
          break;
        case 2:
          image3 = url; image3Thumb = thumb;
          break;
        case 3:
          image4 = url; image4Thumb = thumb;
          break;
        case 4:
          image5 = url; image5Thumb = thumb;
          break;
      }
    });
  }

  // Helper to extract image URL from various possible API response formats (legacy support)
  const extractImage = (field: string): string | undefined => {
    const val = r[field];
    if (typeof val === 'string') return val;
    // Handle nested object format: { url: "..." }
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      const obj = val as Record<string, unknown>;
      if (typeof obj.url === 'string') return obj.url;
      if (typeof obj.image_url === 'string') return obj.image_url;
    }
    return undefined;
  };

  // Fallback to individual fields if array didn't provide values
  image1 = image1 ?? extractImage('image_1');
  image1Thumb = image1Thumb ?? extractImage('image_1_thumb') ?? extractImage('image_1_thumbnail');
  image2 = image2 ?? extractImage('image_2');
  image2Thumb = image2Thumb ?? extractImage('image_2_thumb') ?? extractImage('image_2_thumbnail');
  image3 = image3 ?? extractImage('image_3');
  image3Thumb = image3Thumb ?? extractImage('image_3_thumb') ?? extractImage('image_3_thumbnail');
  image4 = image4 ?? extractImage('image_4');
  image4Thumb = image4Thumb ?? extractImage('image_4_thumb') ?? extractImage('image_4_thumbnail');
  image5 = image5 ?? extractImage('image_5');
  image5Thumb = image5Thumb ?? extractImage('image_5_thumb') ?? extractImage('image_5_thumbnail');

  return {
    id: normalizeId(r.id ?? r.rmp_class_id),
    name: String(r.name ?? ''),
    position:
      typeof r.position === 'number'
        ? r.position
        : r.position != null
          ? Number(r.position)
          : 0,
    is_deleted: r.is_deleted === true || r.is_deleted === 'true',
    rmp_color_id: rmpColorId,
    rmp_color: embeddedColor,
    image_1: image1,
    image_1_thumb: image1Thumb,
    image_2: image2,
    image_2_thumb: image2Thumb,
    image_3: image3,
    image_3_thumb: image3Thumb,
    image_4: image4,
    image_4_thumb: image4Thumb,
    image_5: image5,
    image_5_thumb: image5Thumb,
    status,
    created_at:
      typeof r.created_at === 'string' ? r.created_at : new Date().toISOString(),
    updated_at:
      typeof r.updated_at === 'string' ? r.updated_at : new Date().toISOString(),
    created_by: r.created_by ? String(r.created_by) : undefined,
    updated_by: r.updated_by ? String(r.updated_by) : undefined,
  };
}

function rmpClassToFormData(
  rmpClassData: Omit<RmpClass, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'rmp_color'>,
  imageFiles?: RmpClassImageFiles,
): Record<string, unknown> {
  const isActive = rmpClassData.status === 'active';

  const form: Record<string, unknown> = {
    name: rmpClassData.name,
    position: String(rmpClassData.position ?? 0),
    is_deleted: isActive ? 'false' : 'true',
  };

  if (rmpClassData.rmp_color_id) {
    form.rmp_color_id = rmpClassData.rmp_color_id;
  }

  // Handle multiple image files
  if (imageFiles) {
    if (imageFiles.image_1) {
      form.image_1 = imageFiles.image_1;
    }
    if (imageFiles.image_2) {
      form.image_2 = imageFiles.image_2;
    }
    if (imageFiles.image_3) {
      form.image_3 = imageFiles.image_3;
    }
    if (imageFiles.image_4) {
      form.image_4 = imageFiles.image_4;
    }
    if (imageFiles.image_5) {
      form.image_5 = imageFiles.image_5;
    }
  }

  return form;
}

export async function fetchRmpClassesPaginated(
  params?: Partial<ScottPageParams>,
  filters?: RmpClassFilter,
): Promise<ScottPaginatedResult<RmpClass>> {
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
    resource: 'rmp_classes',
    method: 'GET',
    query,
  });
  const records = extractRecords(body);
  const data = records.map((r) => normalizeRmpClass(r));
  return {
    data,
    ...buildScottPaginatedMeta(body, p, data.length),
  };
}

export const fetchRmpClasses = async (): Promise<RmpClass[]> =>
  fetchAllScottPages((pp) => fetchRmpClassesPaginated(pp));

export const getRmpClassById = async (id: string): Promise<RmpClass | null> => {
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'rmp_classes',
    method: 'GET',
    pathSuffix: id,
  });
  const data = (body as { data?: Record<string, unknown> }).data;
  if (!data) return null;
  return normalizeRmpClass(data);
};

export const createRmpClass = async (
  rmpClassData: Omit<RmpClass, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'rmp_color'>,
  imageFiles?: RmpClassImageFiles,
): Promise<RmpClass> => {
  const form = rmpClassToFormData(rmpClassData, imageFiles);
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'rmp_classes',
    method: 'POST',
    body: form,
  });
  const row = extractScottEntity(body);
  if (row) {
    return normalizeRmpClass(row);
  }
  throw new Error('Failed to create RMP Class: invalid response');
};

export const updateRmpClass = async (
  id: string,
  updates: Partial<Omit<RmpClass, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'rmp_color'>>,
  imageFiles?: RmpClassImageFiles,
): Promise<RmpClass> => {
  const form: Record<string, unknown> = {};

  if (updates.name !== undefined) form.name = updates.name;
  if (updates.position !== undefined) form.position = String(updates.position);
  if (updates.status !== undefined) {
    form.is_deleted = updates.status === 'active' ? 'false' : 'true';
  }
  if (updates.rmp_color_id !== undefined) {
    form.rmp_color_id = updates.rmp_color_id || '';
  }

  // Handle multiple image files
  if (imageFiles) {
    if (imageFiles.image_1) {
      form.image_1 = imageFiles.image_1;
    }
    if (imageFiles.image_2) {
      form.image_2 = imageFiles.image_2;
    }
    if (imageFiles.image_3) {
      form.image_3 = imageFiles.image_3;
    }
    if (imageFiles.image_4) {
      form.image_4 = imageFiles.image_4;
    }
    if (imageFiles.image_5) {
      form.image_5 = imageFiles.image_5;
    }
  }

  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'rmp_classes',
    method: 'PATCH',
    pathSuffix: id,
    body: form,
  });
  const row = extractScottEntity(body);
  if (row) {
    return normalizeRmpClass(row);
  }
  throw new Error('Failed to update RMP Class: invalid response');
};

export const deleteRmpClass = async (id: string): Promise<void> => {
  await callScottDashboard<Record<string, unknown>>({
    resource: 'rmp_classes',
    method: 'DELETE',
    pathSuffix: id,
  });
};
