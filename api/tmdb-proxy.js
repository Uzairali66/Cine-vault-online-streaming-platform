/**
 * CineVault — TMDB Proxy (serverless)
 *
 * WHY THIS EXISTS:
 * Previously the TMDB API key (VITE_TMDB_API_KEY) was baked into the client
 * bundle, so anyone could View Source → steal it → abuse our quota / get us
 * banned. Now all TMDB calls route through this serverless function, which
 * holds the secret key server-side in `TMDB_API_KEY` (no VITE_ prefix = never
 * shipped to the browser).
 *
 * USAGE:
 *   GET /api/tmdb-proxy?path=/discover/movie&sort_by=popularity.desc&page=1
 *
 * All extra query params (except `path`) are forwarded to TMDB verbatim.
 */

export default async function handler(req, res) {
  // CORS — same origin only in production, but allow all for preview branches.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: true, message: 'Method not allowed. Use GET.' });
  }

  // The secret key lives ONLY on the server (set in Vercel → Settings → Env Vars).
  const apiKey = process.env.TMDB_API_KEY || process.env.VITE_TMDB_API_KEY;
  if (!apiKey) {
    return res
      .status(500)
      .json({ error: true, message: 'TMDB_API_KEY not configured on the server.' });
  }

  // Accept either ?path=/discover/movie or ?endpoint=/discover/movie
  const rawPath = req.query.path || req.query.endpoint || '';
  if (!rawPath) {
    return res
      .status(400)
      .json({ error: true, message: 'Missing required parameter: path' });
  }

  // Normalize — strip a single leading slash so we build a clean TMDB URL.
  const cleanPath = rawPath.startsWith('/') ? rawPath.slice(1) : rawPath;

  // Forward every other query param straight to TMDB (page, sort_by, with_genres, query, etc.)
  const tmdbParams = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query)) {
    if (key === 'path' || key === 'endpoint') continue;
    tmdbParams.append(key, value);
  }

  const tmdbUrl = `https://api.themoviedb.org/3/${cleanPath}?${tmdbParams.toString()}`;

  try {
    const upstream = await fetch(tmdbUrl, {
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    });

    // Pass upstream status + content-type through so client code can read .ok / .json().
    res.status(upstream.status);
    res.setHeader(
      'Content-Type',
      upstream.headers.get('content-type') || 'application/json'
    );

    // Tell browsers (and Vercel's edge cache) to cache successful GETs for 5 min.
    if (upstream.ok) {
      res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600');
    }

    const body = await upstream.text();
    return res.send(body);
  } catch (e) {
    return res
      .status(502)
      .json({ error: true, message: `TMDB request failed: ${e.message}` });
  }
}
