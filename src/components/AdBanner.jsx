import { useAuth } from '../context/AuthContext';

const AdBanner = ({ position = 'sidebar', format = 'banner' }) => {
  const { isPremium } = useAuth();

  // Premium users never see ads
  if (isPremium) return null;

  const sizeClasses = {
    banner: 'w-full h-[90px]',
    sidebar: 'w-full min-h-[250px]',
    leaderboard: 'w-full h-[90px]',
  };

  return (
    <div className={`${sizeClasses[format] || sizeClasses.banner} bg-dark-100/50 rounded-xl border border-light-100/10 flex items-center justify-center overflow-hidden`}>
      <div className="text-center p-4">
        <p className="text-gray-100 text-xs mb-1">Sponsored Content</p>
        {/* 
          In production, replace the div below with your ad network snippet.
          
          Google AdSense example:
          <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
          <ins class="adsbygoogle"
               style="display:block"
               data-ad-client="ca-pub-XXXXXXXXXXXXXX"
               data-ad-slot="XXXXXXXXXX"
               data-ad-format="auto"
               data-full-width-responsive="true"></ins>
          <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
        */}
        <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 rounded-lg p-3 border border-light-100/5">
          <p className="text-light-200 text-sm">Advertisement Space</p>
          <p className="text-gray-100 text-xs mt-1">Upgrade to Premium to remove ads</p>
        </div>
      </div>
    </div>
  );
};

export default AdBanner;