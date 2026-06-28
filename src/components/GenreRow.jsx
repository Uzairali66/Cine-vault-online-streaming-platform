import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`,
  },
};

const resolveDateParams = (params = {}) => {
  const today = new Date().toISOString().split('T')[0];

  return Object.entries(params).reduce((acc, [key, value]) => {
    acc[key] = value === 'today' ? today : value;
    return acc;
  }, {});
};

const GenreRow = ({ genreId, genreName, mediaType = 'movie', endpoint, discoverParams, browseTo }) => {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScrollPosition = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const maxScrollLeft = Math.max(0, scrollWidth - clientWidth);
      setHasOverflow(maxScrollLeft > 8);
      setShowLeftArrow(scrollLeft > 8);
      setShowRightArrow(scrollLeft < maxScrollLeft - 8);
    }
  };

  useEffect(() => {
    const fetchRowItems = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ page: '1' });

        if (endpoint) {
          const res = await fetch(`${API_BASE_URL}${endpoint}?${params.toString()}`, API_OPTIONS);
          if (res.ok) {
            const data = await res.json();
            const filtered = (data.results || [])
              .filter((item) => item.poster_path)
              .slice(0, 20);
            setItems(filtered.map((item) => ({ ...item, media_type: mediaType })));
          }
          return;
        }

        const resolvedParams = resolveDateParams(discoverParams);
        Object.entries({ sort_by: 'popularity.desc', ...resolvedParams }).forEach(([key, value]) => {
          if (value) params.set(key, value);
        });
        if (genreId) params.set('with_genres', genreId);
        params.set('with_original_language', 'en');

        const res = await fetch(`${API_BASE_URL}/discover/${mediaType}?${params.toString()}`, API_OPTIONS);
        if (res.ok) {
          const data = await res.json();
          const filtered = (data.results || [])
            .filter((item) => item.poster_path)
            .slice(0, 20);
          setItems(filtered.map((item) => ({ ...item, media_type: mediaType })));
        }
      } catch (err) {
        console.error(`Error fetching ${genreName} ${mediaType}:`, err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRowItems();
  }, [genreId, mediaType, genreName, endpoint, discoverParams]);

  useEffect(() => {
    // Check initial scroll position after items have loaded
    if (!isLoading && items.length > 0) {
      const timer = setTimeout(checkScrollPosition, 150);
      return () => clearTimeout(timer);
    }
  }, [isLoading, items]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      const updateScrollState = () => {
        window.requestAnimationFrame(checkScrollPosition);
      };

      updateScrollState();
      el.addEventListener('scroll', updateScrollState, { passive: true });
      window.addEventListener('resize', updateScrollState);

      const resizeObserver = typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(updateScrollState)
        : null;

      if (resizeObserver) {
        resizeObserver.observe(el);
      }

      return () => {
        el.removeEventListener('scroll', updateScrollState);
        window.removeEventListener('resize', updateScrollState);
        resizeObserver?.disconnect();
      };
    }
  }, [items]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const amount = scrollRef.current.clientWidth * 0.75;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -amount : amount,
        behavior: 'smooth',
      });
      // Re-check after animation completes
      setTimeout(checkScrollPosition, 400);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      if (scrollRef.current) {
        const amount = scrollRef.current.clientWidth * 0.75;
        scrollRef.current.scrollBy({
          left: e.key === 'ArrowLeft' ? -amount : amount,
          behavior: 'smooth',
        });
        setTimeout(checkScrollPosition, 400);
      }
    }
  };

  if (!isLoading && items.length === 0) return null;

  return (
    <div className="mb-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg sm:text-xl font-bold text-white">{genreName}</h2>
        <button
          onClick={() => navigate(browseTo || `/browse?mediaType=${mediaType}&genre=${genreId}`)}
          className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors"
        >
          Explore All →
        </button>
      </div>

      {/* Row */}
      {isLoading ? (
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[140px] xs:w-[160px] sm:w-[180px] animate-pulse"
            >
              <div className="aspect-[2/3] rounded-lg bg-white/5 mb-2" />
              <div className="h-3 bg-white/5 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="relative group">
          {/* Left Scroll Button */}
          {hasOverflow && (
            <button
              onClick={() => scroll('left')}
              disabled={!showLeftArrow}
              className={`absolute left-0 top-0 bottom-0 z-10 w-10 sm:w-12 bg-gradient-to-r from-black/85 to-transparent transition-opacity duration-300 flex items-center justify-start pl-1.5 sm:pl-2 border-none outline-none ${showLeftArrow
                ? 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer'
                : 'opacity-0 pointer-events-none'
                }`}
              aria-label={`Scroll ${genreName} left`}
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Scrollable Row */}
          <div
            ref={scrollRef}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            className="overflow-x-auto pb-2 -mx-2 px-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent scroll-smooth overscroll-x-contain outline-none"
          >
            <div className="flex flex-nowrap gap-2 sm:gap-3 min-w-max">
              {items.map((item) => {
                const posterUrl = `https://image.tmdb.org/t/p/w342${item.poster_path}`;
                const title = item.title || item.name;
                const date = item.release_date || item.first_air_date || '';
                const year = date ? date.split('-')[0] : '';
                const rating = item.vote_average ? item.vote_average.toFixed(1) : null;

                return (
                  <div
                    key={`${mediaType}-${genreId || endpoint || genreName}-${item.id}`}
                    onClick={() => navigate(`/${mediaType}/${item.id}`)}
                    className="flex-shrink-0 w-[140px] xs:w-[160px] sm:w-[180px] cursor-pointer group/card transition-transform duration-200 hover:scale-105"
                  >
                    <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-white/5 mb-1.5 sm:mb-2">
                      <img
                        src={posterUrl}
                        alt={title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {/* Hover overlay with play icon */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-red-600/90 flex items-center justify-center">
                          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                      {/* Rating badge */}
                      {rating && (
                        <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 bg-black/70 backdrop-blur-sm rounded-md px-1.5 py-0.5 flex items-center gap-0.5 sm:gap-1">
                          <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-white text-[10px] sm:text-xs font-medium">{rating}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-white text-xs sm:text-sm font-medium truncate leading-tight group-hover/card:text-red-500 transition-colors">
                      {title}
                    </p>
                    {year && (
                      <p className="text-gray-500 text-[10px] sm:text-xs mt-0.5">{year}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Scroll Button */}
          {hasOverflow && (
            <button
              onClick={() => scroll('right')}
              disabled={!showRightArrow}
              className={`absolute right-0 top-0 bottom-0 z-10 w-10 sm:w-12 bg-gradient-to-l from-black/85 to-transparent transition-opacity duration-300 flex items-center justify-end pr-1.5 sm:pr-2 border-none outline-none ${showRightArrow
                ? 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer'
                : 'opacity-0 pointer-events-none'
                }`}
              aria-label={`Scroll ${genreName} right`}
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default GenreRow;
