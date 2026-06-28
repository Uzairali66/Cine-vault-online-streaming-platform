import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import AdBanner from '../components/AdBanner';
import PageLayout from '../components/layout/PageLayout';
import { fetchKoreanContent } from '../utils/languages';

const FEATURES = [
  {
    icon: (
      <svg className="h-8 w-8 text-violet-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621 [truncated...]" />
      </svg>
    ),
    title: 'Unlimited Movies & TV',
    description: 'Stream thousands of movies and TV shows on demand. New titles added every week.',
  },
  {
    icon: (
      <svg className="h-8 w-8 text-violet-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
      </svg>
    ),
    title: 'Watch Anywhere',
    description: 'Available on your TV, computer, phone, and tablet. Seamless streaming across all your devices.',
  },
  {
    icon: (
      <svg className="h-8 w-8 text-violet-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
    title: 'Ad-Free Premium',
    description: 'Upgrade to Premium for an uninterrupted, ad-free experience with the highest quality streams.',
  },
  {
    icon: (
      <svg className="h-8 w-8 text-violet-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
    title: 'Top Rated Content',
    description: 'Curated collection of the highest-rated movies and TV shows, handpicked for quality.',
  },
];

const FAQ_ITEMS = [
  {
    q: 'What is CineVault?',
    a: 'CineVault is a streaming platform that offers a vast library of movies and TV shows. You can watch instantly from any device with an internet connection.',
  },
  {
    q: 'How much does it cost?',
    a: 'We offer a free tier with ads and a Premium subscription for an ad-free experience. Premium gives you access to the highest quality streams and exclusive content.',
  },
  {
    q: 'Where can I watch?',
    a: 'You can watch on any device with a modern web browser — desktop computers, laptops, tablets, and smartphones.',
  },
  {
    q: 'How do I cancel?',
    a: 'You can cancel your subscription at any time. Your Premium benefits will continue until the end of your billing period.',
  },
];

const LandingPage = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  // Korean content state
  const [koreanContent, setKoreanContent] = useState([]);
  const [isLoadingKorean, setIsLoadingKorean] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      navigate('/browse', { replace: true });
    }
  }, [user, navigate, isLoading]);

  // Fetch Korean content on mount
  useEffect(() => {
    const loadKorean = async () => {
      setIsLoadingKorean(true);
      const results = await fetchKoreanContent(1);
      setKoreanContent(results.slice(0, 12));
      setIsLoadingKorean(false);
    };
    loadKorean();
  }, []);

  return (
    <PageLayout variant="hero">
      <SEO
        title="CineVault - Watch Free Movies & TV Shows Online"
        description="Stream thousands of movies and TV shows on demand for free. Watch anywhere, anytime. Sign up for free and start watching instantly."
        image="/hero.png"
        url="/"
        type="website"
      />
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-primary to-primary z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/20 via-transparent to-transparent" />

        {/* Animated background elements */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl animate-pulse delay-1000" />

        {/* Hero Content */}
        <div className="relative z-20 text-center px-4 sm:px-6 max-w-4xl mx-auto">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white leading-tight mb-6">
            Unlimited{' '}
            <span className="bg-gradient-to-r from-violet-500 to-violet-700 bg-clip-text text-transparent">
              Movies
            </span>
            ,{' '}
            <span className="bg-gradient-to-r from-violet-500 to-violet-700 bg-clip-text text-transparent">
              TV Shows
            </span>
            {' '}& More
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Watch anywhere, anytime. Sign up for free and start streaming instantly.
            No contracts, no hidden fees.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white font-bold text-lg px-10 py-4 rounded-xl transition-all duration-300 shadow-lg shadow-violet-600/25 hover:shadow-violet-600/40"
            >
              Get Started Free
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto border border-white/20 hover:border-white/40 text-gray-300 hover:text-white font-medium text-lg px-10 py-4 rounded-xl transition-all duration-300"
            >
              Sign In
            </Link>
          </div>

          {/* Social Proof */}
          <p className="mt-8 text-sm text-gray-500">
            <span className="text-gray-400 font-semibold">10,000+</span> movies and TV shows available
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 animate-bounce">
          <svg className="h-8 w-8 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="landing-section">
        <div className="landing-section-inner">
          <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-4">
            Why Choose <span className="text-violet-500">CineVault</span>?
          </h2>
          <p className="text-gray-400 text-center max-w-2xl mx-auto mb-16">
            Everything you need for the ultimate streaming experience
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 group"
              >
                <div className="mb-4 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === Korean Movies & K-Dramas Section === */}
      <section className="landing-section bg-gradient-to-b from-transparent via-violet-900/5 to-transparent">
        <div className="landing-section-inner">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                <span className="text-violet-500">Korean</span> Movies & K-Dramas
              </h2>
              <p className="text-gray-400 max-w-2xl">
                Discover the best of Korean cinema and K-Dramas, with English and Hindi dubbed options available
              </p>
            </div>
            <Link
              to="/browse"
              className="hidden sm:inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-medium px-6 py-3 rounded-xl transition-all duration-300 text-sm"
            >
              Browse All
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>

          {isLoadingKorean ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex items-center gap-3 text-gray-400">
                <svg className="animate-spin h-6 w-6 text-violet-500" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Loading Korean content...
              </div>
            </div>
          ) : koreanContent.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {koreanContent.map((item) => (
                <Link
                  key={`${item.media_type}-${item.id}`}
                  to={`/${item.media_type === 'tv' ? 'tv' : 'movie'}/${item.id}`}
                  className="group cursor-pointer"
                >
                  <div className="relative rounded-xl overflow-hidden shadow-lg transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-violet-600/20">
                    <img
                      src={item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : '/no-movie.png'}
                      alt={item.title || item.name}
                      loading="lazy"
                      className="w-full aspect-[2/3] object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute top-2 left-2 flex gap-1">
                      <span className="bg-violet-600/90 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                        {item.media_type === 'tv' ? 'K-Drama' : 'K-Film'}
                      </span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <p className="text-white text-xs line-clamp-2">{item.overview}</p>
                    </div>
                  </div>
                  <p className="text-white text-sm mt-2 font-medium line-clamp-1 group-hover:text-violet-400 transition-colors">
                    {item.title || item.name}
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {item.vote_average ? `★ ${item.vote_average.toFixed(1)}` : ''}
                    {item.first_air_date ? ` • ${item.first_air_date.split('-')[0]}` : ''}
                    {item.release_date ? ` • ${item.release_date.split('-')[0]}` : ''}
                  </p>
                </Link>
              ))}
            </div>
          ) : null}

          {/* Mobile "Browse All" CTA */}
          <div className="text-center mt-8 sm:hidden">
            <Link
              to="/browse"
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-medium px-6 py-3 rounded-xl transition-all duration-300"
            >
              Browse All Korean Content
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Ad Banner — between Korean Section and Plans */}
      <section className="landing-section py-8 sm:py-10">
        <div className="landing-section-inner max-w-4xl">
          <AdBanner format="leaderboard" />
        </div>
      </section>

      {/* Plans Section */}
      <section className="landing-section bg-gradient-to-b from-transparent via-white/5 to-transparent">
        <div className="landing-section-inner max-w-5xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-4">
            Choose Your <span className="text-violet-500">Plan</span>
          </h2>
          <p className="text-gray-400 text-center max-w-2xl mx-auto mb-16">
            Start free and upgrade when you're ready
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all duration-300">
              <h3 className="text-white text-2xl font-bold mb-2">Free</h3>
              <p className="text-gray-400 text-sm mb-6">Perfect for getting started</p>
              <p className="text-4xl font-bold text-white mb-6">
                $0<span className="text-lg text-gray-400 font-normal">/mo</span>
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-gray-300 text-sm">
                  <svg className="h-5 w-5 text-green-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Access to thousands of titles
                </li>
                <li className="flex items-center gap-2 text-gray-300 text-sm">
                  <svg className="h-5 w-5 text-green-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Standard quality (720p)
                </li>
                <li className="flex items-center gap-2 text-gray-300 text-sm">
                  <svg className="h-5 w-5 text-green-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Ad-supported streaming
                </li>
                <li className="flex items-center gap-2 text-gray-500 text-sm">
                  <svg className="h-5 w-5 text-gray-600 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  No HD / 4K streaming
                </li>
              </ul>
              <Link
                to="/signup"
                className="block w-full text-center border border-white/20 hover:border-white/40 text-white font-medium py-3 rounded-xl transition-all duration-300"
              >
                Get Started
              </Link>
            </div>

            {/* Premium Plan */}
            <div className="bg-gradient-to-b from-violet-600/20 to-transparent border border-violet-600/30 rounded-2xl p-8 relative hover:border-violet-600/50 transition-all duration-300">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                POPULAR
              </div>
              <h3 className="text-white text-2xl font-bold mb-2">Premium</h3>
              <p className="text-gray-400 text-sm mb-6">The ultimate experience</p>
              <p className="text-4xl font-bold text-white mb-6">
                $9.99<span className="text-lg text-gray-400 font-normal">/mo</span>
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-gray-300 text-sm">
                  <svg className="h-5 w-5 text-green-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Everything in Free
                </li>
                <li className="flex items-center gap-2 text-gray-300 text-sm">
                  <svg className="h-5 w-5 text-green-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  HD & 4K Ultra HD streaming
                </li>
                <li className="flex items-center gap-2 text-gray-300 text-sm">
                  <svg className="h-5 w-5 text-green-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Ad-free experience
                </li>
                <li className="flex items-center gap-2 text-gray-300 text-sm">
                  <svg className="h-5 w-5 text-green-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Exclusive content access
                </li>
              </ul>
              <Link
                to="/signup?plan=premium"
                className="block w-full text-center bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-xl transition-all duration-300 shadow-lg shadow-violet-600/25"
              >
                Subscribe Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="landing-section">
        <div className="landing-section-inner max-w-3xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-4">
            Frequently Asked <span className="text-violet-500">Questions</span>
          </h2>
          <p className="text-gray-400 text-center max-w-2xl mx-auto mb-16">
            Everything you need to know about CineVault
          </p>

          <div className="space-y-4">
            {FAQ_ITEMS.map((item, index) => (
              <details
                key={index}
                className="group bg-white/5 border border-white/10 rounded-xl overflow-hidden transition-all duration-300 hover:border-white/20"
              >
                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer text-white font-medium hover:text-violet-400 transition-colors [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <svg
                    className="h-5 w-5 text-gray-400 group-open:rotate-180 transition-transform duration-300 shrink-0 ml-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l4.293-4.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </summary>
                <div className="px-6 pb-4">
                  <p className="text-gray-400 text-sm leading-relaxed">{item.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="landing-section bg-gradient-to-t from-violet-600/10 to-transparent">
        <div className="landing-section-inner max-w-3xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Start Watching?
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            Join thousands of viewers enjoying unlimited entertainment.
          </p>
          <Link
            to="/signup"
            className="inline-block bg-violet-600 hover:bg-violet-700 text-white font-bold text-lg px-12 py-4 rounded-xl transition-all duration-300 shadow-lg shadow-violet-600/25 hover:shadow-violet-600/40"
          >
            Get Started Free
          </Link>
        </div>
      </section>
    </PageLayout>
  );
};

export default LandingPage;