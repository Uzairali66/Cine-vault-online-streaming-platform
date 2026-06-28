import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import AdBanner from '../components/AdBanner';
import SEO from '../components/SEO';
import ContentLocker from '../components/ContentLocker';
import { useAuth } from '../context/AuthContext';
import { getMovieById } from '../appwrite';
import { getSource, getSourceCount, getAllSourceNames } from '../sources';
import { useWatchHistory } from '../hooks/useWatchHistory';
import PopUnderAd, { triggerPopUnder } from '../components/PopUnderAd';
import ErrorBoundary from '../components/ErrorBoundary';
import PageLayout from '../components/layout/PageLayout';
import BackLink from '../components/layout/BackLink';
import { tmdbFetch } from '../utils/tmdb';

const WatchPage = () => {
  const { id, documentId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mediaType = searchParams.get('mediaType') === 'tv' ? 'tv' : 'movie';
  const { isPremium } = useAuth();

  const [movie, setMovie] = useState(null);
  const [embedUrl, setEmbedUrl] = useState(null);
  const [sourceName, setSourceName] = useState(null);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [sourceCount, setSourceCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAutoFailing, setIsAutoFailing] = useState(false);
  const [imdbId, setImdbId] = useState(null);
  const [lockerUnlocked, setLockerUnlocked] = useState(false);
  const [failedSources, setFailedSources] = useState(new Set());

  const [playerReady, setPlayerReady] = useState(false);
  const [playerError, setPlayerError] = useState(null);
  const [isMobileClient, setIsMobileClient] = useState(false);
  const [mobilePlayerKey, setMobilePlayerKey] = useState(0);
  const iframeRef = useRef(null);

  // Watch history
  const { addToHistory } = useWatchHistory();

  // Trigger popunder ad once on page load
  useEffect(() => {
    triggerPopUnder();
  }, []);

  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 767px)');
    const syncMobileState = () => setIsMobileClient(mobileQuery.matches);

    syncMobileState();
    mobileQuery.addEventListener('change', syncMobileState);
    return () => mobileQuery.removeEventListener('change', syncMobileState);
  }, []);

  // If the iframe pushes history entries (e.g. via vidsrc auto-redirects),
  // ensure the browser back button still goes back to the previous page.
  // This listener ensures the iframe loses focus when popstate fires.
  useEffect(() => {
    const onPop = () => {
      if (document.activeElement?.tagName === 'IFRAME') {
        document.activeElement.blur();
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // === TV show season/episode state ===
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [episodes, setEpisodes] = useState([]);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);

  // Save to watch history when content starts playing
  useEffect(() => {
    if (playerReady && movie && (movie?.title || movie?.name)) {
      addToHistory({
        id: id || documentId,
        title: movie.title || movie.name,
        poster_path: movie.poster_path,
        mediaType,
        season: mediaType === 'tv' ? selectedSeason : undefined,
        episode: mediaType === 'tv' ? selectedEpisode : undefined,
      });
    }
  }, [playerReady, movie?.id, selectedSeason, selectedEpisode, addToHistory]);

  // Load movie/TV details
  const loadContent = useCallback(async () => {
    setIsLoading(true);
    setEmbedUrl(null);
    setSourceName(null);
    setError(null);
    setPlayerReady(false);
    setPlayerError(null);

    try {
      if (documentId) {
        const result = await getMovieById(documentId);
        if (result) {
          setMovie(result);
          if (!result.stream_url) {
            setError('This movie has no streaming source configured.');
          }
          if (result.is_premium && !isPremium) {
            setError('This content is for Premium subscribers only. Upgrade to watch.');
          }
        } else {
          setError('Movie not found in the library.');
        }
      } else if (id) {
        const detailPath = mediaType === 'tv' ? `/tv/${id}` : `/movie/${id}`;
        const data = await tmdbFetch(detailPath);

        if (!data.id) {
          setError(`${mediaType === 'tv' ? 'TV show' : 'Movie'} not found.`);
          return;
        }

        setMovie(data);
        setSourceCount(getSourceCount());

        // Fetch IMDB ID (required by some embed sources)
        let fetchedImdbId = null;
        try {
          const externalData = await tmdbFetch(`/${mediaType}/${id}/external_ids`);
          if (externalData.imdb_id) {
            fetchedImdbId = externalData.imdb_id;
            setImdbId(externalData.imdb_id);
          }
        } catch (e) {
          console.error('Could not fetch IMDB ID:', e);
        }

        // Start with source 0
        setSourceIndex(0);
        loadSource(0, id, mediaType, undefined, undefined, fetchedImdbId);

        if (mediaType === 'tv' && data.seasons) {
          const tvSeasons = data.seasons.filter((s) => s.season_number > 0);
          setSeasons(tvSeasons);
          if (tvSeasons.length > 0) {
            setSelectedSeason(tvSeasons[0].season_number);
          }
        }
      }
    } catch (err) {
      console.error('Error loading content:', err);
      setError(err?.message || 'Failed to load. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [id, documentId, isPremium, mediaType]);

  /**
   * Load an embed streaming source by index.
   */
  const loadSource = (index, contentId, type, season, episode, imdbIdParam) => {
    setPlayerReady(false);
    setPlayerError(null);
    setIsAutoFailing(false);

    const safeImdbId = imdbIdParam || imdbId;

    const source = getSource(index, contentId, type, season, episode, undefined, safeImdbId);
    if (source?.url) {
      setEmbedUrl(source.url);
      setSourceName(source.name);
      setSourceIndex(index);
    } else {
      setError('No streaming source available for this title yet.');
    }
  };

  // Load episodes when season changes (for TV)
  useEffect(() => {
    if (mediaType !== 'tv' || !id || !selectedSeason) return;

    const fetchEpisodes = async () => {
      setIsLoadingEpisodes(true);
      try {
        const data = await tmdbFetch(`/tv/${id}/season/${selectedSeason}`);
        if (data.episodes) {
          setEpisodes(data.episodes);
          setSelectedEpisode(1);
        }
      } catch (err) {
        console.error('Error loading episodes:', err);
      } finally {
        setIsLoadingEpisodes(false);
      }
    };

    fetchEpisodes();
  }, [id, mediaType, selectedSeason]);

  // Reload embed URL when season/episode changes for TV
  useEffect(() => {
    if (mediaType !== 'tv' || !id) return;
    if (!selectedSeason || !selectedEpisode) return;

    const source = getSource(sourceIndex, id, mediaType, selectedSeason, selectedEpisode, undefined, imdbId);
    if (source?.url) {
      setEmbedUrl(source.url);
      setSourceName(source.name);
    }
  }, [selectedSeason, selectedEpisode, sourceIndex, mediaType, id, imdbId]);

  // Initial load
  useEffect(() => {
    loadContent();
  }, [loadContent]);

  // === Auto-fallback: try next source when current one fails ===
  const handleSourceError = () => {
    const nextIndex = (sourceIndex + 1) % sourceCount;

    // Track which sources have failed
    const updatedFailed = new Set(failedSources);
    updatedFailed.add(sourceIndex);
    setFailedSources(updatedFailed);

    // If we've tried every source and all have failed, show a final error
    if (updatedFailed.size >= sourceCount) {
      setError('All streaming sources are currently unavailable for this title. Please try again later.');
      setIsAutoFailing(false);
      return;
    }

    // Skip sources that already failed in this session
    let candidate = nextIndex;
    let attempts = 0;
    while (updatedFailed.has(candidate) && attempts < sourceCount) {
      candidate = (candidate + 1) % sourceCount;
      attempts++;
    }

    setIsAutoFailing(true);
    loadSource(
      candidate,
      id,
      mediaType,
      mediaType === 'tv' ? selectedSeason : undefined,
      mediaType === 'tv' ? selectedEpisode : undefined,
      imdbId
    );

    setTimeout(() => setIsAutoFailing(false), 1000);
  };

  // Manual source switch
  const switchSource = (direction = 1) => {
    const nextIndex = (sourceIndex + direction + sourceCount) % sourceCount;
    loadSource(
      nextIndex,
      id,
      mediaType,
      mediaType === 'tv' ? selectedSeason : undefined,
      mediaType === 'tv' ? selectedEpisode : undefined,
      imdbId
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <PageLayout width="5xl">
        <SEO
          title={mediaType === 'tv' ? 'Loading TV Show... - CineVault' : 'Loading Movie... - CineVault'}
          description="Loading content..."
        />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <svg className="animate-spin h-10 w-10 text-[#AB8BFF] mx-auto mb-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-white text-lg">Loading your {mediaType === 'tv' ? 'TV show' : 'movie'}...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error && !embedUrl) {
    return (
      <PageLayout width="5xl">
        <SEO title="Watch - CineVault" description={error} />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center max-w-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-red-400 mx-auto mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <h2 className="!text-2xl text-white mb-3">Cannot Play Video</h2>
            <p className="text-light-200 mb-6">{error}</p>
            <Link
              to={id ? `/${mediaType === 'tv' ? 'tv' : 'movie'}/${id}` : '/'}
              className="inline-block bg-light-100/10 text-light-200 px-6 py-3 rounded-xl hover:bg-light-100/20 transition-colors"
            >
              Go Back
            </Link>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <>
      <SEO
        title={movie?.title || movie?.name || (mediaType === 'tv' ? 'Watch TV Show' : 'Watch Movie') + ' - CineVault'}
        description={`Watch ${movie?.title || movie?.name || 'content'} online for free on CineVault. Streaming from ${sourceName || 'multiple sources'}.`}
        image={`https://image.tmdb.org/t/p/w500${movie?.poster_path || ''}`}
        url={`/watch/${id}?mediaType=${mediaType}`}
        type="video.movie"
      />
      <PopUnderAd />
      <PageLayout width="5xl">
        <BackLink className="mb-4" />

        {/* Ad Banner — above video player */}
        <div className="mb-4">
          <AdBanner format="leaderboard" />
        </div>

        {/* Video Player Section */}
        {embedUrl && (
          <>
            {/* Season/Episode Picker — only for TV shows, shown ABOVE the video player */}
            {mediaType === 'tv' && movie && seasons.length > 0 && (
              <div className="bg-dark-100 rounded-2xl overflow-hidden shadow-inner shadow-light-100/5 p-4 mb-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div>
                    <label className="block text-gray-400 text-xs mb-1">Season</label>
                    <select
                      value={selectedSeason}
                      onChange={(e) => setSelectedSeason(Number(e.target.value))}
                      className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-[#AB8BFF] outline-none text-sm"
                    >
                      {seasons.map((s) => (
                        <option key={s.season_number} value={s.season_number}>
                          Season {s.season_number}{s.episode_count ? ` (${s.episode_count} eps)` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-400 text-xs mb-1">Episode</label>
                    <select
                      value={selectedEpisode}
                      onChange={(e) => setSelectedEpisode(Number(e.target.value))}
                      disabled={isLoadingEpisodes}
                      className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-[#AB8BFF] outline-none text-sm disabled:opacity-50"
                    >
                      {isLoadingEpisodes ? (
                        <option>Loading...</option>
                      ) : (
                        episodes.map((ep) => (
                          <option key={ep.episode_number} value={ep.episode_number}>
                            Ep {ep.episode_number}: {ep.name || `Episode ${ep.episode_number}`}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* Quick nav buttons */}
                  <div className="flex items-center gap-1 ml-auto">
                    <button
                      onClick={() => setSelectedEpisode(Math.max(1, selectedEpisode - 1))}
                      disabled={selectedEpisode <= 1}
                      className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white disabled:opacity-30 transition-colors"
                      title="Previous Episode"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <span className="text-gray-400 text-xs px-2">
                      {selectedEpisode}
                    </span>
                    <button
                      onClick={() => setSelectedEpisode(Math.min(episodes.length, selectedEpisode + 1))}
                      disabled={selectedEpisode >= episodes.length}
                      className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white disabled:opacity-30 transition-colors"
                      title="Next Episode"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Select Mirror / Server — choose playback source */}
            <div className="mb-4 bg-dark-100 rounded-2xl overflow-hidden shadow-inner shadow-light-100/5 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white text-sm font-semibold">Select Mirror / Server</h3>
                <button
                  onClick={handleSourceError}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs rounded-lg transition-colors"
                  title="Report this source as broken and switch to next"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Report Broken Stream
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {getAllSourceNames().map((name, i) => (
                  <button
                    key={name}
                    onClick={() => {
                      loadSource(
                        i,
                        id,
                        mediaType,
                        mediaType === 'tv' ? selectedSeason : undefined,
                        mediaType === 'tv' ? selectedEpisode : undefined,
                        imdbId
                      );
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${i === sourceIndex
                      ? 'bg-[#AB8BFF]/20 text-[#AB8BFF] border border-[#AB8BFF]/30'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700'
                      }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <ContentLocker onUnlock={() => setLockerUnlocked(true)} fastMode={isMobileClient}>
                <div className="relative bg-black rounded-2xl overflow-hidden shadow-inner shadow-light-100/5">
                  <div className="relative w-full bg-black max-sm:aspect-[4/3] sm:aspect-video">
                    {/* Auto-failover indicator */}
                    {isAutoFailing && (
                      <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80">
                        <div className="text-center">
                          <svg className="animate-spin h-8 w-8 text-[#AB8BFF] mx-auto mb-2" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          <p className="text-gray-400 text-sm">Source failed — trying next...</p>
                        </div>
                      </div>
                    )}

                    <iframe
                      key={`${sourceIndex}-${selectedSeason}-${selectedEpisode}-${lockerUnlocked ? 'unlocked' : 'locked'}-${isMobileClient ? mobilePlayerKey : 0}`}
                      ref={iframeRef}
                      src={isMobileClient && !lockerUnlocked ? 'about:blank' : embedUrl}
                      referrerPolicy="no-referrer"
                      allowFullScreen={true}
                      allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                      className="w-full h-full border-0 min-h-[280px] sm:min-h-[450px] relative z-50 bg-black rounded-2xl"
                      onLoad={() => {
                        setPlayerReady(true);
                      }}
                      onError={() => {
                        setPlayerError('Failed to load stream. Switching source...');
                        handleSourceError();
                      }}
                    ></iframe>

                    {/* Player error message */}
                    {playerError && (
                      <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80">
                        <div className="text-center max-w-sm px-4">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <p className="text-red-400 text-sm mb-3">{playerError}</p>
                          <button
                            onClick={handleSourceError}
                            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs rounded-lg transition-colors"
                          >
                            Switch to Next Source
                          </button>
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Source info bar */}
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-900/80 flex-wrap gap-2">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span>Source:</span>
                      <span className="text-white font-medium">{sourceName || 'Unknown'}</span>
                      <span className="text-gray-500 text-xs">
                        ({sourceIndex + 1}/{sourceCount})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Report Broken Stream button */}
                      <button
                        onClick={handleSourceError}
                        className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs rounded-lg transition-colors"
                        title="Report this source as broken and switch to next"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Report Broken
                      </button>

                      {/* Switch Source button */}
                      <button
                        onClick={() => switchSource(1)}
                        className="flex items-center gap-2 px-4 py-2 bg-light-100/10 hover:bg-light-100/20 text-white text-sm rounded-lg transition-colors"
                        title="Switch to next source"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                        </svg>
                        Switch Source
                      </button>
                    </div>
                  </div>
                </div>
              </ContentLocker>
            </div>

          </>
        )}

        {/* Movie Poster + Info (when no embed) */}
        {movie && !embedUrl && (
          <div className="bg-dark-100 rounded-2xl overflow-hidden shadow-inner shadow-light-100/5">
            <div className="relative aspect-video bg-gray-900">
              {movie?.poster_path && (
                <img
                  src={`https://image.tmdb.org/t/p/w780${movie.poster_path}`}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-dark-100 via-dark-100/60 to-transparent" />

              <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                <h1 className="text-white text-3xl sm:text-4xl font-bold text-center mb-4 drop-shadow-lg">
                  {movie?.title || movie?.name || 'Now Playing'}
                </h1>

                {sourceCount > 0 && (
                  <button
                    onClick={() => {
                      loadSource(0, id, mediaType, selectedSeason, selectedEpisode, imdbId);
                    }}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-[#D6C7FF] to-[#AB8BFF] text-dark-100 font-bold px-8 py-4 rounded-full text-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-2xl"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Watch Now
                  </button>
                )}
              </div>
            </div>

            <div className="px-6 py-5">
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-4">
                {movie?.release_date && <span>{movie.release_date.split('-')[0]}</span>}
                {!movie?.release_date && movie?.first_air_date && <span>{movie.first_air_date.split('-')[0]}</span>}
                {movie?.vote_average && (
                  <span className="text-yellow-400 flex items-center gap-1">
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {movie.vote_average.toFixed(1)}
                  </span>
                )}
              </div>

              <p className="text-light-200 leading-relaxed">
                {movie?.overview || 'No description available.'}
              </p>
            </div>
          </div>
        )}

        {/* Movie info when embed IS shown */}
        {movie && embedUrl && (
          <div className="bg-dark-100 rounded-2xl overflow-hidden shadow-inner shadow-light-100/5 p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-5">
              {movie?.poster_path && (
                <div className="flex-shrink-0">
                  <img
                    src={`https://image.tmdb.org/t/p/w185${movie.poster_path}`}
                    alt={movie?.title || movie?.name || 'Poster'}
                    loading="lazy"
                    className="w-24 sm:w-28 rounded-lg shadow-lg"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-white text-xl font-bold mb-2">{movie?.title || movie?.name}</h2>
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 mb-3">
                  {movie?.release_date && <span>{movie.release_date.split('-')[0]}</span>}
                  {!movie?.release_date && movie?.first_air_date && <span>{movie.first_air_date.split('-')[0]}</span>}
                  {movie?.vote_average && (
                    <span className="text-yellow-400 flex items-center gap-1">
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {movie.vote_average.toFixed(1)}
                    </span>
                  )}
                  {movie?.runtime && <span>{movie.runtime} min</span>}
                  {!movie?.runtime && movie?.episode_run_time?.[0] && <span>{movie.episode_run_time[0]} min</span>}
                  {movie?.original_language && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-800 text-gray-300 text-xs rounded-full uppercase">
                      {movie.original_language}
                    </span>
                  )}
                  {movie?.original_language === 'ko' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-500/20 text-violet-300 text-xs rounded-full border border-violet-500/30 font-medium">
                      🇰🇷 {mediaType === 'tv' ? 'K-Drama' : 'Korean Movie'}
                    </span>
                  )}
                </div>
                <p className="text-light-200 leading-relaxed text-sm line-clamp-3">
                  {movie?.overview || 'No description available.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Ad */}
        {movie && (
          <div className="mt-6">
            <AdBanner format="leaderboard" />
          </div>
        )}
      </PageLayout>
    </>
  );
};

function WatchPageWithBoundary() {
  return (
    <ErrorBoundary>
      <WatchPage />
    </ErrorBoundary>
  );
}

export default WatchPageWithBoundary;