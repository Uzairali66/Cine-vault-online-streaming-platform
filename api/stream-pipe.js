/**
 * CineVault Stream Routing Pipe
 *
 * Vercel serverless function that proxies HLS manifests and video segments
 * through the server to solve IP-bound token issues. Extracted .m3u8 URLs
 * contain tokens tied to the Vercel server's IP, which would be rejected
 * (403) if loaded directly from the client browser.
 *
 * This pipe:
 *   - Accepts a base64-encoded stream URL as a query param
 *   - Fetches the resource server-side (using Vercel's IP — matches the token)
 *   - For .m3u8 manifests: rewrites segment paths to pipe URLs so all
 *     subsequent requests also go through the server
 *   - For binary segments (.ts/.m4s/.mp4): streams bytes directly
 *
 * Usage:
 *   GET /api/stream-pipe?url={base64url_encoded_stream_url}
 *
 * Returns:
 *   - HLS manifest (.m3u8)   → rewritten manifest with pipe URLs for segments
 *   - Video segment (.ts etc) → raw binary streamed through
 */

// ─── Base64 URL-safe encoding/decoding ──────────────────────────────
function encodeUrlParam(url) {
  const b64 = Buffer.from(url).toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeUrlParam(encoded) {
  let b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4 !== 0) b64 += '=';
  return Buffer.from(b64, 'base64').toString('utf-8');
}

// ─── HLS Manifest Rewriter ──────────────────────────────────────────
// Rewrites segment URLs and EXT-X-KEY URIs in .m3u8 manifests to pipe URLs,
// so the browser fetches everything through our server.
function rewriteManifest(manifestText, baseStreamUrl) {
  const baseUrl = baseStreamUrl.substring(0, baseStreamUrl.lastIndexOf('/') + 1);

  const lines = manifestText.split('\n');
  const rewritten = lines.map((line) => {
    // Handle EXT-X-KEY: URI="..."
    const keyMatch = line.match(
      /^(#EXT-X-KEY:.+URI=")([^"]+)(".*)$/i
    );
    if (keyMatch) {
      const uri = resolveUrl(keyMatch[2], baseUrl);
      return keyMatch[1] + encodeUrlParam(uri) + keyMatch[3];
    }

    // Handle EXT-X-MAP (for fMP4 segments): URI="..."
    const mapMatch = line.match(
      /^(#EXT-X-MAP:.+URI=")([^"]+)(".*)$/i
    );
    if (mapMatch) {
      const uri = resolveUrl(mapMatch[2], baseUrl);
      return mapMatch[1] + '/api/stream-pipe?url=' + encodeUrlParam(uri) + mapMatch[3];
    }

    // Skip other manifest directives (lines starting with #)
    if (line.startsWith('#')) return line;

    // Skip empty lines
    if (!line.trim()) return line;

    // This line is a URL — could be a segment (.ts), variant playlist (.m3u8),
    // or other resource. Rewrite to pipe URL.
    const absoluteUrl = resolveUrl(line.trim(), baseUrl);
    const pipeUrl = '/api/stream-pipe?url=' + encodeUrlParam(absoluteUrl);

    // Media tags like #EXTINF have the URL on the NEXT line, so just rewrite
    // the URL line as-is (already handled by the # check above).
    return pipeUrl;
  });

  return rewritten.join('\n');
}

function resolveUrl(url, baseUrl) {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // Relative URL — resolve against base
  try {
    return new URL(url, baseUrl).href;
  } catch {
    // If resolution fails, try prepending base
    return baseUrl.replace(/\/+$/, '') + '/' + url.replace(/^\/+/, '');
  }
}

function isHlsManifest(url, contentType) {
  if (contentType) {
    const ct = contentType.toLowerCase();
    if (
      ct.includes('mpegurl') ||
      ct.includes('m3u8') ||
      ct.includes('audio/mpegurl')
    ) {
      return true;
    }
  }
  if (url.includes('.m3u8')) return true;
  return false;
}

// ─── Main Handler ───────────────────────────────────────────────────
export default async function handler(req, res) {
  // Set CORS headers — the frontend fetches from same origin but
  // HLS.js/player may trigger cross-origin requests for segments
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only GET allowed for streaming
  if (req.method !== 'GET') {
    return res.status(405).json({ error: true, message: 'Method not allowed' });
  }

  const { url: encodedUrl } = req.query;
  if (!encodedUrl) {
    return res.status(400).json({ error: true, message: 'Missing required parameter: url' });
  }

  let streamUrl;
  try {
    streamUrl = decodeUrlParam(encodedUrl);
  } catch (e) {
    return res.status(400).json({ error: true, message: 'Invalid URL encoding' });
  }

  // Validate URL format
  if (!streamUrl.startsWith('http://') && !streamUrl.startsWith('https://')) {
    return res.status(400).json({ error: true, message: 'Invalid stream URL' });
  }

  try {
    // Dynamically determine domain from stream URL for Referer/Origin headers
    let domain = '';
    try {
      domain = new URL(streamUrl).origin;
    } catch {
      domain = '';
    }

    // Fetch the stream URL server-side (uses Vercel's IP — matches the token)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout for segments

    const response = await fetch(streamUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        Accept: '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        ...(domain ? { Referer: domain, Origin: domain } : {}),
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok && response.status >= 400) {
      // Try to get more info from the response
      let errorText = '';
      try {
        errorText = await response.text();
      } catch {
        errorText = '';
      }
      return res.status(response.status).json({
        error: true,
        status: response.status,
        message: `Upstream returned ${response.status}${errorText ? ': ' + errorText.slice(0, 200) : ''}`,
      });
    }

    const contentType = response.headers.get('Content-Type') || '';
    const contentLength = response.headers.get('Content-Length');

    // ─── HLS Manifest (.m3u8) — rewrite segment URLs ──────────────
    if (isHlsManifest(streamUrl, contentType)) {
      const manifestText = await response.text();
      const rewritten = rewriteManifest(manifestText, streamUrl);

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Content-Length', Buffer.byteLength(rewritten, 'utf-8'));
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.status(200).send(rewritten);
    }

    // ─── Binary Segment (.ts, .m4s, .mp4, etc.) — stream through ──
    // Set the original Content-Type so the browser's video/muxer handles it correctly
    res.setHeader('Content-Type', contentType || 'application/octet-stream');
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }
    res.setHeader('Cache-Control', 'public, max-age=3600'); // segments can be cached

    // Forward the Range header response support (for seeking)
    const rangeHeader = response.headers.get('Content-Range');
    if (rangeHeader) {
      res.setHeader('Content-Range', rangeHeader);
    }
    if (response.status === 206) {
      res.status(206);
    } else {
      res.status(200);
    }

    // Stream binary data using Web API ReadableStream reader
    const readable = response.body;
    if (!readable) {
      // Fallback if no body stream available
      const buffer = await response.arrayBuffer();
      return res.end(Buffer.from(buffer));
    }

    const reader = readable.getReader();

    const pump = () => {
      reader
        .read()
        .then(({ done, value }) => {
          if (done) {
            res.end();
            return;
          }
          res.write(new Uint8Array(value));
          pump();
        })
        .catch((err) => {
          console.error('Stream pipe read error:', err);
          if (!res.writableEnded) {
            res.end();
          }
        });
    };

    pump();
  } catch (e) {
    if (e.name === 'AbortError') {
      return res.status(504).json({
        error: true,
        message: 'Upstream stream timed out after 30 seconds',
      });
    }
    return res.status(502).json({
      error: true,
      message: `Stream pipe fetch error: ${e.message}`,
    });
  }
}