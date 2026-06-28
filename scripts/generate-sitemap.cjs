/**
 * Sitemap Generator Script
 * 
 * Run: node scripts/generate-sitemap.js
 * 
 * Generates a sitemap.xml file in the /public directory.
 * Includes all static pages and popular movies/TV shows from TMDB.
 * 
 * For production, update BASE_URL to your actual domain.
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://cinevault.app'; // Replace with your actual domain
const STATIC_PAGES = [
  { loc: '/', priority: '1.0', changefreq: 'daily' },
  { loc: '/browse', priority: '0.9', changefreq: 'daily' },
  { loc: '/signup', priority: '0.7', changefreq: 'monthly' },
  { loc: '/login', priority: '0.5', changefreq: 'monthly' },
  { loc: '/contact', priority: '0.5', changefreq: 'monthly' },
  { loc: '/dmca', priority: '0.4', changefreq: 'monthly' },
  { loc: '/privacy', priority: '0.4', changefreq: 'monthly' },
  { loc: '/terms', priority: '0.4', changefreq: 'monthly' },
];

const TMDB_API_KEY = process.env.VITE_TMDB_API_KEY || '';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_OPTS = {
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${TMDB_API_KEY}`,
  },
};

async function fetchPopularMovies(page = 1) {
  const url = `${TMDB_BASE}/movie/popular?page=${page}`;
  const res = await fetch(url, TMDB_OPTS);
  if (!res.ok) throw new Error(`TMDB fetch failed: ${res.status}`);
  const data = await res.json();
  return data.results || [];
}

async function fetchPopularTV(page = 1) {
  const url = `${TMDB_BASE}/tv/popular?page=${page}`;
  const res = await fetch(url, TMDB_OPTS);
  if (!res.ok) throw new Error(`TMDB fetch failed: ${res.status}`);
  const data = await res.json();
  return data.results || [];
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
  console.log(`Static pages: ${STATIC_PAGES.length}`);

  const dynamicPages = [...STATIC_PAGES];

  // Try to fetch popular movies from TMDB
  if (TMDB_API_KEY) {
    console.log('Fetching popular movies from TMDB...');
    try {
      const [movies, tvShows] = await Promise.all([
        fetchPopularMovies(1),
        fetchPopularTV(1),
      ]);

      console.log(`Found ${movies.length} movies, ${tvShows.length} TV shows`);

      movies.forEach((m) => {
        dynamicPages.push({
          loc: `/movie/${m.id}`,
          priority: '0.8',
          changefreq: 'weekly',
        });
        dynamicPages.push({
          loc: `/watch/${m.id}?mediaType=movie`,
          priority: '0.7',
          changefreq: 'weekly',
        });
      });

      tvShows.forEach((s) => {
        dynamicPages.push({
          loc: `/tv/${s.id}`,
          priority: '0.8',
          changefreq: 'weekly',
        });
        dynamicPages.push({
          loc: `/watch/${s.id}?mediaType=tv`,
          priority: '0.7',
          changefreq: 'weekly',
        });
      });
    } catch (err) {
      console.warn('Could not fetch TMDB data:', err.message);
      console.warn('Generating sitemap with static pages only.');
    }
  } else {
    console.warn('No TMDB API key found (VITE_TMDB_API_KEY not set).');
    console.warn('Generating sitemap with static pages only.');
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