import { useState } from 'react';
import DirectPlayer from '../components/DirectPlayer';
import AdBanner from '../components/AdBanner';
import SEO from '../components/SEO';
import PageLayout from '../components/layout/PageLayout';
import PageHeader from '../components/layout/PageHeader';

const DIRECT_MP4_SRC = 'https://akamd1.jw-cdn.org/sg2/p/3e69b8/1/o/lffv_E_251_r720P.mp4';

const DirectWatchPage = () => {
  const [playerError, setPlayerError] = useState(false);

  return (
    <>
      <SEO
        title="Direct Stream — CineVault"
        description="Direct MP4 video streaming with premium controls."
        url="/direct-watch"
      />

      <PageLayout width="5xl">
        <PageHeader
          title="Direct Stream"
          description="Direct MP4 playback with premium controls — no ads, no iframes."
        />

        <div className="mb-8">
          <DirectPlayer
            src={DIRECT_MP4_SRC}
            title="Direct MP4 Stream"
            onError={() => setPlayerError(true)}
          />
        </div>

        <div className="bg-dark-100 rounded-2xl p-6 shadow-inner shadow-light-100/5 mb-6">
          <h2 className="text-white font-semibold text-lg mb-3">Stream Info</h2>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Source: Direct MP4 (720p)
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Format: H.264 / AAC
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Controls: Play/Pause, Volume, Speed, Fullscreen
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Keyboard: Space (play/pause), F (fullscreen), M (mute), ← → (seek)
            </li>
          </ul>
        </div>

        {playerError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center mb-6">
            <p className="text-red-400 font-medium mb-1">Stream unavailable</p>
            <p className="text-gray-400 text-sm">
              The direct video source could not be loaded. Try refreshing or check back later.
            </p>
          </div>
        )}

        <AdBanner format="leaderboard" />
      </PageLayout>
    </>
  );
};

export default DirectWatchPage;
