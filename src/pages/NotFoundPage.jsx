import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

const NotFoundPage = () => {
  return (
    <>
      <SEO
        title="Page Not Found — CineVault"
        description="The page you're looking for doesn't exist."
        noIndex
      />
      <div className="relative min-h-[70vh] flex items-center justify-center px-4 py-16">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-red-600/10 blur-[120px] rounded-full" />
        </div>

        <div className="relative z-10 text-center max-w-lg">
          <p className="text-[7rem] sm:text-[9rem] font-extrabold leading-none bg-gradient-to-b from-white to-red-500 bg-clip-text text-transparent">
            404
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-white">
            This scene didn't make the cut
          </h1>
          <p className="mt-3 text-gray-400 text-sm sm:text-base">
            The page you're looking for doesn't exist, may have been moved, or the link is broken.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/home"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors duration-200"
            >
              Back to Home
            </Link>
            <Link
              to="/browse"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 text-sm font-semibold transition-colors duration-200"
            >
              Browse Movies & TV
            </Link>
          </div>

          <p className="mt-10 text-gray-600 text-xs">
            If you got here from a link inside CineVault, the content may have been removed.
          </p>
        </div>
      </div>
    </>
  );
};

export default NotFoundPage;
