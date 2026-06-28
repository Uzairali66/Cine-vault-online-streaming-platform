/**
 * ──────────────────────────────────────────────────────────────
 *  CineVault — Central Site Configuration
 * ──────────────────────────────────────────────────────────────
 *  Single source of truth for site-wide constants.
 *
 *  🔁 WHEN YOU BUY A DOMAIN:
 *     Change ONLY `BASE_URL` below. Everything else (SEO, sitemap,
 *     robots, canonical URLs, Open Graph) updates automatically.
 *
 *  🔁 WHEN YOU GET AD NETWORK APPROVAL:
 *     Paste your AdSense / PropellerAds / PopAds snippet into
 *     AD_CONFIG below and the AdBanner component lights up.
 * ──────────────────────────────────────────────────────────────
 */

// 🔁 Change this to your real domain when purchased.
// Example: 'https://cinevault.to'
export const BASE_URL = 'https://movie-app-version-2.vercel.app';

export const SITE_NAME = 'CineVault';
export const SITE_TAGLINE = 'Watch Free Movies & TV Shows Online';
export const DEFAULT_TITLE = `${SITE_NAME} — ${SITE_TAGLINE}`;

export const DEFAULT_DESCRIPTION =
  'Watch movies and TV shows online for free. Stream the latest releases in HD quality without signing up. CineVault offers thousands of free movies and TV episodes on demand.';

export const DEFAULT_KEYWORDS =
  'movies, tv shows, watch online, free movies, streaming, hd movies, watch free, online cinema, movie streaming, tv episodes, watch tv online, hd streaming, free cinema, movie app';

export const DEFAULT_IMAGE = '/logo.png';

/**
 * Helper to build absolute URLs from a path.
 * Used by SEO + sitemap generator.
 */
export function absoluteUrl(path = '') {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL}${clean}`;
}

// ─── AD NETWORK CONFIG (paste your codes here once approved) ────
//
// These are intentionally EMPTY. Ad networks require you to own a
// real domain before approval. When approved:
//
// 1. Paste your AdSense / PropellerAds banner HTML snippet into
//    AD_CONFIG.BANNER_HTML (it will render inside every AdBanner).
//
// 2. Paste your PropellerAds / PopAds pop-under URL into
//    AD_CONFIG.POPUNDER_URL (used by PopUnderAd.jsx).
//
// 3. Fill AD_CONFIG.ADS_TXT_LINES with the verification lines from
//    your ad networks, then copy them into public/ads.txt.
//
export const AD_CONFIG = {
  // Master switch — set to true once your first ad code is in place.
  ENABLED: false,

  // Full HTML snippet from your ad network (e.g. AdSense <script> + <ins>).
  // Rendered via dangerouslySetInnerHTML when ENABLED is true.
  BANNER_HTML: '',

  // Pop-under URL from PropellerAds / PopAds.
  POPUNDER_URL: '',

  // ads.txt verification lines (one per line). Copy these into public/ads.txt.
  // Example: 'google.com, pub-123456789, DIRECT, f08c47fec0942fa0'
  ADS_TXT_LINES: [],

  // Google Analytics measurement ID (e.g. 'G-XXXXXXXXXX').
  // Set this in index.html gtag snippet OR here for reference.
  GA_MEASUREMENT_ID: '',
};

export default {
  BASE_URL,
  SITE_NAME,
  SITE_TAGLINE,
  DEFAULT_TITLE,
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
  DEFAULT_IMAGE,
  absoluteUrl,
  AD_CONFIG,
};
