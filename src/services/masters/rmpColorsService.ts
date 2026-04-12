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

export interface RmpColor {
  id: string;
  name: string;
  code: string; // hex format e.g., #2321 or #FF5733
  is_deleted: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

// Helper function to validate and normalize hex color code
function normalizeHexCode(code: unknown): string {
  if (typeof code !== 'string') {
    return '#000000'; // default fallback
  }

  // Remove whitespace
  let hex = code.trim();

  // Remove # if present for validation
  const hexWithoutHash = hex.startsWith('#') ? hex.slice(1) : hex;

  // Validate hex format (3, 4, 6, or 8 characters)
  const isValidHex = /^[0-9A-Fa-f]{3}([0-9A-Fa-f]{1})?$|^[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(hexWithoutHash);

  if (!isValidHex) {
    return '#000000'; // default fallback for invalid codes
  }

  // Ensure it starts with #
  if (!hex.startsWith('#')) {
    hex = '#' + hex;
  }

  // Normalize to uppercase
  return hex.toUpperCase();
}

function normalizeRmpColor(r: Record<string, unknown>): RmpColor {
  const status =
    typeof r.status === 'string'
      ? r.status
      : r.is_deleted === true || r.is_deleted === 'true'
        ? 'inactive'
        : 'active';

  return {
    id: normalizeId(r.id ?? r.rmp_color_id),
    name: String(r.name ?? ''),
    code: normalizeHexCode(r.code),
    is_deleted: r.is_deleted === true || r.is_deleted === 'true',
    status,
    created_at:
      typeof r.created_at === 'string' ? r.created_at : new Date().toISOString(),
    updated_at:
      typeof r.updated_at === 'string' ? r.updated_at : new Date().toISOString(),
    created_by: r.created_by ? String(r.created_by) : undefined,
    updated_by: r.updated_by ? String(r.updated_by) : undefined,
  };
}

function rmpColorToFormData(
  rmpColorData: Omit<RmpColor, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>,
): Record<string, unknown> {
  const isActive = rmpColorData.status === 'active';

  // Validate and normalize the hex code before sending
  const normalizedCode = normalizeHexCode(rmpColorData.code);

  return {
    name: rmpColorData.name,
    code: normalizedCode,
    is_deleted: isActive ? 'false' : 'true',
  };
}

export async function fetchRmpColorsPaginated(
  params?: Partial<ScottPageParams>,
): Promise<ScottPaginatedResult<RmpColor>> {
  const p = normalizeScottPageParams(params);
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'rmp_colors',
    method: 'GET',
    query: {
      items: p.items,
      page: p.page,
      is_deleted: false,
    },
  });
  const data = extractRecords(body).map((r) => normalizeRmpColor(r));
  return {
    data,
    ...buildScottPaginatedMeta(body, p, data.length),
  };
}

export const fetchRmpColors = async (): Promise<RmpColor[]> =>
  fetchAllScottPages((pp) => fetchRmpColorsPaginated(pp));

export const getRmpColorById = async (id: string): Promise<RmpColor | null> => {
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'rmp_colors',
    method: 'GET',
    pathSuffix: id,
  });
  const data = (body as { data?: Record<string, unknown> }).data;
  if (!data) return null;
  return normalizeRmpColor(data);
};

export const createRmpColor = async (
  rmpColorData: Omit<RmpColor, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>,
): Promise<RmpColor> => {
  const form = rmpColorToFormData(rmpColorData);
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'rmp_colors',
    method: 'POST',
    body: form,
  });
  const row = extractScottEntity(body);
  if (row) {
    return normalizeRmpColor(row);
  }
  throw new Error('Failed to create RMP Color: invalid response');
};

export const updateRmpColor = async (
  id: string,
  updates: Partial<Omit<RmpColor, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>>,
): Promise<RmpColor> => {
  const form: Record<string, unknown> = {};

  if (updates.name !== undefined) form.name = updates.name;
  if (updates.code !== undefined) {
    form.code = normalizeHexCode(updates.code);
  }
  if (updates.status !== undefined) {
    form.is_deleted = updates.status === 'active' ? 'false' : 'true';
  }

  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'rmp_colors',
    method: 'PATCH',
    pathSuffix: id,
    body: form,
  });
  const row = extractScottEntity(body);
  if (row) {
    return normalizeRmpColor(row);
  }
  throw new Error('Failed to update RMP Color: invalid response');
};

export const deleteRmpColor = async (id: string): Promise<void> => {
  await callScottDashboard<Record<string, unknown>>({
    resource: 'rmp_colors',
    method: 'DELETE',
    pathSuffix: id,
  });
};
