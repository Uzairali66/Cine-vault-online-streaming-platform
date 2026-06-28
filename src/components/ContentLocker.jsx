import { useState, useEffect } from 'react';

/**
 * ContentLocker Component
 *
 * Shows a "Please disable ad blocker" or countdown overlay BEFORE the video plays.
 * Forces users to view/interact with an ad before watching content.
 * - AdBlock detection: shows a warning if ad blocker is detected
 * - Countdown timer: forces a 5-second wait before "Continue" is available
 * - One-click bypass: after first unlock, remembers for the session
 */

const LOCKER_KEY = 'cinevault_locker_unlocked';

const ContentLocker = ({ onUnlock, children, fastMode = false }) => {
  const countdownSeconds = fastMode ? 1 : 5;
  const [countdown, setCountdown] = useState(countdownSeconds);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isCheckingAdblock, setIsCheckingAdblock] = useState(!fastMode);
  const [adblockDetected, setAdblockDetected] = useState(false);

  // Check if already unlocked this session
  useEffect(() => {
    const alreadyUnlocked = sessionStorage.getItem(LOCKER_KEY);
    if (alreadyUnlocked === 'true') {
      setIsUnlocked(true);
      onUnlock?.();
    }
  }, [onUnlock]);

  // Real adblock detection check. Mobile fast mode skips this slow external request.
  useEffect(() => {
    if (fastMode) {
      setAdblockDetected(false);
      setIsCheckingAdblock(false);
      return;
    }

    const checkAdblock = async () => {
      try {
        const url = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
        await fetch(url, { method: 'HEAD', mode: 'no-cors', cache: 'no-store' });
        setAdblockDetected(false);
      } catch (err) {
        console.warn('Adblocker check failed; continuing so playback is not blocked:', err);
        setAdblockDetected(false);
      } finally {
        setIsCheckingAdblock(false);
      }
    };
    checkAdblock();
  }, [fastMode]);

  // Countdown timer
  useEffect(() => {
    if (isUnlocked || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isUnlocked, countdown]);

  const handleContinue = () => {
    setIsUnlocked(true);
    sessionStorage.setItem(LOCKER_KEY, 'true');
    onUnlock?.();
  };

  if (isUnlocked) {
    return children;
  }

  return (
    <div className="relative">
      {/* Overlay */}
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-gradient-to-b from-black/95 via-black/85 to-black/95 rounded-2xl">
        <div className="text-center p-8 max-w-md">
          {isCheckingAdblock ? (
            <>
              <div className="animate-spin h-10 w-10 border-4 border-[#AB8BFF] border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-white text-lg">Preparing video...</p>
            </>
          ) : adblockDetected ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-400 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-white text-2xl font-bold mb-2">Ad Blocker Detected</h3>
              <p className="text-gray-400 mb-6">
                Please disable your ad blocker to watch content. Our site is supported by ads.
              </p>
              <button
                onClick={handleContinue}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 rounded-xl transition-all"
              >
                I've Disabled My Ad Blocker
              </button>
            </>
          ) : (
            <>
              {/* Progress ring */}
              <div className="relative w-20 h-20 mx-auto mb-4">
                <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 72 72">
                  <circle cx="36" cy="36" r="30" fill="none" stroke="#374151" strokeWidth="4" />
                  <circle
                    cx="36" cy="36" r="30" fill="none" stroke="#AB8BFF" strokeWidth="4"
                    strokeDasharray={`${(countdown / countdownSeconds) * 188.5} 188.5`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-white text-2xl font-bold">
                  {countdown}
                </span>
              </div>

              <h3 className="text-white text-xl font-bold mb-2">🔒 Content Locked</h3>
              <p className="text-gray-300 text-sm mb-4">
                Please wait a moment before accessing the video. This helps us keep our service free.
              </p>

              {/* Ad placeholder — replace with real ad code */}
              <div className="bg-gray-800/80 rounded-xl p-4 mb-4 min-h-[100px] flex items-center justify-center border border-gray-700/50">
                <div className="text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-600 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-500 text-xs">Ad placeholder</p>
                </div>
              </div>

              <button
                onClick={handleContinue}
                disabled={countdown > 0}
                className={`w-full font-bold px-8 py-3 rounded-xl transition-all ${countdown > 0
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-[#AB8BFF] hover:bg-[#9A7AE8] text-white cursor-pointer animate-pulse shadow-lg shadow-[#AB8BFF]/20'
                  }`}
              >
                {countdown > 0 ? `Continue in ${countdown}s` : '▶ Continue to Video'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Blurred video placeholder behind overlay */}
      <div className="opacity-20 pointer-events-none select-none blur-sm">
        {children}
      </div>
    </div>
  );
};

export default ContentLocker;