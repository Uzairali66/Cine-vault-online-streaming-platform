# CineVault — Streaming Source Integration Plan

## Goal
Make the site like hdmovie2: automatically show thousands of movies with streaming links, **no manual file uploads or database entry needed**.

## Current Problem
Every movie must be manually added to Appwrite's `movies` collection with a `stream_url` — this is unsustainable for a site with hundreds of movies.

## Solution Architecture

```
┌─────────────────────────────────────────────────────┐
│                   CineVault Frontend                │
│                  (React + Vite)                     │
│                                                     │
│  HomePage ──► TMDB API (browsing/discovery)         │
│     │                                               │
│     ▼                                               │
│  WatchPage ──► Source Provider ──► Embed/Stream URL │
│     │                      │                        │
│     ▼                      ▼                        │
│  VideoPlayer          External Source               │
│  (plays MP4/HLS)      (no hosting needed)           │
│                                                     │
│  Appwrite (kept ONLY for search analytics)           │
└─────────────────────────────────────────────────────┘
```

### How It Works

1. **HomePage** stays unchanged — fetches movies from TMDB API for browsing/searching
2. **MovieDetailPage** stays unchanged — shows metadata from TMDB
3. **WatchPage** gets a new Source Provider system:
   - Takes the TMDB movie ID
   - Queries a source provider API for a streaming URL
   - Passes the URL to VideoPlayer
4. **Appwrite** is kept ONLY for `updateSearchCount` (search analytics in `matrics` collection)

---

## Step 1: Create Source Provider Module

**New file:** `src/sources.js`

This module handles all streaming source lookups. It tries sources in order (fallback chain):

```javascript
// src/sources.js — concept
const SOURCES = [
  // Primary: Fetch from a free embed source
  { name: 'vidsrc', url: (tmdbId) => `https://vidsrc.xyz/embed/movie/${tmdbId}` },
  { name: '2embed',  url: (tmdbId) => `https://www.2embed.cc/embed/${tmdbId}` },
  // Fallback: Try another
  { name: 'multiembed', url: (tmdbId) => `https://multiembed.mov/directstream.php?video_id=${tmdbId}` },
];

export async function getStreamUrl(tmdbId, type = 'movie') {
  // Try each source until one works
  // Return the embed URL or direct video URL
}
```

**Two approaches for getting the actual video URL:**

### Option A: Direct IFrame Embed (simplest, fastest)
- Use embed URLs that play directly in an iframe
- Your VideoPlayer wraps the iframe
- No HLS/MP4 parsing needed
- Works immediately, no server needed

### Option B: Scrape/Proxy (more control)
- Run a small backend (Node.js/Express) that fetches from embed sources
- Extracts the actual video URL
- Passes to your existing VideoPlayer
- Better user experience (native controls, quality selection)
- Requires a server

**Recommendation:** Start with Option A (embed) to get working fast. Upgrade to Option B later.

---

## Step 2: Update WatchPage to Use Source Provider

**Modified file:** `src/pages/WatchPage.jsx`

Changes:
- Remove dependency on `getMovieById` from appwrite (for streaming)
- When navigating to `/watch/tmdb/:id`, call `getStreamUrl(id)` from sources.js
- If a stream URL is found, pass it to VideoPlayer
- If not found, show "No streaming source available"
- Keep TMDB metadata display (title, overview, release year)

No more `/watch/appwrite/:documentId` route needed (or keep it for admin/premium content).

---

## Step 3: Clean Up Unused Appwrite Code

**Modified file:** `src/appwrite.js`

Remove (or keep but don't use actively):
- `getMovies()` — no longer needed (TMDB handles browsing)
- `getMovieById()` — no longer needed for streaming
- `createMovie()` — no longer needed

Keep:
- `updateSearchCount()` — still useful for analytics

---

## Step 4: Remove Appwrite Movies Collection Route

**Modified file:** `src/App.jsx`

Remove the `/watch/appwrite/:documentId` route (or keep as optional for admin).

---

## Monetization (How You Earn)

Even without hosting files, you make money through:

1. **AdBanner** — already integrated (sidebar, leaderboard, banner formats)
2. **DonateButton** — already integrated (Buy Me a Coffee, Stripe)
3. **AffiliateLinks** — already integrated (Amazon, NordVPN)
4. **Premium subscriptions** — "Upgrade for ad-free" (AuthContext already built)
5. **Pop-under/redirect ads** — can be added on video page load
6. **Pre-roll ads** — can be added back to VideoPlayer later

---

## Implementation Order

1. Create `src/sources.js` with embed source provider
2. Modify `WatchPage.jsx` to use the source provider for TMDB movies
3. Clean up unused Appwrite movie functions
4. Test with any TMDB movie ID
5. Test with a real movie like `/watch/tmdb/550` (Fight Club)