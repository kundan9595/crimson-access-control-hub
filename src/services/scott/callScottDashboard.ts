import { supabase } from '@/integrations/supabase/client';
import { config } from '@/config/environment';

export type ScottResource =
  | 'colors'
  | 'profit_margins'
  | 'authorized_brands'
  | 'asset_infos'
  | 'size_types'
  | 'base_product_types'
  | 'promotions'
  | 'settings'
  | 'sc_sizes'
  | 'parts'
  | 'add_ons'
  | 'fabrics'
  | 'base_products'
  | 'promotional_banners'
  | 'base_product_asset_infos'
  | 'rmp_colors'
  | 'rmp_sizes'
  | 'rmp_brands'
  | 'rmp_classes'
  | 'rmp_skus'
  | 'rmp_categories'
  | 'rmp_prices'
  | 'rmp_price_types';

export interface ScottFilePayload {
  __base64File: true;
  data: string;
  filename: string;
}

export interface ScottProxyPayload {
  resource: ScottResource;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  pathSuffix?: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: Record<string, unknown> | null;
  settingsAction?: 'airtable_sync';
  /**
   * Optional explicit Scott API base URL.
   * Useful for switching staging vs production without redeploying the edge function.
   * Must be allowed by the edge function allowlist.
   */
  baseUrl?: string;
}

export interface ScottEdgeSuccess<T = unknown> {
  ok: true;
  upstreamStatus: number;
  body: T;
}

export interface ScottEdgeFailure {
  ok: false;
  upstreamStatus: number;
  body: unknown;
}

type EdgeEnvelope = {
  ok?: boolean;
  upstreamStatus?: number;
  body?: unknown;
  error?: string;
};

/**
 * Calls the scott-dashboard-masters Edge Function (never the Scott API directly).
 */
export async function callScottDashboard<T = unknown>(
  payload: ScottProxyPayload,
): Promise<{ upstreamStatus: number; body: T }> {
  const payloadWithBaseUrl: ScottProxyPayload = {
    baseUrl: config.scottApi.baseUrl,
    ...payload,
  };

  const { data, error } = await supabase.functions.invoke<EdgeEnvelope>('scott-dashboard-masters', {
    body: payloadWithBaseUrl,
  });

  if (error) {
    throw new Error(error.message || 'Edge function request failed');
  }

  if (!data || typeof data !== 'object') {
    throw new Error('Invalid response from scott-dashboard-masters');
  }

  if ('error' in data && data.error) {
    throw new Error(String(data.error));
  }

  if (data.ok === false) {
    const b = data.body as Record<string, unknown> | null | undefined;
    const msg =
      b && typeof b === 'object' && 'message' in b
        ? String((b as { message: unknown }).message)
        : `Scott API error (${data.upstreamStatus ?? 'unknown'})`;
    throw new Error(msg);
  }

  // Upstream may return HTTP 2xx with { success: false, message, ... } (validation errors).
  throwIfScottApplicationErrorBody(data.body);

  return {
    upstreamStatus: data.upstreamStatus ?? 200,
    body: data.body as T,
  };
}

function applicationFailureFromBody(o: Record<string, unknown>): string | null {
  const success = o.success;
  if (success !== false && success !== 'false') {
    return null;
  }
  if (typeof o.message === 'string' && o.message.trim() !== '') {
    return o.message;
  }
  if (typeof o.error === 'string' && o.error.trim() !== '') {
    return o.error;
  }
  const status = o.status_code;
  return typeof status === 'number' ? `Scott API error (${status})` : 'Request failed';
}

/**
 * Scott sometimes returns HTTP 200 with JSON where `success` is false (validation / business rules).
 * The edge proxy sets `ok: true` when the upstream status is 2xx, so we must inspect the body.
 */
function throwIfScottApplicationErrorBody(body: unknown): void {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return;
  }
  const o = body as Record<string, unknown>;
  const nested = o.data;
  const msgTop = applicationFailureFromBody(o);
  if (msgTop) {
    throw new Error(msgTop);
  }
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    const msgNested = applicationFailureFromBody(nested as Record<string, unknown>);
    if (msgNested) {
      throw new Error(msgNested);
    }
  }
}

/** Extract list records from common Scott / Rails response shapes */
export function extractRecords(raw: unknown): Record<string, unknown>[] {
  if (!raw || typeof raw !== 'object') return [];
  const o = raw as Record<string, unknown>;

  if (Array.isArray(o)) {
    return o as Record<string, unknown>[];
  }

  // Handle body.data.{resource}.data pattern from dashboard API
  const innerData = o.data;
  if (innerData && typeof innerData === 'object' && !Array.isArray(innerData)) {
    const dataObj = innerData as Record<string, unknown>;
    // Check for nested resource wrapper like {colors: {data: [...]}} or {profit_margins: [...]}
    for (const key of Object.keys(dataObj)) {
      const nested = dataObj[key];
      if (nested && typeof nested === 'object') {
        // Dashboard API: {colors: {data: [...], pagy: {...}}}
        if (!Array.isArray(nested)) {
          const nestedObj = nested as Record<string, unknown>;
          if (Array.isArray(nestedObj.data)) {
            return nestedObj.data as Record<string, unknown>[];
          }
        }
        // V1 API: {profit_margins: [...]} (direct array)
        if (Array.isArray(nested)) {
          return nested as Record<string, unknown>[];
        }
      }
    }
  }

  if (Array.isArray(o.data)) {
    return o.data as Record<string, unknown>[];
  }

  const inner = o.data;
  if (inner && typeof inner === 'object') {
    const d = inner as Record<string, unknown>;
    if (Array.isArray(d.data)) return d.data as Record<string, unknown>[];
    if (Array.isArray(d.items)) return d.items as Record<string, unknown>[];
    if (Array.isArray(d.records)) return d.records as Record<string, unknown>[];
  }

  if (Array.isArray(o.records)) {
    return o.records as Record<string, unknown>[];
  }

  return [];
}

/**
 * Alternate primary-key field names returned by some Scott dashboard endpoints
 * (e.g. authorized_brand_id instead of id on create).
 */
const SCOTT_ALT_ID_KEYS = [
  'authorized_brand_id',
  'profit_margin_id',
  'color_id',
  'fabric_id',
  'part_id',
  'add_on_id',
  'base_product_id',
  'asset_info_id',
  'promotion_id',
  'size_type_id',
  'sc_size_id',
  'base_product_type_id',
  'base_product_asset_info_id',
  'promotional_banner_id',
  'rmp_color_id',
  'rmp_size_id',
  'rmp_brand_id',
  'rmp_class_id',
  'rmp_sku_id',
  'rmp_category_id',
  'rmp_price_id',
  'rmp_price_type_id',
] as const;

function firstAltId(r: Record<string, unknown>): unknown {
  for (const k of SCOTT_ALT_ID_KEYS) {
    const v = r[k as string];
    if (v !== undefined && v !== null && String(v).trim() !== '') {
      return v;
    }
  }
  return undefined;
}

function hasUsableIdValue(v: unknown): boolean {
  return v !== undefined && v !== null && String(v).trim() !== '';
}

/** True if JSON looks like a Scott record (id or resource-specific *_id). */
function isScottRecordShape(v: unknown): v is Record<string, unknown> {
  if (v === null || typeof v !== 'object' || Array.isArray(v)) return false;
  const r = v as Record<string, unknown>;
  if (hasUsableIdValue(r.id)) return true;
  return firstAltId(r) !== undefined;
}

/** Normalize entity payloads so normalizers can keep using `id`. */
function withCanonicalPrimaryKey(row: Record<string, unknown>): Record<string, unknown> {
  if (hasUsableIdValue(row.id)) {
    return row;
  }
  const alt = firstAltId(row);
  if (alt !== undefined) {
    return { ...row, id: alt };
  }
  return row;
}

function deepExtractScottEntity(body: unknown, depth = 0): Record<string, unknown> | null {
  if (depth > 14 || body === null || typeof body !== 'object') {
    return null;
  }
  if (Array.isArray(body)) {
    for (const item of body) {
      const found = deepExtractScottEntity(item, depth + 1);
      if (found) {
        return found;
      }
    }
    return null;
  }
  const o = body as Record<string, unknown>;
  if (isScottRecordShape(o)) {
    return withCanonicalPrimaryKey(o);
  }
  for (const v of Object.values(o)) {
    if (v === null || typeof v !== 'object') {
      continue;
    }
    const found = deepExtractScottEntity(v, depth + 1);
    if (found) {
      return found;
    }
  }
  return null;
}

/**
 * Extract one entity from Scott dashboard / v1 create, update, or show responses.
 * Handles list wrappers ({ data: { brands: { data: [...] } } }), flat { data: { id } },
 * nested resource keys ({ data: { authorized_brand: { … } } }), alternate PK fields,
 * and deeply nested success payloads.
 */
export function extractScottEntity(body: unknown): Record<string, unknown> | null {
  if (body === null || body === undefined) {
    return null;
  }

  const fromList = extractRecords(body);
  if (fromList.length > 0 && isScottRecordShape(fromList[0])) {
    return withCanonicalPrimaryKey(fromList[0]!);
  }

  if (typeof body !== 'object' || Array.isArray(body)) {
    return isScottRecordShape(body)
      ? withCanonicalPrimaryKey(body as Record<string, unknown>)
      : null;
  }

  const o = body as Record<string, unknown>;

  if (isScottRecordShape(o)) {
    return withCanonicalPrimaryKey(o);
  }

  const data = o.data;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const d = data as Record<string, unknown>;
    if (isScottRecordShape(d)) {
      return withCanonicalPrimaryKey(d);
    }
    for (const v of Object.values(d)) {
      if (isScottRecordShape(v)) {
        return withCanonicalPrimaryKey(v as Record<string, unknown>);
      }
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        const nested = v as Record<string, unknown>;
        if (
          Array.isArray(nested.data) &&
          nested.data[0] &&
          isScottRecordShape(nested.data[0])
        ) {
          return withCanonicalPrimaryKey(nested.data[0] as Record<string, unknown>);
        }
        const fromNested = deepExtractScottEntity(v, 0);
        if (fromNested) {
          return fromNested;
        }
      }
    }
  }

  return deepExtractScottEntity(body, 0);
}

export function normalizeId(id: unknown): string {
  if (id === undefined || id === null) return '';
  return String(id);
}

/** Fetch remote image URL (e.g. Supabase public URL) and build a file payload for the edge function */
export async function urlToScottFile(
  url: string,
  filename = 'upload.png',
): Promise<ScottFilePayload> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Could not load image for upload');
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return {
    __base64File: true,
    data: btoa(binary),
    filename,
  };
}
