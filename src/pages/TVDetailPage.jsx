import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import PlayerModal from '../components/PlayerModal';
import AdBanner from '../components/AdBanner';
import AffiliateLinks from '../components/AffiliateLinks';
import SEO from '../components/SEO';
import PageLayout from '../components/layout/PageLayout';
import BackLink from '../components/layout/BackLink';
import ContentWithSidebar from '../components/layout/ContentWithSidebar';
import { triggerPopUnder } from '../components/PopUnderAd';
import { tmdbFetch } from '../utils/tmdb';

const TVDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [show, setShow] = useState(null);
  const [credits, setCredits] = useState(null);
  const [trailerKey, setTrailerKey] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);

  useEffect(() => {
    const fetchTVDetails = async () => {
      setIsLoading(true);
      try {
        const [showData, creditsData, videosData] = await Promise.all([
          tmdbFetch(`/tv/${id}`),
          tmdbFetch(`/tv/${id}/credits`),
          tmdbFetch(`/tv/${id}/videos`),
        ]);

        setShow(showData);
        setCredits(creditsData);

        const trailer = videosData.results?.find(
          (v) => v.type === 'Trailer' && v.site === 'YouTube'
        );
        if (trailer) setTrailerKey(trailer.key);

      } catch (error) {
        console.log('Error fetching TV show details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTVDetails();
  }, [id]);

  if (isLoading) {
    return (
      <PageLayout>
        <SEO title="Loading..." />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-white text-xl">Loading TV show details...</div>
        </div>
      </PageLayout>
    );
  }

  if (!show) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-white text-xl">TV show not found.</div>
        </div>
      </PageLayout>
    );
  }

  const creator = show.created_by?.[0];
  const topCast = credits?.cast?.slice(0, 6) || [];

  return (
    <>
      <SEO
        title={show?.name || 'TV Show Details'}
        description={show?.overview?.slice(0, 160) || 'Watch free TV shows online at CineVault.'}
        image={show?.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : undefined}
        url={`/tv/${id}`}
        publishedTime={show?.first_air_date}
      />
      <PageLayout>
        <BackLink className="mb-8" />

        <ContentWithSidebar
          sidebar={
            <>
              <AdBanner format="sidebar" />
              <AffiliateLinks movieTitle={show.name} />
            </>
          }
        >
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
            <div className="flex-shrink-0 w-full max-w-[350px] mx-auto lg:mx-0 lg:w-[350px]">
              <img
                src={show.poster_path
                  ? `https://image.tmdb.org/t/p/w342${show.poster_path}`
                  : '/no-movie.png'}
                loading="lazy"
                alt={show.name}
                className="w-full rounded-2xl shadow-2xl"
              />
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="page-title page-title--left">{show.name}</h1>

              {/* Meta Row */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                {show.first_air_date && (
                  <span className="bg-light-100/10 text-light-200 px-3 py-1 rounded-full text-sm">
                    {show.first_air_date.split('-')[0]}
                  </span>
                )}
                {show.number_of_seasons > 0 && (
                  <span className="bg-light-100/10 text-light-200 px-3 py-1 rounded-full text-sm">
                    {show.number_of_seasons} {show.number_of_seasons === 1 ? 'Season' : 'Seasons'}
                  </span>
                )}
                {show.vote_average > 0 && (
                  <span className="bg-light-100/10 text-light-200 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    <img src="/star.svg" alt="star" className="w-4 h-4" />
                    {show.vote_average.toFixed(1)}
                  </span>
                )}
                {show.original_language && (
                  <span className="bg-light-100/10 text-light-200 px-3 py-1 rounded-full text-sm uppercase">
                    {show.original_language}
                  </span>
                )}
                {show.status && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${show.status === 'Ended'
                    ? 'bg-red-500/10 text-red-400'
                    : show.status === 'Returning Series'
                      ? 'bg-green-500/10 text-green-400'
                      : 'bg-blue-500/10 text-blue-400'
                    }`}>
                    {show.status}
                  </span>
                )}
              </div>

              {/* Genres */}
              {show.genres?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {show.genres.map((genre) => (
                    <Link
                      key={genre.id}
                      to={`/genre/${genre.id}`}
                      className="bg-gradient-to-r from-[#D6C7FF]/20 to-[#AB8BFF]/20 text-light-100 px-4 py-1.5 rounded-full text-sm font-medium border border-light-100/10 hover:from-[#D6C7FF]/40 hover:to-[#AB8BFF]/40 hover:text-white transition-all duration-200"
                    >
                      {genre.name}
                    </Link>
                  ))}
                </div>
              )}

              {/* Watch / Trailer Buttons */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                {/* Watch Now Button */}
                <button
                  onClick={() => {
                    triggerPopUnder();
                    navigate(`/watch/tmdb/${id}?mediaType=tv`);
                  }}
                  className="bg-gradient-to-r from-[#D6C7FF] to-[#AB8BFF] text-dark-100 font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity duration-200 flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  Watch Now
                </button>

                {/* Trailer Button */}
                {trailerKey && (
                  <button
                    onClick={() => setShowTrailer(true)}
                    className="bg-light-100/10 text-light-200 hover:text-white font-bold px-6 py-3 rounded-xl hover:bg-light-100/20 transition-all duration-200 flex items-center gap-2 border border-light-100/10"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0114 8v4a1 1 0 01.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                    Watch Trailer
                  </button>
                )}
              </div>

              {/* Overview */}
              <div className="mb-8">
                <h2 className="!text-xl mb-3">Overview</h2>
                <p className="text-light-200 text-base leading-relaxed">
                  {show.overview || 'No overview available for this TV show.'}
                </p>
              </div>

              {/* Creator */}
              {creator && (
                <div className="mb-6">
                  <h2 className="!text-xl mb-2">Created By</h2>
                  <p className="text-light-200">{creator.name}</p>
                </div>
              )}

              {/* Networks */}
              {show.networks?.length > 0 && (
                <div className="mb-6">
                  <h2 className="!text-xl mb-2">Network</h2>
                  <p className="text-light-200">
                    {show.networks.map((n) => n.name).join(', ')}
                  </p>
                </div>
              )}

              {/* Additional Info */}
              <div className="flex flex-wrap gap-8 mb-6">
                {show.number_of_seasons > 0 && (
                  <div>
                    <h2 className="!text-xl mb-2">Seasons</h2>
                    <p className="text-light-200">{show.number_of_seasons}</p>
                  </div>
                )}
                {show.number_of_episodes > 0 && (
                  <div>
                    <h2 className="!text-xl mb-2">Episodes</h2>
                    <p className="text-light-200">{show.number_of_episodes}</p>
                  </div>
                )}
                {show.episode_run_time?.[0] > 0 && (
                  <div>
                    <h2 className="!text-xl mb-2">Runtime</h2>
                    <p className="text-light-200">{show.episode_run_time[0]} min/episode</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cast Section */}
          {topCast.length > 0 && (
            <section className="page-section mt-12 lg:mt-16">
              <h2 className="page-section-title !text-2xl sm:!text-3xl">Top Cast</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
                {topCast.map((actor) => (
                  <div key={actor.id} className="bg-dark-100 rounded-2xl p-4 text-center shadow-inner shadow-light-100/10">
                    <img
                      src={actor.profile_path
                        ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
                        : '/no-movie.png'}
                      loading="lazy"
                      alt={actor.name}
                      className="w-20 h-20 object-cover rounded-full mx-auto mb-3"
                    />
                    <p className="text-white font-semibold text-sm line-clamp-1">{actor.name}</p>
                    <p className="text-gray-100 text-xs mt-1 line-clamp-1">{actor.character}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </ContentWithSidebar>
      </PageLayout>

      <PlayerModal
        isOpen={showTrailer}
        trailerKey={trailerKey}
        onClose={() => setShowTrailer(false)}
        movieTitle={`${show.name} — Trailer`}
      />
    </>
  );
};

export default TVDetailPage;