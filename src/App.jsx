import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import SEO from './components/SEO';
import Footer from './components/Footer';
import Spinner from './components/Spinner';

// Lazy-loaded pages for code-splitting
const LandingPage = lazy(() => import('./pages/LandingPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const BrowsePage = lazy(() => import('./pages/BrowsePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const MovieDetailPage = lazy(() => import('./pages/MovieDetailPage'));
const TVDetailPage = lazy(() => import('./pages/TVDetailPage'));
const WatchPage = lazy(() => import('./pages/WatchPage'));
const GenrePage = lazy(() => import('./pages/GenrePage'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const DMCAPage = lazy(() => import('./pages/DMCAPage'));
const DirectWatchPage = lazy(() => import('./pages/DirectWatchPage'));
const PremiumPage = lazy(() => import('./pages/PremiumPage'));
const PremiumSuccessPage = lazy(() => import('./pages/PremiumSuccessPage'));

function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Prevent the browser from auto-restoring scroll position
    // which conflicts with our SPA navigation and can cause
    // back-navigation to land at the wrong position (e.g. footer)
    if (history.scrollRestoration) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }, [pathname, search]);

  return null;
}

// Loading fallback for lazy-loaded pages
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <Spinner />
  </div>
);

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <Header />

          {/* Default SEO for pages without their own SEO component */}
          <SEO />

          <main className="pt-16 sm:pt-20 flex-1">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/browse" element={<BrowsePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/movie/:id" element={<MovieDetailPage />} />
                <Route path="/tv/:id" element={<TVDetailPage />} />
                <Route path="/genre/:genreId" element={<GenrePage />} />
                <Route path="/watch/tmdb/:id" element={<WatchPage />} />
                <Route path="/watch/appwrite/:documentId" element={<WatchPage />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/direct-watch" element={<DirectWatchPage />} />
                <Route path="/dmca" element={<DMCAPage />} />
                <Route path="/premium" element={<PremiumPage />} />
                <Route path="/premium/success" element={<PremiumSuccessPage />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </Router>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;