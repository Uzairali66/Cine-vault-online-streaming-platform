import { useEffect, useRef, useState, useCallback } from 'react';

// ─── Helpers ────────────────────────────────────────────────
const formatTime = (t) => {
  if (!t || isNaN(t)) return '0:00';
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

const VideoPlayer = ({
  src,
  poster,
  title,
  onError,
  onNext,        // if provided, shows "Next" button
  skipIntro,     // { start: 0, end: 90 } — auto-skip intro range (seconds)
  subtitles,     // [{ label: 'English', src: '/subs/en.vtt', srclang: 'en' }]
}) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const progressRef = useRef(null);
  const hlsRef = useRef(null);
  const controlsTimer = useRef(null);
  const lastSrc = useRef(null);

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
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);



  // HLS quality state
  const [hlsLevels, setHlsLevels] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(-1); // -1 = auto
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  // Subtitles
  const [activeSubtitle, setActiveSubtitle] = useState(null);
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);

  // Next episode countdown
  const [showNextCountdown, setShowNextCountdown] = useState(false);
  const nextCountdownRef = useRef(null);
  const [nextCountdown, setNextCountdown] = useState(10);

  // Mini bottom progress bar (like Netflix)
  const [miniProgress, setMiniProgress] = useState(0);

  const isHLS = src?.endsWith('.m3u8');

  // ─── Persist Volume ──────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('player-volume', String(volume));
  }, [volume]);

  // ─── Load Stream (stable: only re-runs if src changes) ───
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    // Prevent re-running if src hasn't changed
    if (lastSrc.current === src) return;
    lastSrc.current = src;

    setIsLoading(true);
    setError(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setMiniProgress(0);
    setShowNextCountdown(false);
    setHlsLevels([]);
    setCurrentLevel(-1);

    // Cleanup previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Pre-connect
    try {
      const urlObj = new URL(src);
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = urlObj.origin;
      document.head.appendChild(link);
    } catch (_) { }

    if (isHLS) {
      import('hls.js').then(({ default: Hls }) => {
        if (!Hls.isSupported()) {
          if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = src;
            video.addEventListener('loadedmetadata', () => {
              setDuration(video.duration);
              setIsLoading(false);
            });
          } else {
            setError('HLS not supported on this browser.');
            onError?.('HLS not supported');
            setIsLoading(false);
          }
          return;
        }

        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backbufferLength: 60,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          startLevel: -1,
        });

        hlsRef.current = hls;
        hls.loadSource(src);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setDuration(video.duration);
          setIsLoading(false);

          // Populate quality levels
          if (hls.levels && hls.levels.length > 0) {
            const levels = hls.levels.map((level, i) => ({
              index: i,
              height: level.height,
              bitrate: level.bitrate,
              label: level.height >= 2160 ? '4K' :
                level.height >= 1440 ? '1440p' :
                  level.height >= 1080 ? '1080p' :
                    level.height >= 720 ? '720p' :
                      level.height >= 480 ? '480p' :
                        level.height >= 360 ? '360p' : `${level.height}p`,
            }));
            // Sort descending by height
            levels.sort((a, b) => b.height - a.height);
            setHlsLevels(levels);
          }

          video.play().catch(() => { });
        });

        hls.on(Hls.Events.LEVEL_LOADED, (event, data) => {
          if (data.details) {
            setDuration(data.details.totalduration);
          }
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            setError('Failed to load video stream.');
            onError?.(data.type);
          }
        });
      });
    } else {
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

      // One-shot cleanup
      return () => {
        video.removeEventListener('loadedmetadata', onMeta);
        video.removeEventListener('error', onErr);
        video.pause();
        video.removeAttribute('src');
        video.load();
      };
    }

    // Cleanup for HLS path
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src]);

  // ─── Quality Switching ─────────────────────────────────
  useEffect(() => {
    if (!hlsRef.current || currentLevel < -1) return;
    hlsRef.current.currentLevel = currentLevel;
  }, [currentLevel]);

  // ─── Time / Progress Updates ────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const update = () => {
      setCurrentTime(video.currentTime);
      if (video.duration) {
        setMiniProgress(video.currentTime / video.duration);
      }
    };
    const onProgress = () => {
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      if (onNext) {
        setShowNextCountdown(true);
        setNextCountdown(10);
      }
    };
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
  }, [onNext]);

  // ─── Skip Intro ────────────────────────────────────────
  useEffect(() => {
    if (!skipIntro || !skipIntro.end) return;
    const video = videoRef.current;
    if (!video) return;

    const check = () => {
      if (video.currentTime >= skipIntro.start && video.currentTime < skipIntro.end) {
        video.currentTime = skipIntro.end;
      }
    };
    video.addEventListener('timeupdate', check);
    return () => video.removeEventListener('timeupdate', check);
  }, [skipIntro?.start, skipIntro?.end]);

  // ─── Next Episode Countdown ────────────────────────────
  useEffect(() => {
    if (!showNextCountdown) return;
    nextCountdownRef.current = setInterval(() => {
      setNextCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(nextCountdownRef.current);
          onNext?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(nextCountdownRef.current);
  }, [showNextCountdown, onNext]);

  // ─── Volume Sync ────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = volume;
    if (volume === 0) {
      video.muted = true;
      setIsMuted(true);
    } else {
      video.muted = false;
      setIsMuted(false);
    }
  }, [volume]);

      video.style.objectFit = 'contain';
    }
  }, [simulatedLevel]);

  // ─── Playback Speed ─────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (video) video.playbackRate = playbackRate;
  }, [playbackRate]);

  // ─── Auto-hide Controls ────────────────────────────────
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    // IMPORTANT: Do NOT close menus here! That breaks menu interaction
    // because onMouseMove fires before click events, closing menus instantly.
    // Menus only close when: user selects an option, clicks elsewhere,
    // or controls auto-hide after inactivity.
    clearTimeout(controlsTimer.current);
    if (isPlaying) {
      controlsTimer.current = setTimeout(() => {
        setShowControls(false);
        // Close menus only when controls fully auto-hide
        setShowSpeedMenu(false);
        setShowQualityMenu(false);
        setShowSubtitleMenu(false);
      }, 4000);
    }
  }, [isPlaying]);

  useEffect(() => {
    return () => clearTimeout(controlsTimer.current);
  }, []);

  // ─── Keyboard Shortcuts ─────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      const video = videoRef.current;
      if (!video) return;
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
          video.currentTime = Math.max(0, video.currentTime - 10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          video.currentTime = Math.min(video.duration, video.currentTime + 10);
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

  // ─── Controls ───────────────────────────────────────────
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => { });
    } else {
      video.pause();
    }
    resetControlsTimer();
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      await container.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
    resetControlsTimer();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
    setVolume(video.muted ? 0 : 1);
    resetControlsTimer();
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    const bar = progressRef.current;
    if (!video || !bar) return;
    const rect = bar.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    video.currentTime = pos * (video.duration || duration);
    resetControlsTimer();
  };

  // ─── Render ─────────────────────────────────────────────
  const hasRealLevels = isHLS && hlsLevels.length > 1;

  const getQualityLabel = () => {
    if (hasRealLevels && currentLevel >= 0) {
      const level = hlsLevels.find((l) => l.index === currentLevel);
      return level ? level.label : 'Auto';
    }
    return 'Auto';
  };

  const activeSubtitleLabel = activeSubtitle
    ? (subtitles?.find((s) => s.srclang === activeSubtitle)?.label || 'Off')
    : 'Off';

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black overflow-hidden select-none aspect-video"
      style={{ borderRadius: 'inherit' }}
      onMouseMove={resetControlsTimer}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* ── Loading ── */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-30">
          <div className="text-center">
            <svg className="animate-spin h-12 w-12 text-white mx-auto mb-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-white/70 text-sm tracking-wide">Loading</p>
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-30">
          <div className="text-center p-8 max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01" />
              </svg>
            </div>
            <p className="text-white text-lg font-medium mb-1">Video unavailable</p>
            <p className="text-white/50 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* ── Video ── */}
      <video
        ref={videoRef}
        className="w-full aspect-video object-contain"
        poster={poster}
        playsInline
        preload="auto"
        onClick={togglePlay}
      >
        {!isHLS && src && (
          <source src={src} type={src?.endsWith('.webm') ? 'video/webm' : 'video/mp4'} />
        )}
        {subtitles?.map((sub) => (
          <track
            key={sub.srclang}
            kind="subtitles"
            src={sub.src}
            srcLang={sub.srclang}
            label={sub.label}
            default={activeSubtitle === sub.srclang}
          />
        ))}
      </video>

      {/* ── Big Play (paused) ── */}
      {!isPlaying && !isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
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

      {/* ── Controls Overlay ── */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
      >
        {/* Top Gradient + Top Bar */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent px-6 pt-5 pb-16">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-white text-sm font-medium truncate max-w-[300px] drop-shadow-lg">
                {title || 'Now Playing'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isHLS && hlsLevels.length > 0 && (
                <span className="text-white/50 text-xs">
                  {hlsLevels.find((l) => l.index === hlsRef.current?.currentLevel)?.label || 'Auto'}
                </span>
              )}
            </div>
          </div>
        </div>



        {/* ── Bottom Gradient + Controls ── */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-6 pt-20 pb-5">
          {/* ── Seek Bar ── */}
          <div
            ref={progressRef}
            className="relative h-1 bg-white/20 rounded-full cursor-pointer group/progress mb-4 hover:h-1.5 transition-all duration-100"
            onClick={handleSeek}
          >
            {/* Buffered */}
            <div
              className="absolute top-0 left-0 h-full bg-white/20 rounded-full"
              style={{ width: `${duration ? (buffered / duration) * 100 : 0}%` }}
            />
            {/* Progress */}
            <div
              className="absolute top-0 left-0 h-full bg-[#8B5CF6] rounded-full"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            />
            {/* Thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md scale-0 group-hover/progress:scale-100 transition-transform"
              style={{ left: `${duration ? (currentTime / duration) * 100 : 0}%`, marginLeft: '-7px' }}
            />
          </div>

          {/* ── Bottom Row ── */}
          <div className="flex items-center justify-between">
            {/* Left */}
            <div className="flex items-center gap-4">
              {/* Play/Pause */}
              <button onClick={togglePlay} className="text-white hover:text-[#8B5CF6] transition-colors" aria-label={isPlaying ? 'Pause' : 'Play'}>
                {isPlaying ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                )}
              </button>

              {/* Next Episode */}
              {onNext && (
                <button
                  onClick={() => onNext()}
                  className="text-white/70 hover:text-white transition-colors"
                  aria-label="Next episode"
                  title="Next episode"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                  </svg>
                </button>
              )}

              {/* Volume */}
              <div
                className="relative flex items-center"
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <button onClick={toggleMute} className="text-white/70 hover:text-white transition-colors" aria-label="Mute">
                  {isMuted || volume === 0 ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
                  )}
                </button>
                {showVolumeSlider && (
                  <div className="ml-2 flex items-center">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="w-[60px] h-1 accent-[#8B5CF6] cursor-pointer"
                      aria-label="Volume"
                    />
                  </div>
                )}
              </div>

              {/* Time */}
              <span className="text-white/60 text-xs font-mono tracking-wide">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Right */}
            <div className="flex items-center gap-3">
              {/* Subtitles */}
              {subtitles && subtitles.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => { setShowSubtitleMenu(!showSubtitleMenu); setShowSpeedMenu(false); setShowQualityMenu(false); }}
                    className="text-white/70 hover:text-white transition-colors"
                    aria-label="Subtitles"
                    title="Subtitles"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                    </svg>
                  </button>
                  {showSubtitleMenu && (
                    <div className="absolute bottom-full right-0 mb-2 bg-[#141414] border border-white/10 rounded-lg shadow-2xl overflow-hidden min-w-[140px]">
                      <button
                        onClick={() => { setActiveSubtitle(null); setShowSubtitleMenu(false); }}
                        className={`block w-full text-left px-4 py-2.5 text-xs hover:bg-white/10 transition-colors ${!activeSubtitle ? 'text-[#8B5CF6]' : 'text-white/70'}`}
                      >
                        Off
                      </button>
                      {subtitles.map((sub) => (
                        <button
                          key={sub.srclang}
                          onClick={() => { setActiveSubtitle(sub.srclang); setShowSubtitleMenu(false); }}
                          className={`block w-full text-left px-4 py-2.5 text-xs hover:bg-white/10 transition-colors ${activeSubtitle === sub.srclang ? 'text-[#8B5CF6]' : 'text-white/70'}`}
                        >
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Quality — visible when there are HLS quality levels */}
              {hasRealLevels && (
                <div className="relative">
                  <button
                    onClick={() => { setShowQualityMenu(!showQualityMenu); setShowSpeedMenu(false); setShowSubtitleMenu(false); }}
                    className="text-white/70 hover:text-white transition-colors text-xs bg-white/5 hover:bg-white/10 px-2 py-1 rounded"
                    aria-label="Quality"
                  >
                    {getQualityLabel()}
                  </button>
                  {showQualityMenu && (
                    <div className="absolute bottom-full right-0 mb-2 bg-[#141414] border border-white/10 rounded-lg shadow-2xl overflow-hidden min-w-[150px] max-h-[280px] overflow-y-auto">
                      {/* Auto */}
                      <button
                        onClick={() => {
                          setCurrentLevel(-1);
                          setShowQualityMenu(false);
                        }}
                        className={`block w-full text-left px-4 py-2.5 text-xs hover:bg-white/10 transition-colors ${currentLevel === -1 ? 'text-[#8B5CF6]' : 'text-white/70'}`}
                      >
                        Auto
                      </button>
                      {/* Real HLS levels */}
                      {hlsLevels.map((level) => (
                        <button
                          key={level.index}
                          onClick={() => {
                            setCurrentLevel(level.index);
                            setShowQualityMenu(false);
                          }}
                          className={`block w-full text-left px-4 py-2.5 text-xs hover:bg-white/10 transition-colors ${currentLevel === level.index ? 'text-[#8B5CF6]' : 'text-white/70'}`}
                        >
                          {level.label}
                          <span className="text-white/30 ml-1">({Math.round(level.bitrate / 1000)} kbps)</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Speed */}
              <div className="relative">
                <button
                  onClick={() => { setShowSpeedMenu(!showSpeedMenu); setShowQualityMenu(false); setShowSubtitleMenu(false); }}
                  className="text-white/70 hover:text-white transition-colors text-xs bg-white/5 hover:bg-white/10 px-2 py-1 rounded"
                  aria-label="Playback Speed"
                >
                  {playbackRate === 1 ? 'Speed' : `${playbackRate}x`}
                </button>
                {showSpeedMenu && (
                  <div className="absolute bottom-full right-0 mb-2 bg-[#141414] border border-white/10 rounded-lg shadow-2xl overflow-hidden min-w-[120px]">
                    {SPEEDS.map((speed) => (
                      <button
                        key={speed}
                        onClick={() => { setPlaybackRate(speed); setShowSpeedMenu(false); }}
                        className={`block w-full text-left px-4 py-2.5 text-xs hover:bg-white/10 transition-colors ${playbackRate === speed ? 'text-[#8B5CF6]' : 'text-white/70'}`}
                      >
                        {speed === 1 ? 'Normal' : `${speed}x`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Picture-in-Picture */}
              <button
                onClick={async () => {
                  const video = videoRef.current;
                  if (!video) return;
                  try {
                    if (document.pictureInPictureElement) {
                      await document.exitPictureInPicture();
                    } else {
                      await video.requestPictureInPicture();
                    }
                  } catch (_) { }
                }}
                className="text-white/70 hover:text-white transition-colors"
                aria-label="Picture in Picture"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 11h-8v6h8v-6zm4 8V5c0-1.1-.9-2-2-2H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2zm-2 0H3V5h18v14z" />
                </svg>
              </button>

              {/* Fullscreen */}
              <button onClick={toggleFullscreen} className="text-white/70 hover:text-white transition-colors" aria-label="Fullscreen">
                {isFullscreen ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Next Episode Countdown ── */}
      {showNextCountdown && (
        <div className="absolute bottom-24 right-6 z-20 bg-[#141414]/90 backdrop-blur rounded-lg border border-white/10 p-4 shadow-2xl animate-in slide-in-from-bottom">
          <p className="text-white/60 text-xs mb-2">Next episode in {nextCountdown}s</p>
          <div className="flex gap-2">
            <button
              onClick={() => { clearInterval(nextCountdownRef.current); onNext?.(); }}
              className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-medium px-4 py-1.5 rounded transition-colors"
            >
              Next
            </button>
            <button
              onClick={() => { clearInterval(nextCountdownRef.current); setShowNextCountdown(false); }}
              className="bg-white/10 hover:bg-white/20 text-white/70 text-xs px-4 py-1.5 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Mini bottom progress bar (Netflix-style, visible on scroll) ── */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/10 z-40">
        <div
          className="h-full bg-[#8B5CF6] transition-all duration-200"
          style={{ width: `${miniProgress * 100}%` }}
        />
      </div>
    </div>
  );
};

export default VideoPlayer;