import { config } from '@/config/environment';
import { getEffectiveScottApiBaseUrl } from '@/config/scottApiRuntime';

const allowedHosts = (): string[] => {
  try {
    const s = new URL(config.scottApi.stagingBaseUrl).hostname;
    const p = new URL(config.scottApi.productionBaseUrl).hostname;
    return [...new Set([s, p])];
  } catch {
    return ['64.227.186.227', 'leaderboard.sagarfab.com'];
  }
};

/**
 * Scott staging serves images over HTTP only. On https:// (e.g. Vercel), browsers block
 * mixed-content <img src="http://...">. Rewrite to same-origin proxy in production.
 */
export function proxifyScottImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  if (/^(data|blob):/i.test(trimmed)) return trimmed;

  let absoluteUrl: string;
  try {
    absoluteUrl = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : new URL(trimmed.startsWith('/') ? trimmed : `/${trimmed}`, getEffectiveScottApiBaseUrl()).toString();
  } catch {
    return trimmed;
  }

  if (!import.meta.env.PROD) return absoluteUrl;
  if (typeof window === 'undefined') return absoluteUrl;
  if (window.location.protocol !== 'https:') return absoluteUrl;

  let parsed: URL;
  try {
    parsed = new URL(absoluteUrl);
  } catch {
    return absoluteUrl;
  }

  if (parsed.protocol !== 'http:') return absoluteUrl;

  const hosts = allowedHosts();
  if (!hosts.includes(parsed.hostname)) return absoluteUrl;

  return `/api/scott-image-proxy?url=${encodeURIComponent(parsed.toString())}`;
}
