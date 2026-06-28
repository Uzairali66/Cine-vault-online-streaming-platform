import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = [
  { label: 'Home', path: '/home' },
  { label: 'Explore', path: '/browse' },
  { label: 'Movies', path: '/browse?mediaType=movie' },
  { label: 'TV Shows', path: '/browse?mediaType=tv' },
];

const Header = () => {
  const { user, isPremium, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const searchRef = useRef(null);
  const userMenuRef = useRef(null);

  // Track scroll for header background
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close search on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setUserMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/browse?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    const [basePath, queryString] = path.split('?');
    if (queryString) {
      // Links with query params (Movies/TV Shows) require exact search match
      return location.pathname.startsWith(basePath) && location.search === `?${queryString}`;
    }
    // Links without query params (Browse) only match when no search params exist
    return location.pathname.startsWith(basePath) && !location.search;
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
        ? 'bg-black/95 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.5)] border-b border-white/[0.06]'
        : 'bg-gradient-to-b from-black/90 via-black/60 to-transparent'
        }`}
    >
      <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 flex items-center justify-between h-16 sm:h-20 gap-2">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-4 sm:gap-8 min-w-0">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0 group">
            <span className="bg-gradient-to-r from-violet-500 via-violet-400 to-purple-400 bg-clip-text text-transparent text-xl xs:text-2xl sm:text-3xl font-extrabold tracking-tight drop-shadow-[0_0_12px_rgba(139,92,246,0.3)] group-hover:drop-shadow-[0_0_20px_rgba(139,92,246,0.5)] transition-all duration-300">
              CineVault
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${isActive(link.path)
                  ? 'text-white bg-white/10'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                {link.label}
                {isActive(link.path) && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-violet-500 to-purple-400 rounded-full" />
                )}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right: Search + User */}
        <div className="flex items-center gap-1 xs:gap-2 shrink-0">
          {/* Search */}
          <div className="relative" ref={searchRef}>
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search movies..."
                  autoFocus
                  className="w-32 xs:w-40 sm:w-56 bg-white/[0.07] border border-white/10 rounded-xl px-3 sm:px-4 py-1.5 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500/50 focus:bg-white/[0.10] focus:shadow-[0_0_15px_rgba(139,92,246,0.1)] transition-all duration-300"
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="ml-2 text-gray-500 hover:text-white transition-colors p-1"
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
                aria-label="Open search"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>

          {/* User Menu / Login */}
          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 text-gray-300 hover:text-white transition-all duration-300 px-2 py-1.5 rounded-lg hover:bg-white/5"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-[0_0_12px_rgba(139,92,246,0.3)]">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <svg className={`h-4 w-4 transition-transform duration-300 ${userMenuOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-3 w-56 max-w-[calc(100vw-1rem)] origin-top-right animate-dropdown-in bg-neutral-900/98 backdrop-blur-2xl border border-white/[0.07] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.05)_inset] overflow-hidden">
                  {/* Profile Header */}
                  <div className="px-4 py-4 border-b border-white/[0.06]">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white text-base font-bold shrink-0 shadow-lg">
                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-semibold truncate leading-tight">{user.name}</p>
                        <p className="text-gray-500 text-[11px] truncate mt-0.5">{user.email}</p>
                        {isPremium && (
                          <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] uppercase tracking-wider font-bold bg-gradient-to-r from-yellow-400/20 to-yellow-500/20 text-yellow-400 border border-yellow-400/20 px-2 py-0.5 rounded-full">
                            <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            Premium
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1.5">
                    <Link
                      to="/home"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/[0.07] hover:text-white transition-all duration-200 group"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <svg className="w-4 h-4 text-gray-500 group-hover:text-gray-300 transition-colors" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                      </svg>
                      <span>Home</span>
                    </Link>
                    <Link
                      to="/browse"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/[0.07] hover:text-white transition-all duration-200 group"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <svg className="w-4 h-4 text-gray-500 group-hover:text-gray-300 transition-colors" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 014.383 8.823l2.647 2.647a.75.75 0 11-1.06 1.06l-2.647-2.647A5.5 5.5 0 119 3.5zm0 1.5a4 4 0 100 8 4 4 0 000-8z" clipRule="evenodd" />
                      </svg>
                      <span>Explore</span>
                    </Link>
                    <Link
                      to="/browse?mediaType=movie"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/[0.07] hover:text-white transition-all duration-200 group"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <svg className="w-4 h-4 text-gray-500 group-hover:text-gray-300 transition-colors" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm3 2h6v4H7V5zm8 8v2h1v-2h-1zm-2-2H7v4h6v-4zm2 0h1V9h-1v2zm1-4V5h-1v2h1zM5 5v2H4V5h1zm0 4H4v2h1V9zm-1 4h1v2H4v-2z" clipRule="evenodd" />
                      </svg>
                      <span>Movies</span>
                    </Link>
                    <Link
                      to="/browse?mediaType=tv"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/[0.07] hover:text-white transition-all duration-200 group"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <svg className="w-4 h-4 text-gray-500 group-hover:text-gray-300 transition-colors" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm4.5 7.5a.5.5 0 01.5-.5h6a.5.5 0 010 1H7a.5.5 0 01-.5-.5z" />
                      </svg>
                      <span>TV Shows</span>
                    </Link>
                  </div>

                  <div className="border-t border-white/[0.06] py-1.5">
                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/[0.07] hover:text-white transition-all duration-200 group"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <svg className="w-4 h-4 text-gray-500 group-hover:text-gray-300 transition-colors" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                        </svg>
                        <span>Admin Panel</span>
                      </Link>
                    )}
                    {!isPremium && (
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          navigate('/signup?plan=premium');
                        }}
                        className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm text-yellow-400 hover:bg-white/[0.07] transition-all duration-200 group"
                      >
                        <svg className="w-4 h-4 text-yellow-500/70 group-hover:text-yellow-400 transition-colors" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span>Upgrade to Premium</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                        navigate('/');
                      }}
                      className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm text-gray-400 hover:bg-white/[0.07] hover:text-white transition-all duration-200 group border-t border-white/[0.06] mt-1 pt-2.5"
                    >
                      <svg className="w-4 h-4 text-gray-500 group-hover:text-gray-300 transition-colors" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm11 4.414l-4.293 4.293a1 1 0 01-1.414-1.414L12.586 6H9a1 1 0 010-2h6a1 1 0 011 1v6a1 1 0 01-2 0V7.414z" clipRule="evenodd" />
                      </svg>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1 xs:gap-2">
              <Link
                to="/login"
                className="hidden xs:inline text-sm text-gray-400 hover:text-white transition-colors px-2 sm:px-3 py-1.5"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="text-xs xs:text-sm bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-500 hover:to-purple-400 text-white font-semibold px-3 xs:px-4 sm:px-5 py-1.5 rounded-xl transition-all duration-300 shadow-[0_0_12px_rgba(139,92,246,0.25)] hover:shadow-[0_0_20px_rgba(139,92,246,0.4)]"
              >
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMenuOpen(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-dropdown-in" />
        </div>
      )}

      {/* Mobile Menu Panel */}
      <div
        className={`fixed top-16 sm:top-20 right-0 z-50 w-[280px] max-w-[88vw] h-[calc(100dvh-4rem)] sm:h-[calc(100dvh-5rem)] bg-neutral-950/98 backdrop-blur-2xl border-l border-white/[0.06] shadow-[-10px_0_40px_rgba(0,0,0,0.5)] transition-transform duration-300 ease-out md:hidden ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <nav className="px-4 py-4 space-y-1 overflow-y-auto max-h-full pb-safe">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMenuOpen(false)}
              className={`block px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${isActive(link.path)
                ? 'text-white bg-white/10'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              {link.label}
            </Link>
          ))}
          <hr className="border-white/[0.06] my-3" />
          {user ? (
            <>
              <div className="px-3 py-3 flex items-center gap-3 border-b border-white/[0.06] mb-2">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm font-semibold truncate">{user.name}</p>
                  <p className="text-gray-500 text-xs truncate">{user.email}</p>
                </div>
              </div>
              {!isPremium && (
                <Link
                  to="/signup?plan=premium"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm text-yellow-400 hover:text-yellow-300 hover:bg-white/5 rounded-lg transition-all duration-200"
                >
                  <svg className="w-4 h-4 text-yellow-500/70" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Upgrade to Premium
                </Link>
              )}
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                  setMenuOpen(false);
                }}
                className="flex items-center gap-2 w-full text-left px-3 py-2.5 text-sm text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200"
              >
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm11 4.414l-4.293 4.293a1 1 0 01-1.414-1.414L12.586 6H9a1 1 0 010-2h6a1 1 0 011 1v6a1 1 0 01-2 0V7.414z" clipRule="evenodd" />
                </svg>
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-3 text-sm bg-gradient-to-r from-violet-600 to-purple-500 text-white font-semibold rounded-lg text-center transition-all duration-200"
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;