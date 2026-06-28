import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import Spinner from '../components/Spinner';
import SEO from '../components/SEO';
import AdBanner from '../components/AdBanner';
import PageLayout from '../components/layout/PageLayout';
import PageHeader from '../components/layout/PageHeader';
import { ALL_GENRES } from '../utils/categories';

const API_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`,
  },
};

const GENRES = ALL_GENRES;

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

const GenrePage = () => {
  const { genreId } = useParams();
  const [mediaType, setMediaType] = useState('movie');
  const [sortBy, setSortBy] = useState('popularity.desc');
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const genre = GENRES.find((g) => g.id === Number(genreId));
  const genreName = genre?.name || 'Unknown Genre';

  useEffect(() => {
    const fetchByGenre = async () => {
      setIsLoading(true);
      try {
        const endpoint = mediaType === 'movie'
          ? `${API_BASE_URL}/discover/movie`
          : `${API_BASE_URL}/discover/tv`;

        // Fetch 10 pages in parallel for maximum content
        const promises = Array.from({ length: 10 }).map((_, i) =>
          fetch(`${endpoint}?with_genres=${genreId}&sort_by=${sortBy}&page=${i + 1}&include_adult=false`, API_OPTIONS)
            .then(r => r.json())
        );

        const responses = await Promise.all(promises);
        const allItems = responses.flatMap(r => r.results || []);

        // Deduplicate by ID
        const seen = new Set();
        const uniqueItems = allItems.filter(item => {
          if (seen.has(item.id)) return false;
          seen.add(item.id);
          return true;
        });

        setItems(uniqueItems);
      } catch (error) {
        console.log('Error fetching genre content:', error);
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (genreId) fetchByGenre();
  }, [genreId, mediaType, sortBy]);

  const handleItemClick = (item) => {
    const path = mediaType === 'movie'
      ? `/movie/${item.id}`
      : `/tv/${item.id}`;
    window.location.href = path;
  };

  const genreDescription = `Watch the best ${genreName} movies and TV shows online for free. Stream top-rated ${genreName} content in HD quality at CineVault.`;

  return (
    <>
      <SEO
        title={`${genreName} Movies & TV Shows — Watch Free Online`}
        description={genreDescription}
        url={`/genre/${genreId}`}
      />

      <PageLayout>
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6" aria-label="Breadcrumb">
          <Link to="/browse" className="hover:text-white transition-colors">Browse</Link>
          <span>/</span>
          <span className="text-white">{genreName}</span>
        </nav>

        <PageHeader
          title={`${genreName} ${mediaType === 'movie' ? 'Movies' : 'TV Shows'}`}
          description={genreDescription}
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

          {/* Genre quick links */}
          <div className="flex flex-wrap gap-2 ml-auto">
            {GENRES.slice(0, 12).map((g) => (
              <Link
                key={g.id}
                to={`/genre/${g.id}`}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${g.id === Number(genreId)
                  ? 'bg-[#AB8BFF] text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
              >
                {g.name}
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
            <p className="text-gray-400 text-xl">No {genreName} {mediaType === 'movie' ? 'movies' : 'TV shows'} found.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
              {items.map((item) => (
                <MovieCard
                  key={item.id}
                  movie={item}
                  onClick={() => handleItemClick(item)}
                />
              ))}
            </div>

          </>
        )}
      </PageLayout>
    </>
  );
};

export default GenrePage;