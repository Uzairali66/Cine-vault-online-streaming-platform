/**
 * CineVault — Language & Dubbing Utilities
 *
 * Provides helpers for:
 * - Looking up language names and flags from ISO codes
 * - Determining which dubs/subtitles are available from TMDB translations data
 * - Getting embed-compatible language parameters
 * - Fetching Korean & other language-specific content from TMDB
 */

import { tmdbFetch } from './tmdb';

// ─── Language Registry ──────────────────────────────────────────
// ISO 639-1 → { name, flag, iso_3166_1 (country) }
const LANGUAGE_MAP = {
  en: { name: 'English', flag: '🇬🇧', iso_3166_1: 'US' },
  hi: { name: 'Hindi', flag: '🇮🇳', iso_3166_1: 'IN' },
  ko: { name: 'Korean', flag: '🇰🇷', iso_3166_1: 'KR' },
  ja: { name: 'Japanese', flag: '🇯🇵', iso_3166_1: 'JP' },
  zh: { name: 'Chinese', flag: '🇨🇳', iso_3166_1: 'CN' },
  es: { name: 'Spanish', flag: '🇪🇸', iso_3166_1: 'ES' },
  fr: { name: 'French', flag: '🇫🇷', iso_3166_1: 'FR' },
  de: { name: 'German', flag: '🇩🇪', iso_3166_1: 'DE' },
  pt: { name: 'Portuguese', flag: '🇵🇹', iso_3166_1: 'PT' },
  ru: { name: 'Russian', flag: '🇷🇺', iso_3166_1: 'RU' },
  ar: { name: 'Arabic', flag: '🇸🇦', iso_3166_1: 'SA' },
  ta: { name: 'Tamil', flag: '🇮🇳', iso_3166_1: 'IN' },
  te: { name: 'Telugu', flag: '🇮🇳', iso_3166_1: 'IN' },
  bn: { name: 'Bengali', flag: '🇧🇩', iso_3166_1: 'BD' },
  th: { name: 'Thai', flag: '🇹🇭', iso_3166_1: 'TH' },
  vi: { name: 'Vietnamese', flag: '🇻🇳', iso_3166_1: 'VN' },
  it: { name: 'Italian', flag: '🇮🇹', iso_3166_1: 'IT' },
  nl: { name: 'Dutch', flag: '🇳🇱', iso_3166_1: 'NL' },
  tr: { name: 'Turkish', flag: '🇹🇷', iso_3166_1: 'TR' },
  pl: { name: 'Polish', flag: '🇵🇱', iso_3166_1: 'PL' },
  sv: { name: 'Swedish', flag: '🇸🇪', iso_3166_1: 'SE' },
  da: { name: 'Danish', flag: '🇩🇰', iso_3166_1: 'DK' },
  fi: { name: 'Finnish', flag: '🇫🇮', iso_3166_1: 'FI' },
  no: { name: 'Norwegian', flag: '🇳🇴', iso_3166_1: 'NO' },
};

// ─── Language Name (e.g. "Japanese", "Hindi") ───────────────────
export function getLanguageName(code) {
  return LANGUAGE_MAP[code]?.name || code?.toUpperCase() || 'Unknown';
}

// ─── Language Flag Emoji (e.g. "🇯🇵", "🇮🇳") ─────────────────────
export function getLanguageFlag(code) {
  return LANGUAGE_MAP[code]?.flag || '🌐';
}

// ─── Full Label (e.g. "🇯🇵 Japanese") ───────────────────────────
export function getLanguageLabel(code) {
  const lang = LANGUAGE_MAP[code];
  return lang ? `${lang.flag} ${lang.name}` : `🌐 ${code?.toUpperCase() || 'Unknown'}`;
}

// ─── Embed-Safe Language Code ───────────────────────────────────
// Map our ISO codes to what embed sources expect.
// Most use ISO 639-1 directly; some use different codes.
export function getEmbedLangCode(code) {
  if (!code) return null;
  const map = {
    en: 'en',
    hi: 'hi',
    ko: 'ko',
    ja: 'ja',
    zh: 'zh',
    es: 'es',
    fr: 'fr',
    de: 'de',
    pt: 'pt',
    ru: 'ru',
    ar: 'ar',
    ta: 'ta',
    te: 'te',
    bn: 'bn',
    th: 'th',
    vi: 'vi',
    it: 'it',
    tr: 'tr',
    pl: 'pl',
  };
  return map[code] || null;
}

// ─── Dub / Translation Detection ────────────────────────────────
/**
 * Analyze TMDB /translations API response to determine
 * which dubs/subtitles are available.
 *
 * @param {Array} translations — TMDB translations data.translations array
 * @returns {{
 *   available: Array<{code: string, name: string, flag: string}>,
 *   hasEnglish: boolean,
 *   hasHindi: boolean,
 *   hasOriginal: boolean,
 * }}
 */
export function analyzeTranslations(translations, originalLang = null) {
  if (!translations || !Array.isArray(translations)) {
    return { available: [], hasEnglish: false, hasHindi: false };
  }

  const available = [];
  let hasEnglish = false;
  let hasHindi = false;

  // Track which ISO 639-1 codes exist and have data
  const seen = new Set();

  for (const t of translations) {
    const code = t.iso_639_1;
    if (!code || seen.has(code)) continue;

    // Only include if the translation has actual content (title or overview)
    const hasContent = t.data?.title || t.data?.name || t.data?.overview;
    if (!hasContent) continue;

    seen.add(code);

    const lang = LANGUAGE_MAP[code];
    available.push({
      code,
      name: lang?.name || code.toUpperCase(),
      flag: lang?.flag || '🌐',
      iso_3166_1: t.iso_3166_1,
    });

    if (code === 'en') hasEnglish = true;
    if (code === 'hi') hasHindi = true;
  }

  return { available, hasEnglish, hasHindi };
}

// ─── Fetch Translations from TMDB ───────────────────────────────
/**
 * Fetch available translations for a movie or TV show.
 *
 * @param {number|string} tmdbId
 * @param {'movie'|'tv'} mediaType
 * @returns {Promise<Array>} translations array
 */
export async function fetchTranslations(tmdbId, mediaType = 'movie') {
  try {
    const data = await tmdbFetch(`/${mediaType}/${tmdbId}/translations`);
    return data.translations || [];
  } catch {
    return [];
  }
}

/**
 * Convenience: fetch + analyze translations in one call.
 * Returns { available, hasEnglish, hasHindi, translations }
 */
export async function getContentDubs(tmdbId, mediaType = 'movie', originalLang = null) {
  const translations = await fetchTranslations(tmdbId, mediaType);
  const analysis = analyzeTranslations(translations, originalLang);
  return { ...analysis, translations };
}

// ─── Korean Content Helpers ─────────────────────────────────────

/**
 * Fetch Korean (or other language) content from TMDB.
 *
 * @param {'movie'|'tv'} mediaType
 * @param {string} langCode — ISO 639-1 (default: 'ko' for Korean)
 * @param {number} page
 * @param {object} extraParams — additional TMDB params
 * @returns {Promise<Array>} results array
 */
export async function fetchContentByLanguage(
  mediaType = 'movie',
  langCode = 'ko',
  page = 1,
  extraParams = {}
) {
  try {
    const params = {
      with_original_language: langCode,
      page,
      sort_by: 'popularity.desc',
    };
    if (extraParams.with_genres) params.with_genres = extraParams.with_genres;
    if (extraParams['vote_count.gte']) params['vote_count.gte'] = extraParams['vote_count.gte'];

    const data = await tmdbFetch(`/discover/${mediaType}`, params);
    return {
      results: (data.results || []).map((item) => ({
        ...item,
        media_type: mediaType,
        language_badge: getLanguageLabel(langCode),
      })),
      total_pages: data.total_pages || 0,
    };
  } catch {
    return { results: [], total_pages: 0 };
  }
}

/**
 * Fetch Korean movies AND TV shows, merged by popularity.
 * Used for the "Korean Content" home page section.
 */
export async function fetchKoreanContent(page = 1) {
  const [movies, tvShows] = await Promise.all([
    fetchContentByLanguage('movie', 'ko', page),
    fetchContentByLanguage('tv', 'ko', page),
  ]);

  const merged = [...(movies.results || []), ...(tvShows.results || [])];
  merged.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

  return merged;
}

/**
 * All supported languages for the dropdown selector.
 * Used by getSupportedLanguages() to return the full list,
 * and by getDubFilteredOptions() to do lookups.
 */
const ALL_LANGUAGE_OPTIONS = [
  { code: null, label: 'Original Language', flag: '🎬' },
  { code: 'en', label: '🇬🇧 English', flag: '🇬🇧' },
  { code: 'hi', label: '🇮🇳 Hindi', flag: '🇮🇳' },
  { code: 'ko', label: '🇰🇷 Korean', flag: '🇰🇷' },
  { code: 'ja', label: '🇯🇵 Japanese', flag: '🇯🇵' },
  { code: 'zh', label: '🇨🇳 Chinese', flag: '🇨🇳' },
  { code: 'es', label: '🇪🇸 Spanish', flag: '🇪🇸' },
  { code: 'fr', label: '🇫🇷 French', flag: '🇫🇷' },
  { code: 'de', label: '🇩🇪 German', flag: '🇩🇪' },
  { code: 'pt', label: '🇵🇹 Portuguese', flag: '🇵🇹' },
  { code: 'ta', label: 'Tamil', flag: '🇮🇳' },
  { code: 'te', label: 'Telugu', flag: '🇮🇳' },
  { code: 'bn', label: 'Bengali', flag: '🇧🇩' },
  { code: 'th', label: '🇹🇭 Thai', flag: '🇹🇭' },
  { code: 'vi', label: '🇻🇳 Vietnamese', flag: '🇻🇳' },
  { code: 'ar', label: '🇸🇦 Arabic', flag: '🇸🇦' },
  { code: 'tr', label: '🇹🇷 Turkish', flag: '🇹🇷' },
  { code: 'ru', label: '🇷🇺 Russian', flag: '🇷🇺' },
];

/**
 * Get all supported language codes for the language selector.
 * Returns the full list of 18 languages (all codified options).
 */
export function getSupportedLanguages() {
  return ALL_LANGUAGE_OPTIONS;
}

/**
 * Get a per-content filtered language dropdown based on TMDB translations.
 *
 * Only includes languages that have official translations (dubs/subtitles)
 * confirmed by TMDB's /translations endpoint. Always includes "Original Language"
 * as the first option.
 *
 * @param {object} dubInfo — result from analyzeTranslations() or getContentDubs()
 * @param {string|null} originalLang — ISO 639-1 code of the content's original language
 * @returns {Array<{code: string|null, label: string, flag: string}>}
 *
 * Example output for a Korean movie with English + Hindi dubs:
 *   [
 *     { code: null,  label: 'Original Language (🇰🇷 Korean)', flag: '🎬' },
 *     { code: 'hi',  label: '🇮🇳 Hindi (Official Dub)',       flag: '🇮🇳' },
 *     { code: 'en',  label: '🇬🇧 English (Official Dub)',      flag: '🇬🇧' },
 *   ]
 */
export function getDubFilteredOptions(dubInfo, originalLang = null) {
  // Always start with Original Language
  const options = [
    { code: null, label: 'Original Language', flag: '🎬' },
  ];

  if (!dubInfo || !dubInfo.available || dubInfo.available.length === 0) {
    return options; // only "Original Language"
  }

  // Build a set of language codes confirmed by TMDB translations
  const availableCodes = new Set(
    dubInfo.available.map((t) => t.code).filter(Boolean)
  );
  // Remove the original language from available dubs (it's already the default)
  if (originalLang) {
    availableCodes.delete(originalLang);
  }

  // Priority order: English, Hindi, then alphabetical by code
  const priority = ['hi', 'en'];
  const sorted = [...availableCodes].sort((a, b) => {
    const aIdx = priority.indexOf(a);
    const bIdx = priority.indexOf(b);
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    return a.localeCompare(b);
  });

  for (const code of sorted) {
    const lang = LANGUAGE_MAP[code];
    if (lang) {
      options.push({
        code,
        label: `${lang.flag} ${lang.name} (Official Dub)`,
        flag: lang.flag,
        isDub: true,
      });
    }
  }

  return options;
}