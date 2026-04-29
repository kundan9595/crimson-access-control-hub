import type { VercelRequest, VercelResponse } from '@vercel/node';

const ALLOWED = new Set(['64.227.186.227', 'leaderboard.sagarfab.com']);

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const q = req.query.url;
  const raw = typeof q === 'string' ? q : Array.isArray(q) ? q[0] : undefined;

  if (!raw) {
    res.status(400).send('Missing url');
    return;
  }

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    res.status(400).send('Invalid url');
    return;
  }

  if (!ALLOWED.has(target.hostname)) {
    res.status(403).send('Host not allowed');
    return;
  }
  if (target.protocol !== 'http:' && target.protocol !== 'https:') {
    res.status(400).send('Invalid protocol');
    return;
  }

  const upstream = await fetch(target.toString(), {
    headers: { Accept: 'image/*,*/*;q=0.8' },
    redirect: 'follow',
  });

  if (!upstream.ok) {
    res.status(upstream.status === 404 ? 404 : 502).send('Upstream error');
    return;
  }

  const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
  const buf = Buffer.from(await upstream.arrayBuffer());

  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
  res.status(200).send(buf);
}
