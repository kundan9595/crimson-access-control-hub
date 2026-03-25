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
  | 'settings';

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

  return {
    upstreamStatus: data.upstreamStatus ?? 200,
    body: data.body as T,
  };
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
