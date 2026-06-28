import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSourceCount, EMBED_SOURCES } from '../sources';
import { loadAdminConfig, saveAdminConfig } from '../appwrite';
import SEO from '../components/SEO';
import PageLayout from '../components/layout/PageLayout';
import { tmdbFetch } from '../utils/tmdb';

const STORAGE_KEYS = {
  AD_CONFIG: 'cinevault_ad_config',
  SOURCES: 'cinevault_sources',
  AFFILIATES: 'cinevault_affiliates',
  SITE_CONFIG: 'cinevault_site_config',
  REVENUE: 'cinevault_revenue',
  VISITORS: 'cinevault_visitors',
};

const DEFAULT_AD_CONFIG = {
  banner: { enabled: true, code: '' },
  sidebar: { enabled: true, code: '' },
  leaderboard: { enabled: true, code: '' },
  popup: { enabled: false, code: '' },
  preroll: { enabled: false, code: '' },
};

const DEFAULT_SITE_CONFIG = {
  siteName: 'CineVault',
  tagline: 'Watch Movies & TV Shows Free',
  contactEmail: 'admin@cinevault.com',
  footerLinks: true,
  showDonate: true,
  showAffiliates: true,
};

const DEFAULT_AFFILIATES = [
  {
    id: '1',
    name: 'Amazon',
    url: 'https://www.amazon.com/s?k={title}+movie+poster&tag=your-tag-20',
    label: 'Buy Poster on Amazon',
    icon: '🖼️',
    enabled: true,
  },
  {
    id: '2',
    name: 'NordVPN',
    url: 'https://go.nordvpn.net/aff_c?offer_id=15&aff_id=your-id',
    label: 'Protect Your Privacy with NordVPN',
    icon: '🔒',
    enabled: true,
  },
];

const PLANS = [
  { name: 'Free', price: '$0', ads: true, quality: '720p', sources: '1 source' },
  { name: 'Basic', price: '$4.99/mo', ads: false, quality: '1080p', sources: '2 sources' },
  { name: 'Premium', price: '$9.99/mo', ads: false, quality: '4K', sources: 'All sources' },
];

// Load state from localStorage with fallback
function loadState(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

const AdminPage = () => {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [configLoaded, setConfigLoaded] = useState(false);

  // Persistent configs
  const [adConfig, setAdConfig] = useState(() => loadState(STORAGE_KEYS.AD_CONFIG, DEFAULT_AD_CONFIG));
  const [affiliates, setAffiliates] = useState(() => loadState(STORAGE_KEYS.AFFILIATES, DEFAULT_AFFILIATES));
  const [siteConfig, setSiteConfig] = useState(() => loadState(STORAGE_KEYS.SITE_CONFIG, DEFAULT_SITE_CONFIG));
  const [revenue, setRevenue] = useState(() => loadState(STORAGE_KEYS.REVENUE, null));
  const [visitors, setVisitors] = useState(() => loadState(STORAGE_KEYS.VISITORS, null));
  const [sourceCount, setSourceCount] = useState(getSourceCount());

  // UI state
  const [newAffiliate, setNewAffiliate] = useState({ name: '', url: '', label: '', icon: '🔗' });
  const [toast, setToast] = useState(null);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login', { replace: true });
      } else if (!isAdmin) {
        navigate('/home', { replace: true });
      }
    }
  }, [user, isAdmin, authLoading, navigate]);

  // Load admin config from Appwrite on mount
  useEffect(() => {
    const loadFromAppwrite = async () => {
      try {
        const remote = await loadAdminConfig();
        if (remote && remote.adConfig) {
          setAdConfig(JSON.parse(remote.adConfig));
          setSiteConfig(JSON.parse(remote.siteConfig || '{}'));
          setAffiliates(JSON.parse(remote.affiliates || '[]'));
          if (remote.revenue) setRevenue(JSON.parse(remote.revenue));
          if (remote.visitors) setVisitors(JSON.parse(remote.visitors));
        }
      } catch (err) {
        // Fallback to localStorage already applied via loadState
        console.warn('Admin config load from Appwrite failed, using localStorage:', err.message);
      } finally {
        setConfigLoaded(true);
      }
    };
    loadFromAppwrite();
  }, []);

  // Save configs to localStorage AND Appwrite on change
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.AD_CONFIG, JSON.stringify(adConfig)); }, [adConfig]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.AFFILIATES, JSON.stringify(affiliates)); }, [affiliates]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.SITE_CONFIG, JSON.stringify(siteConfig)); }, [siteConfig]);

  // Sync to Appwrite whenever config changes (debounced)
  useEffect(() => {
    if (!configLoaded) return;
    const timer = setTimeout(() => {
      saveAdminConfig({
        adConfig,
        siteConfig,
        affiliates,
        revenue,
        visitors,
      });
    }, 2000); // 2-second debounce to avoid rapid writes
    return () => clearTimeout(timer);
  }, [adConfig, siteConfig, affiliates, revenue, visitors, configLoaded]);

  // Initialize revenue if not set
  useEffect(() => {
    if (!revenue) {
      const initialRevenue = {
        total: 1247.80,
        monthly: 385.50,
        adRevenue: 210.30,
        donations: 45.00,
        premiumSubs: 130.20,
        byMonth: generateDummyRevenue(),
      };
      setRevenue(initialRevenue);
      localStorage.setItem(STORAGE_KEYS.REVENUE, JSON.stringify(initialRevenue));
    }
    if (!visitors) {
      const initialVisitors = { today: 1247, thisWeek: 8942, thisMonth: 38124, topContent: generateTopContent() };
      setVisitors(initialVisitors);
      localStorage.setItem(STORAGE_KEYS.VISITORS, JSON.stringify(initialVisitors));
    }
  }, []);

  // Fetch TMDB stats (via the /api/tmdb-proxy serverless fn so the key stays secret)
  useEffect(() => {
    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const [trending, movies, tv] = await Promise.all([
          tmdbFetch('/trending/all/day', { language: 'en-US', page: 1 }),
          tmdbFetch('/discover/movie', { language: 'en-US', page: 1, sort_by: 'popularity.desc' }),
          tmdbFetch('/discover/tv', { language: 'en-US', page: 1, sort_by: 'popularity.desc' }),
        ]);

        setStats({
          trending: trending.results?.slice(0, 5) || [],
          totalMovies: movies.total_results || 0,
          totalTV: tv.total_results || 0,
          sourceCount: getSourceCount(),
        });
      } catch (err) {
        console.error('Failed to fetch TMDB stats', err);
        setStats({ trending: [], totalMovies: 0, totalTV: 0, sourceCount: getSourceCount() });
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  function generateDummyRevenue() {
    const months = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const base = 200 + Math.random() * 300;
      months.push({
        month: d.toLocaleString('default', { month: 'short' }),
        year: d.getFullYear(),
        ads: Math.round(base * 0.4),
        donations: Math.round(base * 0.1),
        premium: Math.round(base * 0.3),
        total: Math.round(base),
      });
    }
    return months;
  }

  function generateTopContent() {
    const titles = [
      'Inception', 'Stranger Things', 'The Batman', 'Game of Thrones',
      'Dune: Part Two', 'Breaking Bad', 'Oppenheimer', 'The Last of Us',
      'Interstellar', 'The Boys',
    ];
    return titles.map((t, i) => ({
      title: t,
      views: Math.round(5000 - i * 400 + Math.random() * 200),
      revenue: Math.round((5000 - i * 400) * 0.02),
    }));
  }

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const saveAdSlot = (slot, config) => {
    setAdConfig((prev) => ({ ...prev, [slot]: config }));
    showToast(`${slot.charAt(0).toUpperCase() + slot.slice(1)} ad settings saved`);
  };

  const addAffiliate = () => {
    if (!newAffiliate.name || !newAffiliate.url) {
      showToast('Name and URL are required');
      return;
    }
    setAffiliates((prev) => [...prev, { ...newAffiliate, id: Date.now().toString(), enabled: true }]);
    setNewAffiliate({ name: '', url: '', label: '', icon: '🔗' });
    showToast('Affiliate link added');
  };

  const removeAffiliate = (id) => {
    setAffiliates((prev) => prev.filter((a) => a.id !== id));
    showToast('Affiliate link removed');
  };

  const toggleAffiliate = (id) => {
    setAffiliates((prev) => prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)));
  };

  const formatCurrency = (n) => `$${n.toFixed(2)}`;

  if (authLoading) {
    return (
      <PageLayout variant="admin" pattern={false}>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div role="status">
            <svg aria-hidden="true" className="w-8 h-8 text-gray-600 animate-spin fill-red-600" viewBox="0 0 100 101">
              <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
              <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
            </svg>
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!user) return null;

  const TABS = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'ads', label: 'Ad Management', icon: '📢' },
    { id: 'sources', label: 'Streaming Sources', icon: '🎬' },
    { id: 'affiliates', label: 'Affiliate Links', icon: '🔗' },
    { id: 'plans', label: 'Premium Plans', icon: '⭐' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <PageLayout variant="admin" pattern={false}>
      <SEO
        title="Admin Dashboard - CineVault"
        description="Admin dashboard for CineVault. Manage ads, affiliates, site configuration, and view analytics."
        url="/admin"
        type="website"
        tags={['noindex']}
      />
      {/* Toast notification */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm animate-pulse">
          {toast}
        </div>
      )}

      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Admin Panel</h1>
          <p className="text-gray-400 mt-1">Monetization & Platform Management</p>
        </div>
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white text-sm font-bold">
            {user.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div>
            <p className="text-white text-sm font-medium">{user.name}</p>
            <p className="text-gray-500 text-xs">Administrator</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1 mb-8 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${activeTab === tab.id
              ? 'bg-red-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ===================== DASHBOARD ===================== */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Demo data disclaimer */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <span><strong>Notice:</strong> The financial and visitor statistics shown below are simulated placeholders/estimates for demonstration purposes.</span>
          </div>

          {/* Top Revenue Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-green-900/40 to-green-800/20 border border-green-700/30 rounded-2xl p-5">
              <p className="text-gray-400 text-xs uppercase tracking-wider">Total Revenue</p>
              <p className="text-3xl font-bold text-white mt-1">{revenue ? formatCurrency(revenue.total) : '—'}</p>
              <p className="text-green-400 text-xs mt-1">↑ 12.5% this month</p>
            </div>
            <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 border border-blue-700/30 rounded-2xl p-5">
              <p className="text-gray-400 text-xs uppercase tracking-wider">Monthly Revenue</p>
              <p className="text-3xl font-bold text-white mt-1">{revenue ? formatCurrency(revenue.monthly) : '—'}</p>
              <p className="text-blue-400 text-xs mt-1">Current month</p>
            </div>
            <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 border border-purple-700/30 rounded-2xl p-5">
              <p className="text-gray-400 text-xs uppercase tracking-wider">Total Visitors</p>
              <p className="text-3xl font-bold text-white mt-1">{visitors ? visitors.thisMonth.toLocaleString() : '—'}</p>
              <p className="text-purple-400 text-xs mt-1">{visitors ? visitors.today.toLocaleString() : ''} today</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-900/40 to-yellow-800/20 border border-yellow-700/30 rounded-2xl p-5">
              <p className="text-gray-400 text-xs uppercase tracking-wider">Content Available</p>
              <p className="text-3xl font-bold text-white mt-1">
                {statsLoading ? '...' : ((stats?.totalMovies || 0) + (stats?.totalTV || 0)).toLocaleString()}
              </p>
              <p className="text-yellow-400 text-xs mt-1">Via TMDB + {sourceCount} sources</p>
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <h3 className="text-white font-bold mb-3">Revenue Breakdown</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">📢 Ad Revenue</span>
                  <span className="text-white font-medium">{revenue ? formatCurrency(revenue.adRevenue) : '—'}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: revenue ? `${(revenue.adRevenue / revenue.monthly) * 100}%` : '0%' }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">⭐ Premium Subs</span>
                  <span className="text-white font-medium">{revenue ? formatCurrency(revenue.premiumSubs) : '—'}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: revenue ? `${(revenue.premiumSubs / revenue.monthly) * 100}%` : '0%' }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">☕ Donations</span>
                  <span className="text-white font-medium">{revenue ? formatCurrency(revenue.donations) : '—'}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: revenue ? `${(revenue.donations / revenue.monthly) * 100}%` : '0%' }} />
                </div>
              </div>
            </div>

            {/* Monthly Revenue Chart */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 lg:col-span-2">
              <h3 className="text-white font-bold mb-4">Revenue Trend (12 Months)</h3>
              <div className="flex items-end gap-2 h-40">
                {revenue?.byMonth.map((m, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div
                      className="w-full bg-gradient-to-t from-red-600 to-red-400 rounded-t hover:opacity-80 transition-opacity cursor-pointer"
                      style={{ height: `${(m.total / 600) * 100}%` }}
                      title={`${m.month} ${m.year}: ${formatCurrency(m.total)}`}
                    />
                    <span className="text-[10px] text-gray-500">{m.month}</span>
                    {/* Tooltip on hover */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {formatCurrency(m.total)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-red-500" /> Ads</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-purple-500" /> Premium</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-green-500" /> Donations</span>
              </div>
            </div>
          </div>

          {/* Top Content & Sources */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <h3 className="text-white font-bold mb-4">🔥 Top Content This Month</h3>
              <div className="space-y-2">
                {visitors?.topContent.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 text-sm w-5">{i + 1}.</span>
                      <span className="text-white text-sm">{item.title}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-gray-400">{item.views.toLocaleString()} views</span>
                      <span className="text-green-400">{formatCurrency(item.revenue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <h3 className="text-white font-bold mb-4">📊 Platform Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-gray-400 text-sm">Movies Available</span>
                  <span className="text-white font-medium">{statsLoading ? '...' : (stats?.totalMovies || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-gray-400 text-sm">TV Shows Available</span>
                  <span className="text-white font-medium">{statsLoading ? '...' : (stats?.totalTV || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-gray-400 text-sm">Streaming Sources</span>
                  <span className="text-white font-medium">{stats?.sourceCount || sourceCount}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-gray-400 text-sm">Premium Plans</span>
                  <span className="text-white font-medium">{PLANS.length}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-gray-400 text-sm">Ad Slots</span>
                  <span className="text-white font-medium">{Object.keys(adConfig).length}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-400 text-sm">Affiliate Links</span>
                  <span className="text-white font-medium">{affiliates.filter((a) => a.enabled).length} active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Trending Now (from TMDB) */}
          {stats?.trending?.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <h3 className="text-white font-bold mb-4">🔥 Trending Now (TMDB)</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {stats.trending.map((item, i) => (
                  <div key={item.id} className="bg-white/5 rounded-xl overflow-hidden group cursor-pointer">
                    <div className="aspect-[2/3] bg-gray-800 relative overflow-hidden">
                      {item.poster_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w200${item.poster_path}`}
                          alt={item.title || item.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">No Poster</div>
                      )}
                      <div className="absolute top-1 left-1">
                        <span className="text-[10px] font-bold bg-red-600 text-white px-1.5 py-0.5 rounded">
                          {item.media_type === 'tv' ? 'TV' : 'MOVIE'}
                        </span>
                      </div>
                    </div>
                    <div className="p-2">
                      <p className="text-white text-xs font-medium truncate">{item.title || item.name}</p>
                      <p className="text-gray-500 text-[10px]">{item.vote_average?.toFixed(1)} ★</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================== AD MANAGEMENT ===================== */}
      {activeTab === 'ads' && (
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h2 className="text-lg font-bold text-white mb-4">📢 Ad Slot Configuration</h2>
            <p className="text-gray-400 text-sm mb-6">
              Configure ad slots across the site. Paste your ad network code (AdSense, Media.net, etc.) in each slot.
              Ad slots are automatically hidden from premium users.
            </p>

            <div className="space-y-6">
              {Object.entries(adConfig).map(([slot, config]) => (
                <div key={slot} className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-white font-medium capitalize">{slot} Slot</h3>
                      <p className="text-gray-500 text-xs">
                        {slot === 'banner' && 'Shown on detail pages (90px height)'}
                        {slot === 'sidebar' && 'Shown on detail pages sidebar (250px min)'}
                        {slot === 'leaderboard' && 'Shown on browse/home pages (90px height)'}
                        {slot === 'popup' && 'Pop-up/pop-under on video page load'}
                        {slot === 'preroll' && 'Pre-roll ad before video starts'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enabled}
                        onChange={() => saveAdSlot(slot, { ...config, enabled: !config.enabled })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-white/10 rounded-full peer peer-checked:bg-red-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                    </label>
                  </div>
                  <textarea
                    value={config.code}
                    onChange={(e) => setAdConfig((prev) => ({ ...prev, [slot]: { ...prev[slot], code: e.target.value } }))}
                    placeholder={`Paste your ad code for the ${slot} slot here...\n\nExample:\n<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>\n<ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-XXXXXXXXXX" data-ad-slot="XXXXXXXXXX"></ins>`}
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder-gray-600 outline-none focus:border-red-500 transition-colors font-mono"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => saveAdSlot(slot, adConfig[slot])}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs font-medium px-4 py-1.5 rounded-lg transition-colors"
                    >
                      Save {slot} Settings
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ad Preview */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h3 className="text-white font-bold mb-3">Ad Preview (How it looks to users)</h3>
            <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 rounded-lg p-4 border border-white/5 text-center">
              <p className="text-gray-400 text-sm">Advertisement Space</p>
              <p className="text-gray-500 text-xs mt-1">Your ad will render here — premium users won't see ads</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-gray-400 text-xs uppercase">Active Ad Slots</p>
              <p className="text-white text-2xl font-bold">{Object.values(adConfig).filter((c) => c.enabled).length} / {Object.keys(adConfig).length}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-gray-400 text-xs uppercase">Est. Monthly Ad Rev</p>
              <p className="text-white text-2xl font-bold">{revenue ? formatCurrency(revenue.adRevenue) : '—'}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-gray-400 text-xs uppercase">Premium Users (ad-free)</p>
              <p className="text-white text-2xl font-bold">—</p>
              <p className="text-gray-500 text-xs">Connect Appwrite for live data</p>
            </div>
          </div>
        </div>
      )}

      {/* ===================== STREAMING SOURCES ===================== */}
      {activeTab === 'sources' && (
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white">🎬 Streaming Sources</h2>
                <p className="text-gray-400 text-sm">Manage embed sources — these provide the actual video streams for movies & TV shows</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-3 text-gray-400 font-medium">Source Name</th>
                    <th className="text-left py-3 px-3 text-gray-400 font-medium">Type</th>
                    <th className="text-left py-3 px-3 text-gray-400 font-medium">URL Pattern</th>
                    <th className="text-left py-3 px-3 text-gray-400 font-medium">Status</th>
                    <th className="text-right py-3 px-3 text-gray-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {EMBED_SOURCES.map((src, i) => {
                    let sampleUrl = '';
                    try {
                      sampleUrl = src.embedUrl('{id}', 'movie');
                    } catch {
                      sampleUrl = 'embed URL pattern';
                    }
                    return (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-3 px-3 text-white font-medium">{src.name}</td>
                        <td className="py-3 px-3">
                          <span className="bg-blue-900/40 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full">{src.type || 'embed'}</span>
                        </td>
                        <td className="py-3 px-3 text-gray-400 text-xs font-mono truncate max-w-[250px]">{sampleUrl}</td>
                        <td className="py-3 px-3">
                          <span className="bg-green-900/40 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full">Active</span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button className="text-gray-500 hover:text-white text-xs transition-colors disabled:opacity-30" disabled>
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-6 bg-blue-900/20 border border-blue-800/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-blue-400 text-lg">💡</span>
                <div>
                  <p className="text-blue-300 text-sm font-medium">To add more streaming sources</p>
                  <p className="text-gray-400 text-xs mt-1">
                    Edit the <code className="text-blue-300 bg-blue-900/30 px-1 rounded">src/sources.js</code> file directly to add more embed sources.
                    Sources are loaded in order and the VideoPlayer will cycle through them when users click "Switch Source."
                  </p>
                  <a
                    href="https://github.com/search?q=free+movie+embed+sources&type=repositories"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-blue-400 text-xs hover:underline"
                  >
                    Find more embed sources →
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Source stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-gray-400 text-xs uppercase">Active Sources</p>
              <p className="text-white text-2xl font-bold">{sourceCount}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-gray-400 text-xs uppercase">Movies Available</p>
              <p className="text-white text-2xl font-bold">{statsLoading ? '...' : (stats?.totalMovies || 0).toLocaleString()}</p>
              <p className="text-gray-500 text-xs">Via TMDB API</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-gray-400 text-xs uppercase">TV Shows Available</p>
              <p className="text-white text-2xl font-bold">{statsLoading ? '...' : (stats?.totalTV || 0).toLocaleString()}</p>
              <p className="text-gray-500 text-xs">Via TMDB API</p>
            </div>
          </div>
        </div>
      )}

      {/* ===================== AFFILIATE LINKS ===================== */}
      {activeTab === 'affiliates' && (
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h2 className="text-lg font-bold text-white mb-4">🔗 Affiliate Link Management</h2>
            <p className="text-gray-400 text-sm mb-6">
              Manage affiliate links shown on movie/TV detail pages. Each link uses the content title for dynamic URLs.
              Use <code className="text-blue-300 bg-blue-900/30 px-1 rounded">{'{title}'}</code> as placeholder for the movie/TV title.
            </p>

            {/* Add new affiliate */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/5 mb-6">
              <h3 className="text-white text-sm font-medium mb-3">Add New Affiliate Link</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Name (e.g., Amazon)"
                  value={newAffiliate.name}
                  onChange={(e) => setNewAffiliate((prev) => ({ ...prev, name: e.target.value }))}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 outline-none focus:border-red-500 transition-colors"
                />
                <input
                  type="text"
                  placeholder="Label (e.g., Buy on Amazon)"
                  value={newAffiliate.label}
                  onChange={(e) => setNewAffiliate((prev) => ({ ...prev, label: e.target.value }))}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 outline-none focus:border-red-500 transition-colors"
                />
                <input
                  type="text"
                  placeholder="URL (use {title})"
                  value={newAffiliate.url}
                  onChange={(e) => setNewAffiliate((prev) => ({ ...prev, url: e.target.value }))}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 outline-none focus:border-red-500 transition-colors font-mono"
                />
                <div className="flex gap-2">
                  <select
                    value={newAffiliate.icon}
                    onChange={(e) => setNewAffiliate((prev) => ({ ...prev, icon: e.target.value }))}
                    className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-white text-sm outline-none focus:border-red-500 transition-colors"
                  >
                    <option value="🖼️">🖼️ Poster</option>
                    <option value="🔒">🔒 Privacy</option>
                    <option value="📺">📺 TV</option>
                    <option value="🎮">🎮 Games</option>
                    <option value="📚">📚 Books</option>
                    <option value="👕">👕 Merch</option>
                    <option value="🔗">🔗 Link</option>
                  </select>
                  <button
                    onClick={addAffiliate}
                    className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
                  >
                    Add Link
                  </button>
                </div>
              </div>
            </div>

            {/* Existing affiliates */}
            {affiliates.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No affiliate links yet. Add your first one above.
              </div>
            ) : (
              <div className="space-y-2">
                {affiliates.map((aff) => (
                  <div key={aff.id} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 border border-white/5">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-xl">{aff.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium">{aff.name}</p>
                        <p className="text-gray-500 text-xs truncate">{aff.label}</p>
                        <p className="text-gray-600 text-[10px] font-mono truncate">{aff.url}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={aff.enabled}
                          onChange={() => toggleAffiliate(aff.id)}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-white/10 rounded-full peer peer-checked:bg-red-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all" />
                      </label>
                      <button
                        onClick={() => removeAffiliate(aff.id)}
                        className="text-red-400 hover:text-red-300 text-xs transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Revenue from affiliates */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h3 className="text-white font-bold mb-3">Affiliate Revenue</h3>
            <p className="text-gray-400 text-sm">
              Affiliate revenue tracking requires a backend integration with your affiliate networks.
              Connect Amazon Associates, NordVPN Affiliate, or other programs to track commissions.
            </p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-gray-400 text-xs uppercase">Active Links</p>
                <p className="text-white text-2xl font-bold">{affiliates.filter((a) => a.enabled).length}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-gray-400 text-xs uppercase">Total Affiliates</p>
                <p className="text-white text-2xl font-bold">{affiliates.length}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-gray-400 text-xs uppercase">Est. Monthly Commission</p>
                <p className="text-white text-2xl font-bold">—</p>
                <p className="text-gray-500 text-xs">Connect affiliate network</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== PREMIUM PLANS ===================== */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h2 className="text-lg font-bold text-white mb-4">⭐ Premium Plans</h2>
            <p className="text-gray-400 text-sm mb-6">
              Configure subscription plans. These are displayed on the pricing page.
              Actual payment processing requires Stripe/Paddle integration.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PLANS.map((plan, i) => (
                <div key={i} className={`rounded-2xl p-5 border ${i === 2 ? 'bg-gradient-to-b from-red-900/30 to-red-900/10 border-red-700/30' : 'bg-white/5 border-white/10'}`}>
                  {i === 2 && <span className="text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-full">POPULAR</span>}
                  <h3 className="text-white text-lg font-bold mt-2">{plan.name}</h3>
                  <p className="text-3xl font-bold text-white mt-2">{plan.price}</p>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className={plan.ads ? 'text-red-400' : 'text-green-400'}>{plan.ads ? '✕' : '✓'}</span>
                      <span className="text-gray-400">{plan.ads ? 'With Ads' : 'Ad-Free'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-green-400">✓</span>
                      <span className="text-gray-400">{plan.quality} Quality</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-green-400">✓</span>
                      <span className="text-gray-400">{plan.sources}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 bg-blue-900/20 border border-blue-800/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-blue-400 text-lg">💡</span>
                <div>
                  <p className="text-blue-300 text-sm font-medium">Monetization Tip</p>
                  <p className="text-gray-400 text-xs mt-1">
                    The free tier shows ads (via AdBanner component). Premium removes ads and unlocks all sources.
                    Connect Stripe via the Settings tab to start accepting payments.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== ANALYTICS ===================== */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h2 className="text-lg font-bold text-white mb-4">📈 Content Analytics</h2>
            <p className="text-gray-400 text-sm mb-6">
              Track what's being watched and searched. Data is fetched live from TMDB and your Appwrite search analytics.
            </p>

            {/* TMDB Live Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <p className="text-gray-400 text-xs uppercase">TMDB Movies</p>
                <p className="text-white text-2xl font-bold">{statsLoading ? '...' : (stats?.totalMovies || 0).toLocaleString()}</p>
                <p className="text-gray-500 text-xs">Available for streaming</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <p className="text-gray-400 text-xs uppercase">TMDB TV Shows</p>
                <p className="text-white text-2xl font-bold">{statsLoading ? '...' : (stats?.totalTV || 0).toLocaleString()}</p>
                <p className="text-gray-500 text-xs">Available for streaming</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <p className="text-gray-400 text-xs uppercase">Total Content</p>
                <p className="text-white text-2xl font-bold">
                  {statsLoading ? '...' : ((stats?.totalMovies || 0) + (stats?.totalTV || 0)).toLocaleString()}
                </p>
                <p className="text-gray-500 text-xs">Movies + TV Shows</p>
              </div>
            </div>

            {/* Trending from TMDB */}
            {stats?.trending?.length > 0 && (
              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <h3 className="text-white font-bold mb-3">🔥 Trending Today (from TMDB)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-2 px-2 text-gray-400 font-medium">#</th>
                        <th className="text-left py-2 px-2 text-gray-400 font-medium">Title</th>
                        <th className="text-left py-2 px-2 text-gray-400 font-medium">Type</th>
                        <th className="text-left py-2 px-2 text-gray-400 font-medium">Rating</th>
                        <th className="text-left py-2 px-2 text-gray-400 font-medium">Release</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.trending.slice(0, 10).map((item, i) => (
                        <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-2 px-2 text-gray-500">{i + 1}</td>
                          <td className="py-2 px-2 text-white">{item.title || item.name}</td>
                          <td className="py-2 px-2">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${item.media_type === 'tv' ? 'bg-purple-900/40 text-purple-400' : 'bg-blue-900/40 text-blue-400'}`}>
                              {item.media_type === 'tv' ? 'TV' : 'MOVIE'}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-yellow-400">{item.vote_average?.toFixed(1)}</td>
                          <td className="py-2 px-2 text-gray-400 text-xs">{item.release_date || item.first_air_date || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Search Analytics (Appwrite) */}
            <div className="mt-6 bg-white/5 rounded-xl p-4 border border-white/5">
              <h3 className="text-white font-bold mb-3">🔍 Search Analytics</h3>
              <p className="text-gray-400 text-sm">
                Search analytics are stored in your Appwrite database. Connect Appwrite to see:
              </p>
              <ul className="mt-3 space-y-2 text-gray-500 text-sm">
                <li className="flex items-center gap-2">• Most searched movies & TV shows</li>
                <li className="flex items-center gap-2">• Search trends over time</li>
                <li className="flex items-center gap-2">• User search behavior</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ===================== SETTINGS ===================== */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h2 className="text-lg font-bold text-white mb-4">⚙️ Platform Settings</h2>

            {/* Site Config */}
            <div className="space-y-4 mb-6">
              <h3 className="text-white text-sm font-medium">Site Configuration</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Site Name</label>
                  <input
                    type="text"
                    value={siteConfig.siteName}
                    onChange={(e) => setSiteConfig((prev) => ({ ...prev, siteName: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-red-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Tagline</label>
                  <input
                    type="text"
                    value={siteConfig.tagline}
                    onChange={(e) => setSiteConfig((prev) => ({ ...prev, tagline: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-red-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={siteConfig.contactEmail}
                    onChange={(e) => setSiteConfig((prev) => ({ ...prev, contactEmail: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-red-500 transition-colors"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <button
                    onClick={() => { localStorage.setItem(STORAGE_KEYS.SITE_CONFIG, JSON.stringify(siteConfig)); showToast('Settings saved'); }}
                    className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-6 py-2.5 rounded-xl transition-colors"
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            </div>

            {/* Feature Toggles */}
            <div className="space-y-4 border-t border-white/10 pt-6">
              <h3 className="text-white text-sm font-medium">Feature Toggles</h3>
              <div className="space-y-3">
                {[
                  { key: 'showDonate', label: 'Show Donation Button', desc: 'Display Buy Me a Coffee & tip buttons on detail pages' },
                  { key: 'showAffiliates', label: 'Show Affiliate Links', desc: 'Display affiliate product links on detail pages' },
                  { key: 'footerLinks', label: 'Show Footer Links', desc: 'Display Terms, Privacy, DMCA, Contact in footer' },
                ].map((feat) => (
                  <div key={feat.key} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-white text-sm">{feat.label}</p>
                      <p className="text-gray-500 text-xs">{feat.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={siteConfig[feat.key]}
                        onChange={() => setSiteConfig((prev) => ({ ...prev, [feat.key]: !prev[feat.key] }))}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-white/10 rounded-full peer peer-checked:bg-red-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* API Configuration */}
            <div className="space-y-4 border-t border-white/10 pt-6">
              <h3 className="text-white text-sm font-medium">API Configuration</h3>
              <div className="bg-white/5 rounded-xl p-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">TMDB API Key</label>
                    <input
                      type="text"
                      value="Server-side proxy (/api/tmdb-proxy)"
                      readOnly
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none cursor-not-allowed"
                    />
                    <p className="text-gray-500 text-xs mt-1">API key is hidden server-side. Set <code className="text-blue-300 bg-blue-900/30 px-1 rounded">TMDB_API_KEY</code> in Vercel → Settings → Env Vars.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Appwrite Endpoint</label>
                    <input
                      type="text"
                      value={import.meta.env.VITE_APPWRITE_ENDPOINT || 'Not configured'}
                      readOnly
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none cursor-not-allowed"
                    />
                    <p className="text-gray-500 text-xs mt-1">Configured via environment variables in .env.local</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Management */}
            <div className="space-y-4 border-t border-white/10 pt-6">
              <h3 className="text-white text-sm font-medium">Data Management</h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    localStorage.removeItem(STORAGE_KEYS.REVENUE);
                    localStorage.removeItem(STORAGE_KEYS.VISITORS);
                    setRevenue(null);
                    setVisitors(null);
                    window.location.reload();
                  }}
                  className="bg-yellow-600/20 border border-yellow-600/30 text-yellow-400 text-sm px-4 py-2 rounded-xl hover:bg-yellow-600/30 transition-colors"
                >
                  Reset Analytics Data
                </button>
                <button
                  onClick={() => {
                    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
                    window.location.reload();
                  }}
                  className="bg-red-600/20 border border-red-600/30 text-red-400 text-sm px-4 py-2 rounded-xl hover:bg-red-600/30 transition-colors"
                >
                  Reset All Admin Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default AdminPage;