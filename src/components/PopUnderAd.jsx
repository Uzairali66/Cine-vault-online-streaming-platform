import { useEffect } from 'react';
import { AD_CONFIG } from '../config/site';

/**
 * PopUnderAd Component
 *
 * Opens a new tab/window in the background when user first interacts with the page.
 * This is how hdmovie2 makes most of their ad revenue.
 * - Fires ONLY ONCE per session (tracked in sessionStorage)
 * - Opens in the background so user doesn't notice immediately
 *
 * ⚠️ CONFIGURATION:
 * The pop-under URL lives in src/config/site.js -> AD_CONFIG.POPUNDER_URL.
 * Get one from: https://propellerads.com or https://popads.net
 * Until POPUNDER_URL is set, this component is a no-op.
 */

const POPUNDER_KEY = 'cinevault_popunder_shown';
const POPUNDER_URL = AD_CONFIG.POPUNDER_URL || '';

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
    console.log('PopUnderAd disabled — set AD_CONFIG.POPUNDER_URL in src/config/site.js');
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
