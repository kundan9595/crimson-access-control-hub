import {
  callScottDashboard,
  extractRecords,
  normalizeId,
  urlToScottFile,
  type ScottFilePayload,
} from '@/services/scott/callScottDashboard';

export interface AppAsset {
  id: string;
  name: string;
  dx: number;
  dy: number;
  mirror_dx: number;
  asset_height_resp_to_box: number;
  asset?: string;
  add_on_id?: string;
  add_on?: {
    id: string;
    name: string;
  };
  status: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

function num(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  if (typeof v === 'string' && v !== '') return parseFloat(v) || fallback;
  return fallback;
}

function normalizeAsset(r: Record<string, unknown>): AppAsset {
  const status =
    typeof r.status === 'string'
      ? r.status
      : r.is_deleted === true || r.is_deleted === 'true'
        ? 'inactive'
        : 'active';

  const assetUrl =
    typeof r.asset === 'string'
      ? r.asset
      : r.asset && typeof r.asset === 'object' && r.asset !== null && 'url' in (r.asset as object)
        ? String((r.asset as { url?: unknown }).url)
        : undefined;

  // Upstream sometimes returns camelCase keys even if request accepts snake_case
  const dxRaw = r.dx ?? (r as { dX?: unknown }).dX;
  const dyRaw = r.dy ?? (r as { dY?: unknown }).dY;
  const mirrorDxRaw = r.mirror_dx ?? (r as { mirrorDX?: unknown }).mirrorDX;
  const heightRaw =
    r.asset_height_resp_to_box ??
    (r as { assetHeightRespToBox?: unknown }).assetHeightRespToBox;

  return {
    id: normalizeId(r.id),
    name: String(r.name ?? ''),
    dx: num(dxRaw),
    dy: num(dyRaw),
    mirror_dx: num(mirrorDxRaw),
    asset_height_resp_to_box: num(heightRaw),
    asset: assetUrl,
    add_on_id: r.add_on_id != null ? String(r.add_on_id) : undefined,
    status,
    created_at:
      typeof r.created_at === 'string' ? r.created_at : new Date().toISOString(),
    updated_at:
      typeof r.updated_at === 'string' ? r.updated_at : new Date().toISOString(),
  };
}

async function toForm(
  asset: Omit<
    AppAsset,
    'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'add_on'
  > & { assetFile?: ScottFilePayload | null },
): Promise<Record<string, unknown>> {
  const isActive = asset.status === 'active';
  const body: Record<string, unknown> = {
    name: asset.name,
    dx: String(asset.dx),
    dy: String(asset.dy),
    mirror_dx: String(asset.mirror_dx),
    asset_height_resp_to_box: String(asset.asset_height_resp_to_box),
    add_on_id: asset.add_on_id ?? '',
    status: isActive ? 'active' : 'inactive',
    is_deleted: isActive ? 'false' : 'true',
  };
  if (asset.assetFile) {
    body.asset = asset.assetFile;
  } else if (
    asset.asset &&
    (asset.asset.startsWith('http://') || asset.asset.startsWith('https://'))
  ) {
    try {
      body.asset = await urlToScottFile(asset.asset, 'asset.png');
    } catch {
      /* optional */
    }
  }
  return body;
}

export const getAppAssets = async (): Promise<AppAsset[]> => {
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'asset_infos',
    method: 'GET',
    query: {
      items: 500,
      page: 1,
      is_deleted: false,
    },
  });
  return extractRecords(body).map((r) => normalizeAsset(r));
};

export const createAppAsset = async (
  asset: Omit<
    AppAsset,
    'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'add_on'
  >,
): Promise<AppAsset> => {
  const form = await toForm(asset);
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'asset_infos',
    method: 'POST',
    body: form,
  });
  const list = extractRecords(body);
  const row = list[0] ?? ((body as { data?: Record<string, unknown> }).data as Record<string, unknown>);
  if (row && typeof row === 'object' && 'id' in row) {
    return normalizeAsset(row as Record<string, unknown>);
  }
  throw new Error('Unexpected create app asset response');
};

export const updateAppAsset = async (
  id: string,
  updates: Partial<Omit<AppAsset, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'add_on'>>,
): Promise<AppAsset> => {
  const all = await getAppAssets();
  const cur = all.find((a) => a.id === id);
  if (!cur) throw new Error('App asset not found');
  const merged = { ...cur, ...updates };
  const form = await toForm(merged);
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'asset_infos',
    method: 'PATCH',
    pathSuffix: id,
    body: form,
  });
  const list = extractRecords(body);
  const row = list[0] ?? ((body as { data?: Record<string, unknown> }).data as Record<string, unknown>);
  if (row && typeof row === 'object' && 'id' in row) {
    return normalizeAsset(row as Record<string, unknown>);
  }
  const again = await getAppAssets().then((rows) => rows.find((a) => a.id === id));
  if (again) return again;
  throw new Error('Unexpected update app asset response');
};

export const deleteAppAsset = async (id: string): Promise<void> => {
  await callScottDashboard({
    resource: 'asset_infos',
    method: 'DELETE',
    pathSuffix: id,
  });
};
