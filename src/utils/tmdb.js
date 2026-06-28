/**
 * CineVault — TMDB client helper
 *
 * All TMDB calls now route through our serverless proxy (/api/tmdb-proxy) so
 * the API key is NEVER shipped to the browser. This module is the drop-in
 * replacement for the old `fetch(API_BASE_URL + path, API_OPTIONS)` pattern.
 *
 * Bonus: a small in-memory + sessionStorage cache cuts redundant calls
 * (e.g. the homepage fires ~12 per load) → faster UX + lower TMDB quota use.
 */

const PROXY_URL = '/api/tmdb-proxy';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// In-memory cache (survives client-side route navigations within a session).
const memCache = new Map();

/**
 * Build a query string from a params object, ignoring null/undefined values.
 * @param {Record<string, string|number|undefined|null>} params
 * @returns {string}
 */
function buildQuery(params = {}) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      sp.append(key, String(value));
    }
  });
  return sp.toString();
}

/**
 * Fetch JSON from TMDB via the serverless proxy.
 *
 * @param {string} path  — TMDB path, e.g. "/discover/movie" (leading slash optional)
 * @param {Record<string, string|number>} [params] — query params forwarded to TMDB
 * @param {{ signal?: AbortSignal, cache?: boolean }} [opts]
 * @returns {Promise<any>} parsed JSON
 */
export async function tmdbFetch(path, params = {}, opts = {}) {
  const useCache = opts.cache !== false;
  const query = buildQuery(params);

  // Cache key combines path + sorted query so we hit cache on identical calls.
  const cacheKey = `${path}?${query}`;

  if (useCache) {
    const hit = memCache.get(cacheKey);
    if (hit && Date.now() - hit.t < CACHE_TTL) {
      return hit.data;
    }
    // sessionStorage survives reloads but not new tabs — good enough for nav.
    try {
      const ssKey = `tmdb:${cacheKey}`;
      const ssRaw = sessionStorage.getItem(ssKey);
      if (ssRaw) {
        const ssHit = JSON.parse(ssRaw);
        if (Date.now() - ssHit.t < CACHE_TTL) {
          memCache.set(cacheKey, ssHit);
          return ssHit.data;
        }
      }
    } catch {
      // sessionStorage may be unavailable (private mode) — ignore.
    }
  }

  const url = `${PROXY_URL}?path=${encodeURIComponent(path)}${query ? `&${query}` : ''}`;
  const res = await fetch(url, { signal: opts.signal });

  if (!res.ok) {
    throw new Error(`TMDB proxy error ${res.status} for ${path}`);
  }

  const data = await res.json();

  if (useCache) {
    const entry = { data, t: Date.now() };
    memCache.set(cacheKey, entry);
    try {
      sessionStorage.setItem(`tmdb:${cacheKey}`, JSON.stringify(entry));
    } catch {
      // quota / private mode — ignore.
    }
  }

  return data;
}

/**
 * Convenience wrapper that returns a native Response-like object for callers
 * that still expect the old `fetch(...).then(r => r.json())` shape. Prefer
 * tmdbFetch() for new code; this exists to minimize the diff for legacy calls.
 *
 * @returns {Promise<{ok: boolean, status: number, json: () => Promise<any>}>}
 */
export async function tmdbRequest(path, params = {}, opts = {}) {
  try {
    const data = await tmdbFetch(path, params, opts);
    return { ok: true, status: 200, json: async () => data };
  } catch (e) {
    return { ok: false, status: 500, json: async () => ({ results: [], error: e.message }) };
  }
}
