import { useAuth } from '../context/AuthContext';

/**
 * InGridAd Component
 *
 * A native ad card that appears between movie cards in grid layouts.
 * Matches the visual style of MovieCard so it blends naturally.
 * This is exactly what hdmovie2 does — native ads that look like content.
 */

const InGridAd = ({ position = 0 }) => {
  const { isPremium } = useAuth();

  // Premium users never see ads
  if (isPremium) return null;

  return (
    <div className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 rounded-2xl border border-purple-500/20 overflow-hidden group hover:border-purple-500/40 transition-all duration-300 flex flex-col">
      {/* Ad Label */}
      <div className="px-3 pt-3 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">Sponsored</span>
        <svg className="h-3 w-3 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      {/* Ad Content Area — REPLACE with real ad network code */}
      <div className="flex-1 flex items-center justify-center p-4 min-h-[180px]">
        <div className="text-center">
          {/* 🔁 Replace with actual ad snippet from PropellerAds / PopAds / AdSense */}
          <div className="bg-gradient-to-r from-purple-800/20 to-indigo-800/20 rounded-xl p-6 border border-purple-500/10">
            <svg className="h-10 w-10 text-purple-500/40 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-400 text-sm font-medium">Advertisement</p>
            <p className="text-gray-600 text-xs mt-1">Support free streaming</p>
          </div>
        </div>
      </div>

      {/* Fake "title" to match MovieCard layout */}
      <div className="px-3 pb-3">
        <div className="h-3 bg-purple-900/30 rounded w-3/4 mx-auto" />
      </div>
    </div>
  );
};

export default InGridAd;