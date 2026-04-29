import { config } from '@/config/environment';

const STORAGE_KEY = 'scottone:scott-api-target';

/** Dispatched on same window when user toggles (storage event only fires across tabs). */
export const SCOTT_API_RUNTIME_CHANGE_EVENT = 'scottone:scott-api-runtime-change';

export type ScottApiRuntimeTarget = 'staging' | 'production';

function normalizeBase(url: string): string {
  return url.trim().replace(/\/$/, '');
}

export function getStoredScottApiTarget(): ScottApiRuntimeTarget | null {
  if (typeof window === 'undefined') return null;
  const v = localStorage.getItem(STORAGE_KEY);
  if (v === 'staging' || v === 'production') return v;
  return null;
}

/** Persist choice and notify listeners (same tab + useSyncExternalStore). */
export function setStoredScottApiTarget(target: ScottApiRuntimeTarget): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, target);
  window.dispatchEvent(new Event(SCOTT_API_RUNTIME_CHANGE_EVENT));
}

/**
 * Base URL sent to `scott-dashboard-masters` and used for relative Scott image paths.
 * Override via localStorage when the user toggles; otherwise build-time `config.scottApi.baseUrl`.
 */
export function getEffectiveScottApiBaseUrl(): string {
  const stored = typeof window !== 'undefined' ? getStoredScottApiTarget() : null;
  if (stored === 'staging') return normalizeBase(config.scottApi.stagingBaseUrl);
  if (stored === 'production') return normalizeBase(config.scottApi.productionBaseUrl);
  return normalizeBase(config.scottApi.baseUrl || config.scottApi.stagingBaseUrl);
}

export function getResolvedScottApiTarget(): ScottApiRuntimeTarget {
  const eff = getEffectiveScottApiBaseUrl();
  const prod = normalizeBase(config.scottApi.productionBaseUrl);
  return eff === prod ? 'production' : 'staging';
}

export function subscribeScottApiRuntime(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => onChange();
  window.addEventListener(SCOTT_API_RUNTIME_CHANGE_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(SCOTT_API_RUNTIME_CHANGE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}
