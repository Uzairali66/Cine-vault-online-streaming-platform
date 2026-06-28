import { useEffect } from 'react';

/**
 * PopUnderAd Component
 *
 * Opens a new tab/window in the background when user first interacts with the page.
 * This is how hdmovie2 makes most of their ad revenue.
 * - Fires ONLY ONCE per session (tracked in sessionStorage)
 * - Opens in the background so user doesn't notice immediately
 * - Replace `AD_URL` with your actual PropellerAds/PopAds pop-under URL
 *
 * ⚠️ CURRENTLY DISABLED — replace POPUNDER_URL below with a real ad network URL to enable.
 * Get one from: https://propellerads.com or https://popads.net
 */

const POPUNDER_KEY = 'cinevault_popunder_shown';

// 🔁 REPLACE THIS with your actual popunder URL from PropellerAds/PopAds
const POPUNDER_URL = ''; // ← Set this to your real ad URL to enable

const PopUnderAd = () => {
  useEffect(() => {
    if (!POPUNDER_URL) return; // Disabled until configured

    const alreadyShown = sessionStorage.getItem(POPUNDER_KEY);
    if (alreadyShown) return;

    const timer = setTimeout(() => {
      try {
        const popUnder = window.open(POPUNDER_URL, '_blank');
        if (popUnder) {
          popUnder.blur();
          window.focus();
        }
        sessionStorage.setItem(POPUNDER_KEY, 'true');
      } catch {
        // Silent fail
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return null;
};

/**
 * Manually trigger a popunder (call this on button clicks).
 * Stores in sessionStorage so it only fires once per session.
 */
export function triggerPopUnder() {
  if (!POPUNDER_URL) {
    console.log('🔕 PopUnderAd disabled — set POPUNDER_URL in PopUnderAd.jsx');
    return;
  }

  const alreadyShown = sessionStorage.getItem(POPUNDER_KEY);
  if (alreadyShown) return;

  try {
    const popUnder = window.open(POPUNDER_URL, '_blank');
    if (popUnder) {
      popUnder.blur();
      window.focus();
    }
    sessionStorage.setItem(POPUNDER_KEY, 'true');
  } catch {
    // silent
  }
}

export default PopUnderAd;