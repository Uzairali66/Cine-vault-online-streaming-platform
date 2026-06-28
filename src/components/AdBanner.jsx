import { useAuth } from '../context/AuthContext';
import { AD_CONFIG } from '../config/site';

/**
 * AdBanner Component — config-driven ad slot.
 *
 * HOW TO TURN ON REAL ADS:
 * 1. Get approved by an ad network (PropellerAds / PopAds / AdSense).
 * 2. Open src/config/site.js
 * 3. Set AD_CONFIG.ENABLED = true
 * 4. Paste your ad HTML snippet into AD_CONFIG.BANNER_HTML
 * 5. Rebuild — every AdBanner across the site now shows real ads.
 *
 * Until then, a labelled placeholder is shown so you can see where
 * ads will appear.
 */
const AdBanner = ({ position = 'sidebar', format = 'banner' }) => {
  const { isPremium } = useAuth();

  // Premium users never see ads
  if (isPremium) return null;

  const sizeClasses = {
    banner: 'w-full h-[90px]',
    sidebar: 'w-full min-h-[250px]',
    leaderboard: 'w-full h-[90px]',
  };

  // ─── LIVE AD MODE ───
  // Render the real ad-network snippet injected via the config.
  if (AD_CONFIG.ENABLED && AD_CONFIG.BANNER_HTML) {
    return (
      <div
        className={`${sizeClasses[format] || sizeClasses.banner} overflow-hidden`}
        data-ad-position={position}
        data-ad-format={format}
        dangerouslySetInnerHTML={{ __html: AD_CONFIG.BANNER_HTML }}
      />
    );
  }

  // ─── PLACEHOLDER MODE (no ad code configured yet) ───
  return (
    <div className={`${sizeClasses[format] || sizeClasses.banner} bg-dark-100/50 rounded-xl border border-light-100/10 flex items-center justify-center overflow-hidden`}>
      <div className="text-center p-4">
        <p className="text-gray-100 text-xs mb-1">Sponsored Content</p>
        <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 rounded-lg p-3 border border-light-100/5">
          <p className="text-light-200 text-sm">Advertisement Space</p>
          <p className="text-gray-100 text-xs mt-1">
            Ads activate once you paste your ad code in <code className="text-[#AB8BFF]">src/config/site.js</code>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdBanner;
