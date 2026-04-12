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
  image_1_thumbnail?: string;
  image_2?: string;
  image_2_thumbnail?: string;
  image_3?: string;
  image_3_thumbnail?: string;
  image_4?: string;
  image_4_thumbnail?: string;
  image_5?: string;
  image_5_thumbnail?: string;
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
    image_1: r.image_1 ? String(r.image_1) : undefined,
    image_1_thumbnail: r.image_1_thumbnail ? String(r.image_1_thumbnail) : undefined,
    image_2: r.image_2 ? String(r.image_2) : undefined,
    image_2_thumbnail: r.image_2_thumbnail ? String(r.image_2_thumbnail) : undefined,
    image_3: r.image_3 ? String(r.image_3) : undefined,
    image_3_thumbnail: r.image_3_thumbnail ? String(r.image_3_thumbnail) : undefined,
    image_4: r.image_4 ? String(r.image_4) : undefined,
    image_4_thumbnail: r.image_4_thumbnail ? String(r.image_4_thumbnail) : undefined,
    image_5: r.image_5 ? String(r.image_5) : undefined,
    image_5_thumbnail: r.image_5_thumbnail ? String(r.image_5_thumbnail) : undefined,
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
  const data = extractRecords(body).map((r) => normalizeRmpClass(r));
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
