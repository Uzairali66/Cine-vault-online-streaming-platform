import { useRef, useState, useEffect, useCallback } from 'react';

/**
 * DirectPlayer — premium HTML5 video player for direct MP4/WebM streaming.
 *
 * Props:
 *   src       — direct media URL (MP4, WebM)
 *   poster    — optional poster image
 *   title     — optional title shown in overlay
 *   onError   — callback on load failure
 */
const DirectPlayer = ({ src, poster, title, onError }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const progressRef = useRef(null);
  const controlsTimer = useRef(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('player-volume');
    return saved ? parseFloat(saved) : 1;
  });
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [buffered, setBuffered] = useState(0);

  // ─── Format time ──────────────────────────────────────────
  const fmt = (t) => {
    if (!t || isNaN(t)) return '0:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // ─── Load stream ──────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    setIsLoading(true);
    setError(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    video.src = src;

    const onMeta = () => {
      setDuration(video.duration);
      setIsLoading(false);
      video.play().catch(() => { });
    };
    const onErr = () => {
      setError('Failed to load video.');
      onError?.('Video load error');
      setIsLoading(false);
    };

    video.addEventListener('loadedmetadata', onMeta);
    video.addEventListener('error', onErr);

    return () => {
      video.removeEventListener('loadedmetadata', onMeta);
      video.removeEventListener('error', onErr);
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, [src, onError]);

  // ─── Time / progress ──────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const update = () => {
      setCurrentTime(video.currentTime);
    };
    const onProgress = () => {
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);
    const onDurationChange = () => setDuration(video.duration);

    video.addEventListener('timeupdate', update);
    video.addEventListener('progress', onProgress);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEnded);
    video.addEventListener('durationchange', onDurationChange);

    return () => {
      video.removeEventListener('timeupdate', update);
      video.removeEventListener('progress', onProgress);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('durationchange', onDurationChange);
    };
  }, []);

  // ─── Volume ────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('player-volume', String(volume));
    const video = videoRef.current;
    if (!video) return;
    video.volume = volume;
    video.muted = volume === 0;
    setIsMuted(volume === 0);
  }, [volume]);

  // ─── Playback speed ────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (video) video.playbackRate = playbackRate;
  }, [playbackRate]);

  // ─── Controls auto-hide ────────────────────────────────────
  const resetControls = useCallback(() => {
    setShowControls(true);
    clearTimeout(controlsTimer.current);
    if (isPlaying) {
      controlsTimer.current = setTimeout(() => {
        setShowControls(false);
        setShowSpeedMenu(false);
      }, 4000);
    }
  }, [isPlaying]);

  useEffect(() => {
    return () => clearTimeout(controlsTimer.current);
  }, []);

  // ─── Handlers ──────────────────────────────────────────────
  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    v.paused ? v.play().catch(() => { }) : v.pause();
    resetControls();
  };

  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      await el.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
    resetControls();
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
    setVolume(v.muted ? 0 : 1);
    resetControls();
  };

  const handleSeek = (e) => {
    const v = videoRef.current;
    const bar = progressRef.current;
    if (!v || !bar) return;
    const rect = bar.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    v.currentTime = pos * (v.duration || duration);
    resetControls();
  };

  const changeSpeed = (speed) => {
    setPlaybackRate(speed);
    setShowSpeedMenu(false);
    resetControls();
  };

  // ─── Keyboard ──────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      const v = videoRef.current;
      if (!v) return;
      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          v.currentTime = Math.max(0, v.currentTime - 10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          v.currentTime = Math.min(v.duration, v.currentTime + 10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume((v) => Math.min(1, v + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume((v) => Math.max(0, v - 0.1));
          break;
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferWidth = duration > 0 ? (buffered / duration) * 100 : 0;

  // ─── Render ────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black overflow-hidden select-none aspect-video rounded-2xl shadow-2xl shadow-black/60"
      onMouseMove={resetControls}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Loading spinner */}
      {isLoading && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80">
          <div className="text-center">
            <svg className="animate-spin h-12 w-12 text-[#AB8BFF] mx-auto mb-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-white/60 text-sm tracking-wide uppercase">Buffering</p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80">
          <div className="text-center p-8 max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01" />
              </svg>
            </div>
            <p className="text-white text-lg font-medium mb-1">Playback Error</p>
            <p className="text-white/50 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* ── Video element ── */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain cursor-pointer"
        poster={poster}
        playsInline
        preload="metadata"
        controlsList="nodownload"
        onClick={togglePlay}
        onContextMenu={(e) => e.preventDefault()}
      >
        <source src={src} type={src?.endsWith('.webm') ? 'video/webm' : 'video/mp4'} />
      </video>

      {/* Big play button (when paused) */}
      {!isPlaying && !isLoading && !error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <button
            onClick={togglePlay}
            className="w-[72px] h-[72px] rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center pointer-events-auto hover:bg-white/20 transition-all hover:scale-105 border border-white/10"
          >
            <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        </div>
      )}

      {/* ── Controls overlay ── */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
      >
        {/* Top gradient + title */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent px-6 pt-5 pb-16">
          <div className="flex items-center justify-between">
            <span className="text-white text-sm font-medium truncate max-w-[300px] drop-shadow-lg">
              {title || 'Now Playing'}
            </span>
          </div>
        </div>

        {/* Center play (paused) */}
        {!isPlaying && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <button
              onClick={togglePlay}
              className="w-16 h-16 rounded-full bg-white/10 backdrop-blur border border-white/10 flex items-center justify-center pointer-events-auto hover:bg-white/20 transition-all hover:scale-105"
            >
              <svg className="w-7 h-7 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </div>
        )}

        {/* Bottom gradient + controls bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-6 pt-20 pb-5">
          {/* Progress bar */}
          <div
            ref={progressRef}
            className="group relative h-1.5 bg-white/20 rounded-full cursor-pointer mb-4 hover:h-2 transition-all"
            onClick={handleSeek}
          >
            {/* Buffered */}
            <div
              className="absolute top-0 left-0 h-full bg-white/30 rounded-full pointer-events-none"
              style={{ width: `${bufferWidth}%` }}
            />
            {/* Played */}
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#D6C7FF] to-[#AB8BFF] rounded-full pointer-events-none"
              style={{ width: `${progress}%` }}
            />
            {/* Thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              style={{ left: `calc(${progress}% - 7px)` }}
            />
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-between text-white">
            {/* Left group */}
            <div className="flex items-center gap-4">
              {/* Play/Pause */}
              <button onClick={togglePlay} className="hover:text-[#AB8BFF] transition-colors" title={isPlaying ? 'Pause' : 'Play'}>
                {isPlaying ? (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              {/* Volume */}
              <div className="flex items-center gap-1.5 group/vol">
                <button onClick={toggleMute} className="hover:text-[#AB8BFF] transition-colors" title={isMuted ? 'Unmute' : 'Mute'}>
                  {isMuted || volume === 0 ? (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 003.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                    </svg>
                  )}
                </button>
                <div className="w-0 group-hover/vol:w-20 overflow-hidden transition-all duration-200">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full h-1 appearance-none bg-white/30 rounded-full cursor-pointer accent-[#AB8BFF] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                  />
                </div>
              </div>

              {/* Time */}
              <span className="text-xs text-white/70 select-none tabular-nums">
                {fmt(currentTime)} / {fmt(duration)}
              </span>
            </div>

            {/* Right group */}
            <div className="flex items-center gap-3">
              {/* Speed */}
              <div className="relative">
                <button
                  onClick={() => setShowSpeedMenu((p) => !p)}
                  className="text-xs font-medium hover:text-[#AB8BFF] transition-colors uppercase tracking-wide"
                  title="Playback Speed"
                >
                  {playbackRate}x
                </button>
                {showSpeedMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowSpeedMenu(false)} />
                    <div className="absolute bottom-8 right-0 z-50 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl py-1.5 min-w-[90px]">
                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                        <button
                          key={speed}
                          onClick={() => changeSpeed(speed)}
                          className={`block w-full text-left px-4 py-1.5 text-sm transition-colors hover:bg-white/5 ${playbackRate === speed ? 'text-[#AB8BFF] font-medium' : 'text-white/70'
                            }`}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Fullscreen */}
              <button onClick={toggleFullscreen} className="hover:text-[#AB8BFF] transition-colors" title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
                {isFullscreen ? (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DirectPlayer;