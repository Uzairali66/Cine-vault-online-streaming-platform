import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Search from '../components/Search';
import Spinner from '../components/Spinner';
import MovieCard from '../components/MovieCard';
import AdBanner from '../components/AdBanner';
import SEO from '../components/SEO';
import GenreRow from '../components/GenreRow';
import PageLayout from '../components/layout/PageLayout';
import { useDebounce } from 'react-use';
import { updateSearchCount } from '../appwrite';
import { fetchKoreanContent } from '../utils/languages';
import { ALL_GENRES, MOVIE_CATEGORY_ROWS, MOVIE_GENRES, TV_CATEGORY_ROWS, TV_GENRES } from '../utils/categories';
import { useWatchHistory } from '../hooks/useWatchHistory';
import { tmdbFetch } from '../utils/tmdb';

const getActiveGenres = (mediaType) => {
  if (mediaType === 'tv') return TV_GENRES;
  if (mediaType === 'all') return ALL_GENRES;
  return MOVIE_GENRES;
};

const getCategoryRows = (mediaType) => {
  if (mediaType === 'tv') return TV_CATEGORY_ROWS;
  if (mediaType === 'all') return [...MOVIE_CATEGORY_ROWS.slice(0, 8), ...TV_CATEGORY_ROWS.slice(0, 8)];
  return MOVIE_CATEGORY_ROWS;
};

const MOVIE_SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Most Popular' },
  { value: 'vote_average.desc', label: 'Highest Rated' },
  { value: 'primary_release_date.desc', label: 'Newest First' },
  { value: 'primary_release_date.asc', label: 'Oldest First' },
];

const TV_SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Most Popular' },
  { value: 'vote_average.desc', label: 'Highest Rated' },
  { value: 'first_air_date.desc', label: 'Newest First' },
  { value: 'first_air_date.asc', label: 'Oldest First' },
];

const YEAR_RANGE = [];
for (let y = new Date().getFullYear(); y >= 1900; y--) {
  YEAR_RANGE.push(y);
}

const HomePage = () => {
  const navigate = useNavigate();
  const historyScrollRef = useRef(null);
  const koreanScrollRef = useRef(null);

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
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [movieList, setMovieList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Korean content state
  const [koreanContent, setKoreanContent] = useState([]);
  const [isLoadingKorean, setIsLoadingKorean] = useState(false);

  // Watch history
  const { history: watchHistory, hasHistory } = useWatchHistory();

  // Filter state
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [mediaType, setMediaType] = useState('all');
  const [selectedSort, setSelectedSort] = useState(MOVIE_SORT_OPTIONS[0].value);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const activeGenres = getActiveGenres(mediaType);
  const categoryRows = getCategoryRows(mediaType);
  const sortOptions = mediaType === 'tv' ? TV_SORT_OPTIONS : MOVIE_SORT_OPTIONS;

  useDebounce(() => setDebouncedSearchTerm(searchTerm), 500, [searchTerm]);

  const fetchMovies = async (query = '', page = 1) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      let data;

      if (query) {
        // Search mode
        const searchParams = { query, page };
        if (mediaType === 'all') {
          data = await tmdbFetch('/search/multi', searchParams);
        } else {
          if (selectedYear) {
            searchParams[mediaType === 'tv' ? 'first_air_date_year' : 'year'] = selectedYear;
          }
          data = await tmdbFetch(`/search/${mediaType}`, searchParams);
        }
      } else if (mediaType === 'all') {
        // Discover mode — fetch movies AND TV shows simultaneously, then merge
        const movieParams = { sort_by: selectedSort, page };
        const tvParams = { sort_by: selectedSort, page };
        if (selectedGenre) {
          movieParams.with_genres = selectedGenre;
          tvParams.with_genres = selectedGenre;
        }
        if (selectedYear) {
          movieParams.primary_release_year = selectedYear;
          tvParams.first_air_date_year = selectedYear;
        }

        const [movieData, tvData] = await Promise.all([
          tmdbFetch('/discover/movie', movieParams),
          tmdbFetch('/discover/tv', tvParams),
        ]);

        // Tag each result with media_type since discover endpoints don't include it
        const taggedMovies = (movieData.results || []).map((item) => ({
          ...item,
          media_type: 'movie',
        }));
        const taggedTV = (tvData.results || []).map((item) => ({
          ...item,
          media_type: 'tv',
        }));

        data = {
          results: [...taggedMovies, ...taggedTV].sort(
            (a, b) => (b.popularity || 0) - (a.popularity || 0)
          ),
          total_pages: Math.max(movieData.total_pages || 1, tvData.total_pages || 1),
        };
      } else {
        // Discover mode — single type (movie or tv)
        const params = { sort_by: selectedSort, page };
        if (selectedGenre) params.with_genres = selectedGenre;
        const yearKey = mediaType === 'tv' ? 'first_air_date_year' : 'primary_release_year';
        if (selectedYear) params[yearKey] = selectedYear;

        data = await tmdbFetch(`/discover/${mediaType}`, params);
      }

      if (data.response === 'False') {
        setErrorMessage(data.Error || 'Failed to fetch movies');
        setMovieList([]);
        return;
      }

      // Filter multi results to only movies and TV shows
      let results = data.results || [];
      if (mediaType === 'all') {
        results = results.filter(item => item.media_type === 'movie' || item.media_type === 'tv');
      }

      // Store total pages (TMDB caps at 500)
      setTotalPages(Math.min(data.total_pages || 1, 500));

      if (query && results.length > 0) {
        await updateSearchCount(query, results[0]);
      }

      setMovieList(results);

    } catch (error) {
      console.log(`Error fetching movies ${error}`);
      setErrorMessage('Error fetching movies. Please try again later');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    setSelectedSort(mediaType === 'tv' ? TV_SORT_OPTIONS[0].value : MOVIE_SORT_OPTIONS[0].value);
  }, [mediaType]);

  useEffect(() => {
    fetchMovies(debouncedSearchTerm, currentPage);
  }, [debouncedSearchTerm, selectedGenre, selectedYear, selectedSort, mediaType, currentPage]);

  // Fetch Korean content on mount
  useEffect(() => {
    const loadKorean = async () => {
      setIsLoadingKorean(true);
      const results = await fetchKoreanContent(1);
      setKoreanContent(results.slice(0, 20));
      setIsLoadingKorean(false);
    };
    loadKorean();
  }, []);

  const isBrowsing = !debouncedSearchTerm && !selectedGenre && !selectedYear;

  return (
    <>
      <SEO
        title="CineVault - Browse Free Movies & TV Shows"
        description="Search and browse thousands of free movies and TV shows. Filter by genre, year, rating and more on CineVault."
        url="/home"
        type="website"
      />
      <PageLayout>
        <header className="hero-header">
          <img src="./hero.png" alt="hero image" />
          <h1>Find <span className='text-gradient'>Movies</span> & <span className='text-gradient'>TV Shows</span> You'll Enjoy</h1>
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm}></Search>
        </header>

        {/* === Continue Watching Section === */}
        {hasHistory && !debouncedSearchTerm && (
          <section className="mb-8 mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="!text-xl !mb-0 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#AB8BFF]" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                Continue Watching
              </h2>
              <button
                onClick={() => navigate('/browse')}
                className="text-sm text-[#AB8BFF] hover:underline"
              >
                Browse All →
              </button>
            </div>
            <div
              ref={historyScrollRef}
              onKeyDown={handleRowKeyDown(historyScrollRef)}
              tabIndex={0}
              className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-thin scrollbar-thumb-gray-700 outline-none"
            >
              {watchHistory.slice(0, 10).map((item) => (
                <div
                  key={`${item.mediaType}-${item.id}`}
                  className="flex-shrink-0 w-[160px] sm:w-[180px] cursor-pointer hover:scale-[1.04] transition-all duration-300"
                  onClick={() => {
                    navigate(`/watch/tmdb/${item.id}${item.mediaType === 'tv' ? '?mediaType=tv' : ''}`);
                  }}
                >
                  <div className="relative">
                    <img
                      src={item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : '/no-movie.png'}
                      alt={item.title || item.name}
                      loading="lazy"
                      className="w-full rounded-xl shadow-lg"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-xl" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-white text-xs font-medium line-clamp-2 drop-shadow-lg">
                        {item.title || item.name}
                      </p>
                      {item.season && (
                        <p className="text-gray-300 text-[10px] mt-0.5">
                          S{item.season}:E{item.episode}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* === Korean Content Section (below search, above filters) === */}
        {koreanContent.length > 0 && (
          <section className="mb-8 mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="!text-xl !mb-0 flex items-center gap-2">
                <span>🇰🇷 Korean Movies & K-Dramas</span>
                <span className="text-xs bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full border border-violet-500/30">
                  Popular
                </span>
              </h2>
              <button
                onClick={() => {
                  setMediaType('all');
                  setSearchTerm('');
                  setSelectedGenre('');
                  setSelectedYear('');
                }}
                className="text-sm text-[#AB8BFF] hover:underline"
              >
                View All →
              </button>
            </div>
            {isLoadingKorean ? (
              <div className="flex items-center gap-3 text-gray-400 text-sm py-8">
                <svg className="animate-spin h-5 w-5 text-[#AB8BFF]" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Loading Korean content...
              </div>
            ) : (
              <div
                ref={koreanScrollRef}
                onKeyDown={handleRowKeyDown(koreanScrollRef)}
                tabIndex={0}
                className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-thin scrollbar-thumb-gray-700 outline-none"
              >
                {koreanContent.map((item) => (
                  <div
                    key={`${item.media_type}-${item.id}`}
                    className="flex-shrink-0 w-[160px] sm:w-[180px] cursor-pointer hover:scale-[1.04] transition-all duration-300"
                    onClick={() => {
                      navigate(`/${item.media_type === 'tv' ? 'tv' : 'movie'}/${item.id}`);
                    }}
                  >
                    <div className="relative">
                      <img
                        src={item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : '/no-movie.png'}
                        alt={item.title || item.name}
                        loading="lazy"
                        className="w-full rounded-xl shadow-lg"
                      />
                      <div className="absolute top-2 left-2 flex gap-1">
                        <span className="bg-violet-500/80 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                          {item.media_type === 'tv' ? 'K-Drama' : 'Film'}
                        </span>
                      </div>
                    </div>
                    <p className="text-white text-sm mt-2 font-medium line-clamp-1">
                      {item.title || item.name}
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {item.vote_average ? `★ ${item.vote_average.toFixed(1)}` : ''}
                      {item.first_air_date ? ` • ${item.first_air_date.split('-')[0]}` : ''}
                      {item.release_date ? ` • ${item.release_date.split('-')[0]}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Filter Controls */}
        <section className="mt-8">
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
            <h2 className="!text-xl !mb-0">
              {debouncedSearchTerm
                ? `Results for "${debouncedSearchTerm}"`
                : mediaType === 'tv' ? 'TV Shows' : mediaType === 'all' ? 'Movies & TV Shows' : 'Movies'}
            </h2>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
              {/* Media Type Toggle */}
              <div className="flex bg-light-100/10 rounded-lg p-0.5 flex-1 sm:flex-none min-w-[180px]">
                {['movie', 'tv', 'all'].map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setMediaType(type);
                      setCurrentPage(1);
                    }}
                    className={`flex-1 sm:flex-none px-3 py-2 sm:py-1.5 text-xs rounded-md transition-colors ${mediaType === type
                      ? 'bg-[#AB8BFF] text-white'
                      : 'text-gray-400 hover:text-white'
                      }`}
                  >
                    {type === 'movie' ? 'Movies' : type === 'tv' ? 'TV' : 'All'}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center justify-center gap-2 bg-light-100/10 hover:bg-light-100/20 text-light-200 px-4 py-2 rounded-lg text-sm transition-colors flex-1 sm:flex-none min-h-10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                </svg>
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="bg-dark-100 rounded-2xl p-5 shadow-inner shadow-light-100/10 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Genre Filter */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Genre</label>
                  <select
                    value={selectedGenre}
                    onChange={(e) => {
                      setSelectedGenre(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full bg-light-100/5 border border-light-100/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#AB8BFF] transition-colors"
                  >
                    <option value="">All Genres</option>
                    {activeGenres.map((genre) => (
                      <option key={genre.id} value={genre.id}>{genre.name}</option>
                    ))}
                  </select>
                </div>

                {/* Year Filter */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Release Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => {
                      setSelectedYear(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full bg-light-100/5 border border-light-100/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#AB8BFF] transition-colors"
                  >
                    <option value="">All Years</option>
                    {YEAR_RANGE.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                {/* Sort */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Sort By</label>
                  <select
                    value={selectedSort}
                    onChange={(e) => {
                      setSelectedSort(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full bg-light-100/5 border border-light-100/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#AB8BFF] transition-colors"
                  >
                    {sortOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Active Filters Summary */}
              {(selectedGenre || selectedYear) && (
                <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-light-100/10">
                  <span className="text-gray-100 text-xs">Active filters:</span>
                  {selectedGenre && (
                    <span className="bg-gradient-to-r from-[#D6C7FF]/20 to-[#AB8BFF]/20 text-light-100 text-xs px-3 py-1 rounded-full border border-light-100/10">
                      Genre: {activeGenres.find(g => g.id === Number(selectedGenre))?.name}
                    </span>
                  )}
                  {selectedYear && (
                    <span className="bg-gradient-to-r from-[#D6C7FF]/20 to-[#AB8BFF]/20 text-light-100 text-xs px-3 py-1 rounded-full border border-light-100/10">
                      Year: {selectedYear}
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setSelectedGenre('');
                      setSelectedYear('');
                      setSelectedSort(mediaType === 'tv' ? TV_SORT_OPTIONS[0].value : MOVIE_SORT_OPTIONS[0].value);
                      setCurrentPage(1);
                    }}
                    className="text-xs text-[#AB8BFF] hover:underline ml-2"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>
          )}

        </section>

        {/* Content Area */}
        <div className="flex flex-col lg:flex-row gap-8 mt-6">
          {/* Main Content */}
          <section className="all-movies flex-1 min-w-0">
            {debouncedSearchTerm || selectedGenre || selectedYear ? (
              /* SEARCH / FILTER MODE — Show grid results */
              <>
                {isLoading ? (
                  <Spinner />
                ) : errorMessage ? (
                  <p className="text-red-500">{errorMessage}</p>
                ) : (
                  <>
                    <ul>
                      {movieList.map((movie) => (
                        <MovieCard
                          key={movie.id}
                          movie={movie}
                          mediaType={movie.media_type || mediaType}
                          onClick={() => {
                            const type = movie.media_type || mediaType;
                            if (type === 'tv') {
                              navigate(`/tv/${movie.id}`);
                            } else {
                              navigate(`/movie/${movie.id}`);
                            }
                          }}
                        />
                      ))}
                    </ul>

                    {/* Pagination */}
                    {movieList.length > 0 && totalPages > 1 && (
                      <div className="pagination">
                        <button
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage <= 1}
                        >
                          ‹ Prev
                        </button>
                        <span className="text-sm text-gray-400 px-2">
                          {currentPage} / {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage >= totalPages}
                        >
                          Next ›
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              /* BROWSE MODE — Netflix-style genre category rows (full width, no sidebar) */
              <div className="space-y-6">
                {categoryRows.slice(0, 5).map((category) => (
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

                {/* Horizontal Leaderboard Ad */}
                <div className="py-4">
                  <AdBanner format="leaderboard" />
                </div>

                {categoryRows.slice(5, 10).map((category) => (
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

                {/* Second Horizontal Leaderboard Ad */}
                <div className="py-4">
                  <AdBanner format="leaderboard" />
                </div>

                {categoryRows.slice(10).map((category) => (
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
              </div>
            )}
          </section>

          {/* Sidebar — ONLY shown during search/filter mode */}
          {(debouncedSearchTerm || selectedGenre || selectedYear) && (
            <aside className="w-full lg:w-[280px] flex-shrink-0 space-y-6">
              <AdBanner format="sidebar" />
              <AdBanner format="sidebar" />
            </aside>
          )}
        </div>
      </PageLayout>
    </>
  );
}

export default HomePage;
