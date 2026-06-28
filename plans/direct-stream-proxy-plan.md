# Plan: Direct Streaming URLs via Vercel API Proxy

## Goal

Make the DirectPlayer (custom HTML5 video player) play actual movie/TV show content by extracting direct HLS/MP4 streaming URLs from embed sources through a serverless API proxy.

## Architecture

```
User clicks "Watch"
       │
       ▼
WatchPage loads content
       │
       ▼
getSource(0, tmdbId, mediaType) → returns { type: 'direct', url: '/api/proxy?vidsrc&id=123&type=movie' }
       │
       ▼
DirectPlayer renders with source URL pointing to OUR API endpoint
       │
       ▼
/api/proxy (Vercel Serverless Function)
       │
       ├── Calls vidsrc.to internal JSON API
       │   └── Returns { streamUrl: "https://...m3u8", type: "hls" }
       │
       ▼
DirectPlayer receives the real HLS/MP4 URL
       │
       ▼
DirectPlayer uses hls.js to play the stream
```

## Current State

- **The problem**: Source index 0 (Direct MP4) has a hardcoded demo video URL that plays the same 1:41 clip for all movies/TV shows
- **What exists already**:
  - [`src/components/DirectPlayer.jsx`](src/components/DirectPlayer.jsx) — custom HTML5 player with full controls (play/pause, volume, speed, fullscreen, keyboard shortcuts)
  - [`src/components/VideoPlayer.jsx`](src/components/VideoPlayer.jsx) — more advanced player with HLS.js support, quality selector, subtitles, skip intro, multi-audio tracks — ALREADY INSTALLED in dependencies
  - [`src/sources.js`](src/sources.js) — source provider with 7 embed sources + 1 direct source
  - `hls.js` is already in `package.json` dependencies

## Implementation Plan

### Phase 1: Create the API Proxy (2 files)

**File 1: [`src/api/direct-source.js`](src/api/direct-source.js)** — Utility to call each embed source's internal JSON API

**File 2: [`api/proxy.js`](api/proxy.js)** — Vercel serverless function that:
- Receives: `?source=vidsrc&id=123&type=movie&season=1&episode=1`
- Calls the appropriate source's internal API
- Returns JSON: `{ url: "https://...m3u8", type: "hls", name: "vidsrc.to" }`

**Supported Sources & Their Internal APIs:**

| Source | Internal API Method | URL Pattern |
|--------|-------------------|-------------|
| **vidsrc.to** | Known JSON endpoint | `https://vidsrc.to/ajax/embed/episode/{tmdbId}/sources` |
| **embed.su** | Known JSON endpoint | `https://embed.su/api/...` |
| **2embed.cc** | Direct redirect to CDN | Parse redirect from embed URL |
| **multiembed.mov** | Direct redirect | Parse redirect from embed URL |

### Phase 2: Modify [`src/sources.js`](src/sources.js)

Change source index 0 ("Direct MP4") from:
```javascript
{
  name: 'Direct MP4',
  type: 'direct',
  url: () => DIRECT_MP4_URL, // hardcoded demo
}
```
to:
```javascript
{
  name: 'Direct Player',
  type: 'direct',
  url: (tmdbId, mediaType, season, episode) =>
    `/api/proxy?source=vidsrc&id=${tmdbId}&type=${mediaType}${season ? `&season=${season}&episode=${episode}` : ''}`,
}
```

The proxy function will handle the actual extraction of the real stream URL from vidsrc.to's internal API.

### Phase 3: Modify [`src/components/DirectPlayer.jsx`](src/components/DirectPlayer.jsx)

Add HLS.js support so it can play both MP4 (direct) and HLS (streamed) sources:
- Import `hls.js` (already in dependencies)
- If the source URL ends with `.m3u8`, initialize HLS.js
- Otherwise fall back to native `<video>` for MP4

**Alternative:** Replace DirectPlayer with the existing [`VideoPlayer`](src/components/VideoPlayer.jsx) which already has:
- HLS.js integration with quality level selection
- Simulated qualities for non-HLS streams  
- Multi-audio track support (for HLS streams that have it)
- Skip intro, subtitles, next episode button
- All the same controls (play/pause, volume, speed, fullscreen, keyboard shortcuts)

### Phase 4: Update WatchPage

- Source index 0 = "Direct Player" with `type: 'direct'`
- Conditional rendering: `type === 'direct'` → DirectPlayer/VideoPlayer (loading from proxy), `type === 'embed'` → iframe

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Embed source changes internal API | Medium | Add fallback — if proxy fails, auto-switch to next source |
| Vercel cold start latency | Medium | First request may be slow (1-2s); subsequent requests are fast |
| CORS restrictions on internal APIs | High | Proxy runs server-side, no CORS issues |
| Rate limiting from embed sources | Low | Cache responses, stagger requests |
| Anti-bot measures (Cloudflare) | Medium | Some sources may block; skip those and use next available |

## Fallback Plan

If the proxy approach fails for any source:
1. The proxy returns `{ error: true }` 
2. WatchPage catches the error via `onError` callback
3. Auto-failover switches to the next source (index 1, then index 2, etc.)
4. If all sources fail → show error message
5. The iframe approach still works for sources that don't expose internal APIs

## Files to Modify

| File | Action | Purpose |
|------|--------|---------|
| [`api/proxy.js`](api/proxy.js) | CREATE | Vercel serverless function to extract stream URLs |
| [`src/sources.js`](src/sources.js) | MODIFY | Change Direct MP4 source to use proxy URL |
| [`src/components/DirectPlayer.jsx`](src/components/DirectPlayer.jsx) | MODIFY | Add HLS.js support |
| [`src/pages/WatchPage.jsx`](src/pages/WatchPage.jsx) | MODIFY | Keep existing conditional rendering (already done) |