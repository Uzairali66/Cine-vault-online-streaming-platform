import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import Spinner from '../components/Spinner';
import SEO from '../components/SEO';
import AdBanner from '../components/AdBanner';
import PageLayout from '../components/layout/PageLayout';
import PageHeader from '../components/layout/PageHeader';
import { tmdbFetch } from '../utils/tmdb';

const MEDIA_TABS = [
  { value: 'movie', label: 'Movies' },
  { value: 'tv', label: 'TV Shows' },
];

const SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Most Popular' },
  { value: 'vote_average.desc', label: 'Highest Rated' },
  { value: 'release_date.desc', label: 'Newest' },
  { value: 'release_date.asc', label: 'Oldest' },
];

// Generate year quick-links (current year back ~15 years).
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_LINKS = Array.from({ length: 16 }, (_, i) => CURRENT_YEAR - i);

const YearPage = () => {
  const { year } = useParams();
  const [mediaType, setMediaType] = useState('movie');
  const [sortBy, setSortBy] = useState('popularity.desc');
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const yearNum = Number(year);
  const isValidYear = Number.isInteger(yearNum) && yearNum >= 1900 && yearNum <= CURRENT_YEAR + 1;

  useEffect(() => {
    if (!isValidYear) return;

    let cancelled = false;
    const fetchByYear = async () => {
      if (cancelled) return;
      setIsLoading(true);
      try {
        // Build primary + date filter. TV uses first_air_date_year.
        const dateKey =
          mediaType === 'movie' ? 'primary_release_year' : 'first_air_date_year';
        const baseParams = {
          [dateKey]: yearNum,
          sort_by: sortBy,
          include_adult: false,
          language: 'en-US',
        };

        // Fetch 10 pages in parallel for maximum content.
        const promises = Array.from({ length: 10 }).map((_, i) =>
          tmdbFetch(`/discover/${mediaType}`, { ...baseParams, page: i + 1 })
        );

        const responses = await Promise.all(promises);
        const allItems = responses.flatMap((r) => r.results || []);

        // Deduplicate by ID
        const seen = new Set();
        const uniqueItems = allItems.filter((item) => {
          if (seen.has(item.id)) return false;
          seen.add(item.id);
          return true;
        });

        setItems(uniqueItems);
      } catch (error) {
        console.log('Error fetching year content:', error);
        setItems([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchByYear();

    return () => {
      cancelled = true;
    };
  }, [year, mediaType, sortBy, isValidYear, yearNum]);

  const navigate = useNavigate();

  const handleItemClick = (item) => {
    const path = mediaType === 'movie' ? `/movie/${item.id}` : `/tv/${item.id}`;
    navigate(path);
  };

  const description = `Watch the best ${year} ${mediaType === 'movie' ? 'movies' : 'TV shows'} online for free. Stream new ${year} releases in HD quality at CineVault — no signup required.`;

  return (
    <>
      <SEO
        title={`${year} ${mediaType === 'movie' ? 'Movies' : 'TV Shows'} — Watch Free Online`}
        description={description}
        url={`/year/${year}`}
        tags={[`${year} movies`, `watch ${year} movies online`, `${year} tv shows`, `free streaming`]}
      />

      <PageLayout>
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6" aria-label="Breadcrumb">
          <Link to="/browse" className="hover:text-white transition-colors">Browse</Link>
          <span>/</span>
          <span className="text-white">Year {year}</span>
        </nav>

        <PageHeader
          title={`${year} ${mediaType === 'movie' ? 'Movies' : 'TV Shows'}`}
          description={description}
        />

        <div className="filter-panel flex flex-wrap items-center gap-4 mb-8">
          {/* Media Type Tabs */}
          <div className="flex items-center gap-1 bg-gray-900 rounded-xl p-1">
            {MEDIA_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setMediaType(tab.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${mediaType === tab.value
                  ? 'bg-gradient-to-r from-[#D6C7FF] to-[#AB8BFF] text-dark-100'
                  : 'text-gray-400 hover:text-white'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-gray-800 text-white px-4 py-2 rounded-xl border border-gray-700 focus:border-[#AB8BFF] outline-none text-sm"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Year quick links */}
          <div className="flex flex-wrap gap-2 ml-auto">
            {YEAR_LINKS.map((y) => (
              <Link
                key={y}
                to={`/year/${y}`}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${y === yearNum
                  ? 'bg-[#AB8BFF] text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
              >
                {y}
              </Link>
            ))}
          </div>
        </div>

        {/* Ad Banner — between Filters and Content Grid */}
        <section className="py-4 mb-6">
          <AdBanner format="leaderboard" />
        </section>

        {/* Content Grid */}
        {isLoading ? (
          <Spinner />
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-xl">No {mediaType === 'movie' ? 'movies' : 'TV shows'} found for {year}.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
            {items.map((item) => (
              <MovieCard
                key={item.id}
                movie={item}
                onClick={() => handleItemClick(item)}
              />
            ))}
          </div>
        )}
      </PageLayout>
    </>
  );
};

export default YearPage;
