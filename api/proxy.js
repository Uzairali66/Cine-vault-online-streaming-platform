/**
 * CineVault Direct Stream Proxy
 *
 * Vercel serverless function that extracts real HLS/MP4 streaming URLs
 * from third-party embed sources' internal APIs.
 *
 * The proxy runs server-side, avoiding CORS issues.
 * If extraction fails for any source, the WatchPage auto-failovers to iframe embeds.
 *
 * Usage:
 *   GET /api/proxy?source=vidsrc&id=550&type=movie
 *   GET /api/proxy?source=embed&id=12345&type=tv&season=1&episode=3
 *
 * Returns:
 *   Success: { streamUrl: "https://...m3u8", type: "hls", name: "vidsrc" }
 *   Failure: { error: true, message: "..." }
 */

// ─── Base64 URL-safe encoding for pipe URLs ───────────────────────────
function encodeUrlParam(url) {
  const b64 = Buffer.from(url).toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ─── Helper: fetch with anti-blocking headers ─────────────────────────
async function fetchWithHeaders(url, referer = null) {
  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    Accept: 'application/json, text/html, */*',
    'Accept-Language': 'en-US,en;q=0.9',
  };
  if (referer) headers['Referer'] = referer;
  const res = await fetch(url, { headers, redirect: 'follow' });
  return res;
}

// ─── Source: vidsrc.to ────────────────────────────────────────────────
// Attempts to extract the direct HLS stream URL from vidsrc.to's internal JSON API.
// Falls back to parsing their embed page for video sources.
async function extractVidsrc(id, type, season, episode) {
  try {
    // Method 1: Try internal JSON API (common pattern)
    const apiPath =
      season && episode
        ? `/ajax/embed/episode/${id}/${season}/${episode}`
        : `/ajax/embed/episode/${id}/sources`;
    const apiUrl = `https://vidsrc.to${apiPath}`;

    const res = await fetchWithHeaders(apiUrl, 'https://vidsrc.to/');
    const text = await res.text();

    // Try parsing as JSON
    try {
      const data = JSON.parse(text);
      if (data?.result?.sources?.length > 0) {
        return data.result.sources[0].file; // HLS URL
      }
      if (data?.result?.url) {
        return data.result.url;
      }
      if (data?.sources?.length > 0) {
        return data.sources[0].file || data.sources[0].src;
      }
      if (data?.url) {
        return data.url;
      }
    } catch (_) {
      // Not JSON, might be HTML — try next method
    }

    // Method 2: Fetch the embed page and look for video source in HTML
    const embedUrl =
      season && episode
        ? `https://vidsrc.to/embed/${type}/${id}/${season}/${episode}`
        : `https://vidsrc.to/embed/${type}/${id}`;

    const pageRes = await fetchWithHeaders(embedUrl, 'https://vidsrc.to/');
    const html = await pageRes.text();

    // Look for hls.js source patterns in script content
    const srcMatch = html.match(/src["']?\s*:\s*["']([^"']+\.m3u8[^"']*)["']/);
    if (srcMatch) return srcMatch[1];

    const fileMatch = html.match(/file["']?\s*:\s*["']([^"']+\.m3u8[^"']*)["']/);
    if (fileMatch) return fileMatch[1];

    const sourceMatch = html.match(/source["']?\s*:\s*["']([^"']+\.m3u8[^"']*)["']/);
    if (sourceMatch) return sourceMatch[1];

    return null;
  } catch (e) {
    return null;
  }
}

// ─── Source: embed.su ─────────────────────────────────────────────────
// Attempts to extract direct stream URL from embed.su's internal data.
async function extractEmbedSu(id, type, season, episode) {
  try {
    const embedUrl =
      season && episode
        ? `https://embed.su/embed/${type}/${id}/${season}/${episode}`
        : `https://embed.su/embed/${type}/${id}`;

    const res = await fetchWithHeaders(embedUrl, 'https://embed.su/');
    const html = await res.text();

    // Look for JSON data in the page (often embedded in a script tag with id="__NEXT_DATA__" or similar)
    const nextDataMatch = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (nextDataMatch) {
      try {
        const data = JSON.parse(nextDataMatch[1]);
        // Navigate through the data structure to find video URLs
        const findUrl = (obj) => {
          if (!obj || typeof obj !== 'object') return null;
          if (typeof obj === 'string' && (obj.endsWith('.m3u8') || obj.endsWith('.mp4'))) return obj;
          for (const key of Object.keys(obj)) {
            const result = findUrl(obj[key]);
            if (result) return result;
          }
          return null;
        };
        const url = findUrl(data);
        if (url) return url;
      } catch (_) { }
    }

    // Look for HLS URLs directly in HTML
    const m3u8Match = html.match(/https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/);
    if (m3u8Match) return m3u8Match[0];

    // Look for source/file patterns in inline scripts
    const srcMatch = html.match(/(?:src|file|source)["']?\s*:\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/);
    if (srcMatch) return srcMatch[1];

    return null;
  } catch (e) {
    return null;
  }
}

// ─── Source: 2embed.cc ────────────────────────────────────────────────
// Follows the redirect from the embed URL to find the actual CDN URL.
async function extract2Embed(id, type, season, episode) {
  try {
    const embedUrl =
      season && episode
        ? `https://www.2embed.cc/embedtv/${id}&s=${season}&e=${episode}`
        : `https://www.2embed.cc/embed/${type}/${id}`;

    // Fetch the page and follow redirects
    const res = await fetchWithHeaders(embedUrl, 'https://www.2embed.cc/');
    const html = await res.text();

    // Look for iframe src or direct video URLs in the page
    const iframeMatch = html.match(/<iframe[^>]*src=["']([^"']+)["']/i);
    if (iframeMatch) {
      // Follow the iframe src
      const iframeRes = await fetchWithHeaders(iframeMatch[1], embedUrl);
      const iframeHtml = await iframeRes.text();
      const videoMatch = iframeHtml.match(/https?:\/\/[^"'\s]+\.(?:m3u8|mp4)[^"'\s]*/);
      if (videoMatch) return videoMatch[0];
    }

    // Look for direct video URLs in the original page
    const directMatch = html.match(/https?:\/\/[^"'\s]+\.(?:m3u8|mp4)[^"'\s]*/);
    if (directMatch) return directMatch[0];

    return null;
  } catch (e) {
    return null;
  }
}

// ─── Source: multiembed.mov ───────────────────────────────────────────
// Follows redirect from their directstream.php endpoint.
async function extractMultiembed(id, type, season, episode) {
  try {
    let embedUrl = `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1`;
    if (season && episode) embedUrl += `&s=${season}&e=${episode}`;

    // Fetch and follow redirects
    const res = await fetchWithHeaders(embedUrl, 'https://multiembed.mov/');
    const html = await res.text();

    // Look for video source URLs
    const m3u8Match = html.match(/https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/);
    if (m3u8Match) return m3u8Match[0];

    const mp4Match = html.match(/https?:\/\/[^"'\s]+\.mp4[^"'\s]*/);
    if (mp4Match) return mp4Match[0];

    // Look for source patterns in scripts
    const srcMatch = html.match(/(?:src|file|source)["']?\s*:\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/);
    if (srcMatch) return srcMatch[1];

    return null;
  } catch (e) {
    return null;
  }
}

// ─── Source: vidbinge.dev ─────────────────────────────────────────────
async function extractVidbinge(id, type, season, episode) {
  try {
    const embedUrl =
      season && episode
        ? `https://vidbinge.dev/embed/${type}/${id}/${season}/${episode}`
        : `https://vidbinge.dev/embed/${type}/${id}`;

    const res = await fetchWithHeaders(embedUrl, 'https://vidbinge.dev/');
    const html = await res.text();

    const m3u8Match = html.match(/https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/);
    if (m3u8Match) return m3u8Match[0];

    const srcMatch = html.match(/(?:src|file|source)["']?\s*:\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/);
    if (srcMatch) return srcMatch[1];

    return null;
  } catch (e) {
    return null;
  }
}

// ─── Source: player.smashy.stream ─────────────────────────────────────
async function extractSmashy(id, type, season, episode) {
  try {
    const embedUrl =
      season && episode
        ? `https://player.smashy.stream/${type}/${id}/${season}/${episode}`
        : `https://player.smashy.stream/${type}/${id}`;

    const res = await fetchWithHeaders(embedUrl, 'https://player.smashy.stream/');
    const html = await res.text();

    const m3u8Match = html.match(/https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/);
    if (m3u8Match) return m3u8Match[0];

    const srcMatch = html.match(/(?:src|file|source)["']?\s*:\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/);
    if (srcMatch) return srcMatch[1];

    return null;
  } catch (e) {
    return null;
  }
}

// ─── Source: moviesapi.club ───────────────────────────────────────────
async function extractMoviesapi(id, type, season, episode) {
  try {
    const embedUrl =
      season && episode
        ? `https://moviesapi.club/${type}/${id}-${season}-${episode}`
        : `https://moviesapi.club/${type}/${id}`;

    const res = await fetchWithHeaders(embedUrl, 'https://moviesapi.club/');
    const html = await res.text();

    const m3u8Match = html.match(/https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/);
    if (m3u8Match) return m3u8Match[0];

    const srcMatch = html.match(/(?:src|file|source)["']?\s*:\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/);
    if (srcMatch) return srcMatch[1];

    return null;
  } catch (e) {
    return null;
  }
}

// ─── Source: vidsrc.xyz ──────────────────────────────────────────────
// Same internal API pattern as vidsrc.to — scrapes JSON endpoint for HLS URLs.
async function extractVidsrcXyz(id, type, season, episode) {
  try {
    // Method 1: Try internal JSON API (same pattern as vidsrc.to)
    const apiPath =
      season && episode
        ? `/ajax/embed/episode/${id}/${season}/${episode}`
        : `/ajax/embed/episode/${id}/sources`;
    const apiUrl = `https://vidsrc.xyz${apiPath}`;

    const res = await fetchWithHeaders(apiUrl, 'https://vidsrc.xyz/');
    const text = await res.text();

    // Try parsing as JSON
    try {
      const data = JSON.parse(text);
      if (data?.result?.sources?.length > 0) {
        return data.result.sources[0].file;
      }
      if (data?.result?.url) {
        return data.result.url;
      }
      if (data?.sources?.length > 0) {
        return data.sources[0].file || data.sources[0].src;
      }
      if (data?.url) {
        return data.url;
      }
    } catch (_) {
      // Not JSON — try next method
    }

    // Method 2: Fetch the embed page and look for HLS sources
    const embedUrl =
      season && episode
        ? `https://vidsrc.xyz/embed/${type}/${id}/${season}/${episode}`
        : `https://vidsrc.xyz/embed/${type}/${id}`;

    const pageRes = await fetchWithHeaders(embedUrl, 'https://vidsrc.xyz/');
    const html = await pageRes.text();

    const srcMatch = html.match(/src["']?\s*:\s*["']([^"']+\.m3u8[^"']*)["']/);
    if (srcMatch) return srcMatch[1];

    const fileMatch = html.match(/file["']?\s*:\s*["']([^"']+\.m3u8[^"']*)["']/);
    if (fileMatch) return fileMatch[1];

    const sourceMatch = html.match(/source["']?\s*:\s*["']([^"']+\.m3u8[^"']*)["']/);
    if (sourceMatch) return sourceMatch[1];

    return null;
  } catch (e) {
    return null;
  }
}

// ─── Source Extraction Registry ───────────────────────────────────────
const EXTRACTORS = {
  vidsrc: extractVidsrc,
  'vidsrc-xyz': extractVidsrcXyz,
  embed: extractEmbedSu,
  '2embed': extract2Embed,
  multiembed: extractMultiembed,
  vidbinge: extractVidbinge,
  smashy: extractSmashy,
  moviesapi: extractMoviesapi,
};

// ─── Main Handler ─────────────────────────────────────────────────────
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const {
    source = 'vidsrc',
    id,
    type = 'movie',
    season,
    episode,
  } = req.query;

  // Validate required params
  if (!id) {
    return res.status(400).json({ error: true, message: 'Missing required parameter: id' });
  }

  const extractor = EXTRACTORS[source];
  if (!extractor) {
    return res.status(400).json({
      error: true,
      message: `Unknown source: "${source}". Available: ${Object.keys(EXTRACTORS).join(', ')}`,
    });
  }

  try {
    const rawStreamUrl = await extractor(id, type, season, episode);

    if (rawStreamUrl) {
      // Convert the raw CDN stream URL into a pipe URL so the browser fetches
      // manifests/segments through our server (solves IP-bound token issues).
      // Only pipe HLS streams — plain MP4 URLs are typically not IP-bound.
      const isHls = rawStreamUrl.includes('.m3u8');
      const pipeUrl = isHls
        ? '/api/stream-pipe?url=' + encodeUrlParam(rawStreamUrl)
        : rawStreamUrl;

      // Stream the extracted URL to the client instantly — no health checks or timeouts.
      return res.json({
        streamUrl: pipeUrl,
        rawStreamUrl: rawStreamUrl,
        type: isHls ? 'hls' : 'mp4',
        name: source,
      });
    }

    // Extraction failed — return error so WatchPage can auto-failover
    return res.json({
      error: true,
      message: `Could not extract stream URL from "${source}" for ${type} ${id}`,
    });
  } catch (e) {
    return res.json({
      error: true,
      message: `Extraction error: ${e.message}`,
    });
  }
}