import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';
import PageLayout from '../components/layout/PageLayout';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/browse', { replace: true });
    } catch (err) {
      const code = err?.code || err?.type || '';
      if (code === 401 || code === 'user_invalid_credentials') {
        setError('Invalid email or password. Please try again.');
      } else if (code === 429) {
        setError('Too many attempts. Please wait a moment and try again.');
      } else if (code === 'user_not_found') {
        setError('No account found with this email. Please sign up first.');
      } else {
        setError(err?.message || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageLayout variant="auth">
      <SEO
        title="Sign In - CineVault"
        description="Sign in to your CineVault account to access your watch history, continue watching, and manage your subscription."
        url="/login"
        type="website"
      />

      <Link to="/" className="block text-center mb-8">
        <span className="text-violet-500 text-3xl font-bold">CineVault</span>
      </Link>

      <div className="auth-card">
        <h1 className="!text-2xl !mx-0 !max-w-none font-bold text-white text-center mb-2">
          Welcome Back
        </h1>
        <p className="text-gray-400 text-sm text-center mb-8">
          Sign in to continue watching
        </p>

        {error && (
          <div className="bg-violet-500/10 border border-violet-500/30 rounded-lg px-4 py-3 mb-6">
            <p className="text-violet-400 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all duration-300"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all duration-300"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-violet-600/50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all duration-300 shadow-lg shadow-violet-600/25"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing In...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          Don't have an account?{' '}
          <Link to="/signup" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
            Sign up free
          </Link>
        </p>
      </div>
    </PageLayout>
  );
};

export default LoginPage;
