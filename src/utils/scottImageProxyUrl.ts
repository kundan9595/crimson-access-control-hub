import { config } from '@/config/environment';

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
  if (!import.meta.env.PROD) return url;
  if (typeof window === 'undefined') return url;
  if (window.location.protocol !== 'https:') return url;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }

  if (parsed.protocol !== 'http:') return url;

  const hosts = allowedHosts();
  if (!hosts.includes(parsed.hostname)) return url;

  return `/api/scott-image-proxy?url=${encodeURIComponent(parsed.toString())}`;
}
