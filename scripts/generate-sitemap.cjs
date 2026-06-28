/**
 * Sitemap Generator Script
 *
 * Run: node scripts/generate-sitemap.cjs
 *
 * Generates a sitemap.xml file in the /public directory.
 * Includes all static pages, genre pages, year pages, and popular
 * movies/TV shows from TMDB (pages 1-50 = ~1000 URLs each).
 *
 * For production, update BASE_URL in src/config/site.js — this script
 * reads from a single shared source of truth.
 */

const fs = require('fs');
const path = require('path');

// ─── Read BASE_URL from the shared config (single source of truth) ───
// We require the raw file and extract BASE_URL to avoid importing ESM.
function readBaseUrl() {
  const configPath = path.join(__dirname, '..', 'src', 'config', 'site.js');
  const raw = fs.readFileSync(configPath, 'utf-8');
  const match = raw.match(/export\s+const\s+BASE_URL\s*=\s*['"`]([^'"`]+)['"`]/);
  return match ? match[1] : 'https://movie-app-version-2.vercel.app';
}

const BASE_URL = readBaseUrl();
const TMDB_API_KEY = process.env.VITE_TMDB_API_KEY || '';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_OPTS = {
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${TMDB_API_KEY}`,
  },
};

// How many TMDB pages to fetch per category (movies + TV).
// 50 pages × ~20 results = ~1000 movies + ~1000 TV shows = ~4000 sitemap URLs.
const TMDB_PAGES = 50;

const STATIC_PAGES = [
  { loc: '/', priority: '1.0', changefreq: 'daily' },
  { loc: '/browse', priority: '0.9', changefreq: 'daily' },
  { loc: '/signup', priority: '0.7', changefreq: 'monthly' },
  { loc: '/login', priority: '0.5', changefreq: 'monthly' },
  { loc: '/contact', priority: '0.5', changefreq: 'monthly' },
  { loc: '/dmca', priority: '0.4', changefreq: 'monthly' },
  { loc: '/privacy-policy', priority: '0.4', changefreq: 'monthly' },
  { loc: '/terms-of-service', priority: '0.4', changefreq: 'monthly' },
];

// Year pages — targets "watch 2024 movies online" searches.
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_PAGES = [];
for (let y = CURRENT_YEAR; y >= CURRENT_YEAR - 14; y--) {
  YEAR_PAGES.push({ loc: `/year/${y}`, priority: '0.8', changefreq: 'weekly' });
}

// Genre pages — TMDB genre IDs (movie).
const GENRE_IDS = [
  28, 12, 16, 35, 80, 99, 18, 10751, 14, 36, 27, 10402, 9648, 10749, 53, 10752, 37,
];
const GENRE_PAGES = GENRE_IDS.map((id) => ({
  loc: `/genre/${id}`,
  priority: '0.8',
  changefreq: 'weekly',
}));

async function fetchJson(url) {
  const res = await fetch(url, TMDB_OPTS);
  if (!res.ok) throw new Error(`TMDB fetch failed (${res.status}): ${url}`);
  return res.json();
}

async function fetchPaged(endpoint, extraQuery = '') {
  const all = [];
  const pages = Array.from({ length: TMDB_PAGES }, (_, i) => i + 1);
  // Fetch in batches of 10 to avoid hammering the API.
  const BATCH = 10;
  for (let i = 0; i < pages.length; i += BATCH) {
    const slice = pages.slice(i, i + BATCH);
    const responses = await Promise.all(
      slice.map((p) =>
        fetchJson(`${TMDB_BASE}/${endpoint}?page=${p}&include_adult=false&language=en-US${extraQuery}`)
          .then((d) => d.results || [])
          .catch(() => [])
      )
    );
    responses.forEach((r) => all.push(...r));
  }
  return all;
}

function buildSitemapXml(pages) {
  const urls = pages
    .map(
      (p) => `  <url>
    <loc>${BASE_URL}${p.loc}</loc>
    <priority>${p.priority}</priority>
    <changefreq>${p.changefreq}</changefreq>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

async function main() {
  console.log('Generating sitemap.xml...');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`TMDB pages per category: ${TMDB_PAGES}`);

  const dynamicPages = [...STATIC_PAGES, ...YEAR_PAGES, ...GENRE_PAGES];

  if (TMDB_API_KEY) {
    console.log('Fetching popular movies from TMDB...');
    try {
      const [movies, tvShows] = await Promise.all([
        fetchPaged('movie/popular'),
        fetchPaged('tv/popular'),
      ]);

      console.log(`Found ${movies.length} movies, ${tvShows.length} TV shows`);

      const seenMovie = new Set();
      movies.forEach((m) => {
        if (seenMovie.has(m.id)) return;
        seenMovie.add(m.id);
        dynamicPages.push({ loc: `/movie/${m.id}`, priority: '0.8', changefreq: 'weekly' });
        dynamicPages.push({ loc: `/watch/tmdb/${m.id}?mediaType=movie`, priority: '0.7', changefreq: 'weekly' });
      });

      const seenTv = new Set();
      tvShows.forEach((s) => {
        if (seenTv.has(s.id)) return;
        seenTv.add(s.id);
        dynamicPages.push({ loc: `/tv/${s.id}`, priority: '0.8', changefreq: 'weekly' });
        dynamicPages.push({ loc: `/watch/tmdb/${s.id}?mediaType=tv`, priority: '0.7', changefreq: 'weekly' });
      });
    } catch (err) {
      console.warn('Could not fetch TMDB data:', err.message);
      console.warn('Generating sitemap with static + genre + year pages only.');
    }
  } else {
    console.warn('No TMDB API key found (VITE_TMDB_API_KEY not set).');
    console.warn('Generating sitemap with static + genre + year pages only.');
  }

  const xml = buildSitemapXml(dynamicPages);
  const outputPath = path.join(__dirname, '..', 'public', 'sitemap.xml');

  fs.writeFileSync(outputPath, xml, 'utf-8');
  console.log(`\n✅ Sitemap generated: ${outputPath}`);
  console.log(`   Total URLs: ${dynamicPages.length}`);
}

main().catch((err) => {
  console.error('Sitemap generation failed:', err);
  process.exit(1);
});
