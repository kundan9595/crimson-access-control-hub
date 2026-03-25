import { Color } from './types';
import {
  callScottDashboard,
  extractRecords,
  normalizeId,
} from '@/services/scott/callScottDashboard';

function normalizeColor(r: Record<string, unknown>): Color {
  const status =
    typeof r.status === 'string'
      ? r.status
      : r.is_deleted === true || r.is_deleted === 'true'
        ? 'inactive'
        : 'active';
  return {
    id: normalizeId(r.id),
    name: String(r.name ?? ''),
    hex_code: String(r.hex_code ?? ''),
    status,
    created_at:
      typeof r.created_at === 'string' ? r.created_at : new Date().toISOString(),
    updated_at:
      typeof r.updated_at === 'string' ? r.updated_at : new Date().toISOString(),
    created_by: r.created_by ? String(r.created_by) : undefined,
    updated_by: r.updated_by ? String(r.updated_by) : undefined,
  };
}

function colorFormToBody(
  data: Omit<Color, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>,
): Record<string, unknown> {
  const isActive = data.status === 'active';
  return {
    name: data.name,
    hex_code: data.hex_code,
    status: isActive ? 'active' : 'inactive',
    is_deleted: isActive ? 'false' : 'true',
  };
}

export const fetchColors = async (): Promise<Color[]> => {
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'colors',
    method: 'GET',
    query: {
      items: 500,
      page: 1,
      is_deleted: false,
    },
  });
  return extractRecords(body).map((r) => normalizeColor(r));
};

export const createColor = async (
  colorData: Omit<Color, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>,
): Promise<Color> => {
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'colors',
    method: 'POST',
    body: colorFormToBody(colorData),
  });
  const list = extractRecords(body);
  const row = list[0] ?? (body as Record<string, unknown>);
  if (row && typeof row === 'object' && 'id' in row) {
    return normalizeColor(row as Record<string, unknown>);
  }
  const data = (body as { data?: Record<string, unknown> }).data;
  if (data && typeof data === 'object' && 'id' in data) {
    return normalizeColor(data as Record<string, unknown>);
  }
  throw new Error('Unexpected create color response');
};

export const updateColor = async (
  id: string,
  updates: Partial<Color>,
): Promise<Color> => {
  const all = await fetchColors();
  const current = all.find((c) => c.id === id);
  if (!current) throw new Error('Color not found');
  const merged = { ...current, ...updates };
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'colors',
    method: 'PATCH',
    pathSuffix: id,
    body: colorFormToBody({
      name: merged.name,
      hex_code: merged.hex_code,
      status: merged.status,
    }),
  });
  const list = extractRecords(body);
  const row = list[0] ?? (body as Record<string, unknown>);
  if (row && typeof row === 'object' && 'id' in row) {
    return normalizeColor(row as Record<string, unknown>);
  }
  const data = (body as { data?: Record<string, unknown> }).data;
  if (data && typeof data === 'object') {
    return normalizeColor(data as Record<string, unknown>);
  }
  return fetchColors().then((rows) => {
    const found = rows.find((c) => c.id === id);
    if (found) return found;
    throw new Error('Unexpected update color response');
  });
};

export const deleteColor = async (id: string): Promise<void> => {
  await callScottDashboard({
    resource: 'colors',
    method: 'DELETE',
    pathSuffix: id,
  });
};
