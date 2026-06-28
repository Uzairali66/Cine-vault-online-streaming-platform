import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MovieCard from '../components/MovieCard';
import GenreRow from '../components/GenreRow';
import Spinner from '../components/Spinner';
import AdBanner from '../components/AdBanner';
import SEO from '../components/SEO';
import PageLayout from '../components/layout/PageLayout';
import PageHeader from '../components/layout/PageHeader';
import { useDebounce } from 'react-use';
import { updateSearchCount } from '../appwrite';
import { ALL_GENRES, MOVIE_CATEGORY_ROWS, MOVIE_GENRES, TV_CATEGORY_ROWS, TV_GENRES } from '../utils/categories';
import { tmdbFetch } from '../utils/tmdb';

const getFilterGenres = (mediaType) => {
  if (mediaType === 'tv') return TV_GENRES;
  if (mediaType === 'movie') return MOVIE_GENRES;
  return ALL_GENRES;
};

const getBrowseRows = (mediaType) => {
  if (mediaType === 'tv') return TV_CATEGORY_ROWS;
  if (mediaType === 'movie') return MOVIE_CATEGORY_ROWS;
  return [...MOVIE_CATEGORY_ROWS.slice(0, 8), ...TV_CATEGORY_ROWS.slice(0, 8)];
};

const MEDIA_TYPES = [
  { value: '', label: 'All' },
  { value: 'movie', label: 'Movies' },
  { value: 'tv', label: 'TV Shows' },
];

const MOVIE_SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Most Popular' },
  { value: 'vote_average.desc', label: 'Highest Rated' },
  { value: 'primary_release_date.desc', label: 'Newest' },
  { value: 'primary_release_date.asc', label: 'Oldest' },
];

const TV_SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Most Popular' },
  { value: 'vote_average.desc', label: 'Highest Rated' },
  { value: 'first_air_date.desc', label: 'Newest' },
  { value: 'first_air_date.asc', label: 'Oldest' },
];

const YEAR_RANGE = [];
for (let y = new Date().getFullYear(); y >= 1900; y--) {
  YEAR_RANGE.push(y);
}

const BrowsePage = () => {
  const { isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [upcomingResults, setUpcomingResults] = useState([]);
  const [isLoadingUpcoming, setIsLoadingUpcoming] = useState(false);
  const upcomingMovieScrollRef = useRef(null);
  const upcomingTVScrollRef = useRef(null);

  const handleRowKeyDown = (ref) => (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      if (ref.current) {
        const amount = ref.current.clientWidth * 0.75;
        ref.current.scrollBy({
          left: e.key === 'ArrowLeft' ? -amount : amount,
          behavior: 'smooth',
        });
      }
    }
  };

  // Filters from URL params
  const searchQuery = searchParams.get('search') || '';
  const genreParam = searchParams.get('genre') || '';
  const mediaTypeParam = searchParams.get('mediaType') || '';
  const activeSortOptions = mediaTypeParam === 'tv' ? TV_SORT_OPTIONS : MOVIE_SORT_OPTIONS;
  const sortParam = searchParams.get('sort') || activeSortOptions[0].value;
  const yearParam = searchParams.get('year') || '';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  // Force page to 1 when exploring a specific genre — no pagination needed
  const effectivePage = genreParam ? 1 : pageParam;

  const [debouncedSearch, setDebouncedSearch] = useState('');

  useDebounce(() => setDebouncedSearch(searchQuery), 500, [searchQuery]);

  const today = new Date().toISOString().split('T')[0];

  const fetchContent = async () => {
    setIsLoading(true);
    setError('');
    setUpcomingResults([]);

    try {
      let data;

      // Helper: pull results array out of an allSettled entry (graceful on failure).
      // tmdbFetch throws on non-ok, so a rejected promise means that single page
      // failed — we keep whatever other pages returned instead of nuking the whole view.
      const resultsFrom = (s) => (s.status === 'fulfilled' ? s.value.results || [] : []);

      if (debouncedSearch) {
        // Search — no date filtering needed
        data = await tmdbFetch('/search/multi', {
          query: debouncedSearch,
          page: effectivePage,
        });
      } else if (mediaTypeParam === '') {
        // "All" — fetch movies AND TV shows simultaneously, then merge
        const movieParams = {
          sort_by: sortParam,
          'primary_release_date.lte': today,
          ...(genreParam ? { with_genres: genreParam } : {}),
          ...(yearParam ? { primary_release_year: yearParam } : {}),
        };
        const tvParams = {
          sort_by: sortParam,
          'first_air_date.lte': today,
          ...(genreParam ? { with_genres: genreParam } : {}),
          ...(yearParam ? { first_air_date_year: yearParam } : {}),
        };

        if (genreParam) {
          // Fetch multiple pages (up to 80 items) for genre browsing
          const pagesToFetch = 4;
          const [movieSettled, tvSettled] = await Promise.all([
            Promise.allSettled(
              Array.from({ length: pagesToFetch }, (_, i) =>
                tmdbFetch('/discover/movie', { ...movieParams, page: i + 1 })
              )
            ),
            Promise.allSettled(
              Array.from({ length: pagesToFetch }, (_, i) =>
                tmdbFetch('/discover/tv', { ...tvParams, page: i + 1 })
              )
            ),
          ]);

          const movieResults = movieSettled
            .flatMap(resultsFrom)
            .map((item) => ({ ...item, media_type: 'movie' }));
          const tvResults = tvSettled
            .flatMap(resultsFrom)
            .map((item) => ({ ...item, media_type: 'tv' }));

          // Merge, deduplicate by ID, and sort by popularity
          const seen = new Set();
          const merged = [...movieResults, ...tvResults].filter((item) => {
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
          });
          merged.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

          data = { results: merged, total_pages: 1 };
        } else {
          // Single-page fetch for paginated browsing
          const [movieSettled, tvSettled] = await Promise.allSettled([
            tmdbFetch('/discover/movie', { ...movieParams, page: effectivePage }),
            tmdbFetch('/discover/tv', { ...tvParams, page: effectivePage }),
          ]);

          if (movieSettled.status !== 'fulfilled' && tvSettled.status !== 'fulfilled') {
            throw new Error('Failed to fetch content');
          }

          const movieData =
            movieSettled.status === 'fulfilled' ? movieSettled.value : { results: [] };
          const tvData =
            tvSettled.status === 'fulfilled' ? tvSettled.value : { results: [] };

          // Tag each result with media_type since discover endpoints don't include it
          const taggedMovies = (movieData.results || []).map((item) => ({
            ...item,
            media_type: 'movie',
          }));
          const taggedTV = (tvData.results || []).map((item) => ({
            ...item,
            media_type: 'tv',
          }));

          // Merge and sort by popularity (descending)
          const mergedResults = [...taggedMovies, ...taggedTV].sort(
            (a, b) => (b.popularity || 0) - (a.popularity || 0)
          );

          data = {
            results: mergedResults,
            total_pages: Math.max(
              movieData.total_pages || 1,
              tvData.total_pages || 1
            ),
          };
        }
      } else if (mediaTypeParam === 'tv') {
        const baseParams = {
          sort_by: sortParam,
          'first_air_date.lte': today,
          ...(genreParam ? { with_genres: genreParam } : {}),
          ...(yearParam ? { first_air_date_year: yearParam } : {}),
        };

        if (genreParam) {
          // Fetch multiple pages (up to 80 items) for genre browsing
          const pagesToFetch = 4;
          const settled = await Promise.allSettled(
            Array.from({ length: pagesToFetch }, (_, i) =>
              tmdbFetch('/discover/tv', { ...baseParams, page: i + 1 })
            )
          );

          const allResults = [];
          const existingIds = new Set();
          for (const s of settled) {
            for (const item of resultsFrom(s)) {
              if (!existingIds.has(item.id)) {
                allResults.push(item);
                existingIds.add(item.id);
              }
            }
          }

          data = { results: allResults, total_pages: 1 };
        } else {
          data = await tmdbFetch('/discover/tv', { ...baseParams, page: effectivePage });
        }
      } else {
        // Movie only (includes 'movie' and any unknown mediaTypeParam)
        const baseParams = {
          sort_by: sortParam,
          'primary_release_date.lte': today,
          ...(genreParam ? { with_genres: genreParam } : {}),
          ...(yearParam ? { primary_release_year: yearParam } : {}),
          ...(mediaTypeParam === 'movie' ? { with_original_language: 'en' } : {}),
        };

        if (genreParam) {
          // Fetch multiple pages (up to 80 items) for genre browsing
          const pagesToFetch = 4;
          const settled = await Promise.allSettled(
            Array.from({ length: pagesToFetch }, (_, i) =>
              tmdbFetch('/discover/movie', { ...baseParams, page: i + 1 })
            )
          );

          const allResults = [];
          const existingIds = new Set();
          for (const s of settled) {
            for (const item of resultsFrom(s)) {
              if (!existingIds.has(item.id)) {
                allResults.push(item);
                existingIds.add(item.id);
              }
            }
          }

          data = { results: allResults, total_pages: 1 };
        } else {
          data = await tmdbFetch('/discover/movie', { ...baseParams, page: effectivePage });
        }
      }

      setResults(data.results || []);
      setTotalPages(Math.min(data.total_pages || 1, 500));

      if (debouncedSearch && data.results.length > 0) {
        await updateSearchCount(debouncedSearch, data.results[0]);
      }

      // After main content loads, fetch upcoming content if not searching
      if (!debouncedSearch && (mediaTypeParam === 'movie' || mediaTypeParam === 'tv' || mediaTypeParam === '')) {
        setIsLoadingUpcoming(true);
        try {
          let upcomingData = [];
          // Use discover endpoint with primary_release_date.gte for strict upcoming filtering
          // No vote_count filter — upcoming content may have zero votes
          const upcomingSettled = await Promise.allSettled([
            ...(mediaTypeParam === '' || mediaTypeParam === 'movie'
              ? [tmdbFetch('/discover/movie', {
                sort_by: 'primary_release_date.asc',
                page: 1,
                'primary_release_date.gte': today,
                with_original_language: 'en',
              })]
              : []),
            ...(mediaTypeParam === '' || mediaTypeParam === 'tv'
              ? [tmdbFetch('/discover/tv', {
                sort_by: 'first_air_date.asc',
                page: 1,
                'first_air_date.gte': today,
              })]
              : []),
          ]);

          let idx = 0;
          if (mediaTypeParam === '' || mediaTypeParam === 'movie') {
            const s = upcomingSettled[idx++];
            if (s && s.status === 'fulfilled') {
              const tagged = (s.value.results || []).map((item) => ({
                ...item,
                media_type: 'movie',
              }));
              upcomingData = [...upcomingData, ...tagged];
            }
          }
          if (mediaTypeParam === '' || mediaTypeParam === 'tv') {
            const s = upcomingSettled[idx++];
            if (s && s.status === 'fulfilled') {
              const tagged = (s.value.results || []).map((item) => ({
                ...item,
                media_type: 'tv',
              }));
              upcomingData = [...upcomingData, ...tagged];
            }
          }
          // Client-side filter to absolutely ensure no already-released items
          upcomingData = upcomingData.filter((item) => {
            const date = item.release_date || item.first_air_date;
            return date && date >= today;
          });
          // Sort by release date ascending (closest upcoming first)
          upcomingData.sort((a, b) => {
            const aDate = a.release_date || a.first_air_date || '';
            const bDate = b.release_date || b.first_air_date || '';
            return aDate.localeCompare(bDate);
          });
          setUpcomingResults(upcomingData || []);
        } catch (upErr) {
          console.error('Upcoming fetch error:', upErr);
          // Non-critical — don't show error to user
        } finally {
          setIsLoadingUpcoming(false);
        }
      }
    } catch (err) {
      console.error('Browse fetch error:', err);
      setError('Failed to load content. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchContent();
    }
  }, [debouncedSearch, genreParam, mediaTypeParam, sortParam, yearParam, pageParam, authLoading]);

  const updateParam = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key !== 'page') params.set('page', '1');
    // Reset sort when switching media type to avoid invalid sort params
    if (key === 'mediaType') {
      const newSortOptions = value === 'tv' ? TV_SORT_OPTIONS : MOVIE_SORT_OPTIONS;
      params.set('sort', newSortOptions[0].value);
    }
    navigate(`/browse?${params.toString()}`, { replace: true });
  };

  const changePage = (delta) => {
    // Do not allow page changes when exploring a specific genre
    if (genreParam) return;
    const newPage = pageParam + delta;
    if (newPage >= 1 && newPage <= totalPages) {
      updateParam('page', String(newPage));
    }
  };

  const filterGenres = getFilterGenres(mediaTypeParam);
  const browseRows = getBrowseRows(mediaTypeParam);
  const activeGenre = filterGenres.find((g) => g.id === Number(genreParam));
  const selectedMediaLabel = mediaTypeParam === 'tv'
    ? 'TV Shows'
    : mediaTypeParam === 'movie'
      ? 'Movies'
      : 'Movies & TV Shows';
  const isBrowseRowsMode = !debouncedSearch && !genreParam && !yearParam;
  const isGridMode = !isBrowseRowsMode;

  const pageTitle = debouncedSearch
    ? `Results for "${debouncedSearch}"`
    : genreParam
      ? `${activeGenre?.name || 'Genre'} ${selectedMediaLabel}`
      : mediaTypeParam === 'tv'
        ? 'Browse TV Shows'
        : mediaTypeParam === 'movie'
          ? 'Browse Movies'
          : 'Browse Movies & TV Shows';

  const pageDescription = debouncedSearch
    ? `${results.length} titles found for your search.`
    : genreParam
      ? `Explore ${activeGenre?.name?.toLowerCase() || 'genre'} ${selectedMediaLabel.toLowerCase()} in one clean full-width grid.`
      : mediaTypeParam === 'tv'
        ? 'Discover TV shows by category, genre, year, and popularity.'
        : mediaTypeParam === 'movie'
          ? 'Discover movies by category, genre, year, and popularity.'
          : 'Discover movies and TV shows by category, genre, year, and popularity.';

  const scrollHorizontalRow = (ref, direction) => {
    if (!ref.current) return;
    ref.current.scrollBy({
      left: ref.current.clientWidth * 0.8 * direction,
      behavior: 'smooth',
    });
  };

  const renderUpcomingRow = ({ mediaType, title, description, scrollRef }) => {
    const rowItems = upcomingResults
      .filter((item) => item.media_type === mediaType && item.poster_path)
      .slice(0, 10);

    if (rowItems.length === 0) return null;

    return (
      <section className="mb-8">
        <div className="flex items-end justify-between gap-4 mb-4">
          <div>
            <h2 className="!text-xl !mb-1">{title}</h2>
            <p className="text-gray-400 text-sm">{description}</p>
          </div>
        </div>

        {isLoadingUpcoming ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : (
          <div className="relative group">
            <button
              onClick={() => scrollHorizontalRow(scrollRef, -1)}
              className="absolute left-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-r from-black/85 to-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-start pl-2 cursor-pointer border-none outline-none"
              aria-label={`Scroll ${title} left`}
            >
              <svg className="w-6 h-6 text-white drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div
              ref={scrollRef}
              onKeyDown={handleRowKeyDown(scrollRef)}
              tabIndex={0}
              className="overflow-x-auto pb-2 -mx-2 px-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent scroll-smooth overscroll-x-contain outline-none"
            >
              <div className="flex gap-3 min-w-max">
                {rowItems.map((item) => {
                  const posterUrl = item.poster_path
                    ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
                    : '/no-movie.png';
                  const itemDate = item.release_date || item.first_air_date || '';

                  return (
                    <div
                      key={`upcoming-${mediaType}-${item.id}`}
                      onClick={() => navigate(`/${mediaType}/${item.id}`)}
                      className="flex-shrink-0 w-[160px] xs:w-[180px] sm:w-[200px] cursor-pointer group/card transition-transform duration-200 hover:scale-105"
                    >
                      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-white/5 mb-2">
                        <img
                          src={posterUrl}
                          alt={item.title || item.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2 pt-6">
                          <p className="text-white text-xs font-medium">
                            {itemDate ? new Date(itemDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBA'}
                          </p>
                        </div>
                      </div>
                      <p className="text-white text-sm font-medium truncate group-hover/card:text-[#AB8BFF] transition-colors">
                        {item.title || item.name}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => scrollHorizontalRow(scrollRef, 1)}
              className="absolute right-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-l from-black/85 to-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-end pr-2 cursor-pointer border-none outline-none"
              aria-label={`Scroll ${title} right`}
            >
              <svg className="w-6 h-6 text-white drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </section>
    );
  };

  // Auth loading state
  if (authLoading) {
    return (
      <PageLayout pattern={false}>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Spinner />
        </div>
      </PageLayout>
    );
  }

  return (
    <>
      <SEO
        title={`${pageTitle} - CineVault`}
        description={pageDescription}
        url="/browse"
        type="website"
      />
      <PageLayout>
        <PageHeader
          badge={
            <>
              <span>{mediaTypeParam === 'tv' ? '📺' : mediaTypeParam === 'movie' ? '🎬' : '🍿'}</span>
              <span>{selectedMediaLabel}</span>
            </>
          }
          title={pageTitle}
          description={pageDescription}
        />

        {/* Filters Bar */}
        <div className="filter-panel">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search Input */}
            <div>
              <label className="block text-xs font-medium text-gray-100 mb-1.5 uppercase tracking-wider">
                Search
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => updateParam('search', e.target.value)}
                placeholder="Search movies & TV..."
                className="w-full bg-light-100/5 border border-light-100/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-100 outline-none focus:border-[#AB8BFF] transition-colors"
              />
            </div>

            {/* Media Type */}
            <div>
              <label className="block text-xs font-medium text-gray-100 mb-1.5 uppercase tracking-wider">
                Type
              </label>
              <select
                value={mediaTypeParam}
                onChange={(e) => updateParam('mediaType', e.target.value)}
                className="w-full bg-light-100/5 border border-light-100/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#AB8BFF] transition-colors"
              >
                {MEDIA_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Genre */}
            <div>
              <label className="block text-xs font-medium text-gray-100 mb-1.5 uppercase tracking-wider">
                Genre
              </label>
              <select
                value={genreParam}
                onChange={(e) => updateParam('genre', e.target.value)}
                className="w-full bg-light-100/5 border border-light-100/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#AB8BFF] transition-colors"
              >
                <option value="">All Genres</option>
                {filterGenres.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Year */}
            <div>
              <label className="block text-xs font-medium text-gray-100 mb-1.5 uppercase tracking-wider">
                Year
              </label>
              <select
                value={yearParam}
                onChange={(e) => updateParam('year', e.target.value)}
                className="w-full bg-light-100/5 border border-light-100/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#AB8BFF] transition-colors"
              >
                <option value="">Any Year</option>
                {YEAR_RANGE.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-xs font-medium text-gray-100 mb-1.5 uppercase tracking-wider">
                Sort By
              </label>
              <select
                value={sortParam}
                onChange={(e) => updateParam('sort', e.target.value)}
                className="w-full bg-light-100/5 border border-light-100/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#AB8BFF] transition-colors"
              >
                {activeSortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(searchQuery || genreParam || yearParam || mediaTypeParam) && (
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-light-100/10">
              <span className="text-gray-100 text-xs">Active view:</span>
              <span className="bg-gradient-to-r from-[#D6C7FF]/20 to-[#AB8BFF]/20 text-light-100 text-xs px-3 py-1 rounded-full border border-light-100/10">
                {selectedMediaLabel}
              </span>
              {activeGenre && (
                <span className="bg-gradient-to-r from-[#D6C7FF]/20 to-[#AB8BFF]/20 text-light-100 text-xs px-3 py-1 rounded-full border border-light-100/10">
                  Genre: {activeGenre.name}
                </span>
              )}
              {yearParam && (
                <span className="bg-gradient-to-r from-[#D6C7FF]/20 to-[#AB8BFF]/20 text-light-100 text-xs px-3 py-1 rounded-full border border-light-100/10">
                  Year: {yearParam}
                </span>
              )}
              <button
                onClick={() => navigate('/browse', { replace: true })}
                className="text-xs text-[#AB8BFF] hover:underline ml-2"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner />
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
            <p className="text-red-400">{error}</p>
            <button
              onClick={fetchContent}
              className="mt-4 text-sm text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-20">
            <svg className="h-16 w-16 text-gray-600 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
            </svg>
            <p className="text-gray-400 text-lg">No results found</p>
            <p className="text-gray-500 text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            {!debouncedSearch && (
              <>
                {(mediaTypeParam === 'movie' || mediaTypeParam === '') && renderUpcomingRow({
                  mediaType: 'movie',
                  title: 'Upcoming Movies',
                  description: 'Movies releasing soon',
                  scrollRef: upcomingMovieScrollRef,
                })}
                {(mediaTypeParam === 'tv' || mediaTypeParam === '') && renderUpcomingRow({
                  mediaType: 'tv',
                  title: 'Upcoming TV Shows',
                  description: 'TV shows airing soon',
                  scrollRef: upcomingTVScrollRef,
                })}
              </>
            )}

            {isBrowseRowsMode ? (
              <section className="space-y-6">
                {browseRows.slice(0, 5).map((category) => (
                  <GenreRow
                    key={category.key}
                    genreId={category.id}
                    genreName={category.name}
                    mediaType={category.mediaType}
                    endpoint={category.endpoint}
                    discoverParams={category.discoverParams}
                    browseTo={category.browseTo}
                  />
                ))}

                <div className="py-4">
                  <AdBanner format="leaderboard" />
                </div>

                {browseRows.slice(5, 10).map((category) => (
                  <GenreRow
                    key={category.key}
                    genreId={category.id}
                    genreName={category.name}
                    mediaType={category.mediaType}
                    endpoint={category.endpoint}
                    discoverParams={category.discoverParams}
                    browseTo={category.browseTo}
                  />
                ))}

                <div className="py-4">
                  <AdBanner format="leaderboard" />
                </div>

                {browseRows.slice(10).map((category) => (
                  <GenreRow
                    key={category.key}
                    genreId={category.id}
                    genreName={category.name}
                    mediaType={category.mediaType}
                    endpoint={category.endpoint}
                    discoverParams={category.discoverParams}
                    browseTo={category.browseTo}
                  />
                ))}
              </section>
            ) : (
              <section>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <h2 className="!text-xl !mb-0">{pageTitle}</h2>
                  {isGridMode && (
                    <span className="text-gray-400 text-sm">{results.filter((item) => item.media_type !== 'person').length} titles</span>
                  )}
                </div>

                <div className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 xs:gap-4">
                  {results
                    .filter((item) => item.media_type !== 'person')
                    .map((item) => {
                      const type = item.media_type || mediaTypeParam || 'movie';
                      return (
                        <MovieCard
                          key={`${type}-${item.id}`}
                          movie={item}
                          mediaType={type}
                          onClick={() => {
                            if (type === 'tv') {
                              navigate(`/tv/${item.id}`);
                            } else {
                              navigate(`/movie/${item.id}`);
                            }
                          }}
                        />
                      );
                    })}
                </div>

                {!genreParam && totalPages > 1 && (
                  <div className="pagination">
                    <button
                      onClick={() => changePage(-1)}
                      disabled={pageParam <= 1}
                    >
                      ‹ Prev
                    </button>

                    <span className="text-sm text-gray-400 px-2">
                      {pageParam} / {totalPages}
                    </span>

                    <button
                      onClick={() => changePage(1)}
                      disabled={pageParam >= totalPages}
                    >
                      Next ›
                    </button>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </PageLayout>
    </>
  );
};

export default BrowsePage;
