import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { openStripeCheckout } from '../services/payment';
import SEO from '../components/SEO';
import PageLayout from '../components/layout/PageLayout';

const PLANS = [
  { value: 'free', label: 'Free', price: '$0', description: 'Ad-supported, standard quality' },
  { value: 'premium', label: 'Premium', price: '$9.99/mo', description: 'Ad-free, HD & 4K — paid via Stripe' },
];

const SignupPage = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedPlan = searchParams.get('plan') || 'free';

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    plan: preselectedPlan,
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep1 = () => {
    if (!formData.name.trim()) {
      setError('Please enter your name');
      return false;
    }
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    setError('');
    return true;
  };

  const validateStep2 = () => {
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    setError('');
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleBack = () => {
    setError('');
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.plan) {
      setError('Please select a plan');
      return;
    }

    setIsLoading(true);

    try {
      // Create account + auto-login via Appwrite
      await signup(formData);

      // If Premium, redirect to Stripe Checkout for payment
      if (formData.plan === 'premium') {
        try {
          await openStripeCheckout('premium_monthly', formData.email);
        } catch (stripeErr) {
          // If Stripe fails, still let them browse but show a message
          setError('Account created! But payment setup failed. Please visit /premium to upgrade.');
          navigate('/browse', { replace: true });
        }
      } else {
        navigate('/browse', { replace: true });
      }
    } catch (err) {
      const code = err?.code || err?.type || '';
      if (code === 409 || code === 'user_already_exists') {
        setError('An account with this email already exists. Please sign in instead.');
      } else if (code === 400 || code === 'general_argument_invalid') {
        setError(err?.message || 'Invalid input. Please check your details.');
      } else if (code === 429) {
        setError('Too many attempts. Please wait a moment and try again.');
      } else if (code === 'password_too_weak') {
        setError('Password is too weak. Use at least 8 characters with a mix of letters, numbers, and symbols.');
      } else {
        setError(err?.message || 'Sign up failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const stepIndicator = (num) => (
    <div className="flex items-center gap-2">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${step >= num
          ? 'bg-violet-600 text-white'
          : 'bg-white/10 text-gray-500'
          }`}
      >
        {step > num ? (
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        ) : (
          num
        )}
      </div>
      {num < 3 && (
        <div className={`h-0.5 w-12 sm:w-20 transition-all duration-300 ${step > num ? 'bg-violet-600' : 'bg-white/10'}`} />
      )}
    </div>
  );

  return (
    <PageLayout variant="auth">
      <SEO
        title="Sign Up - CineVault"
        description="Create a free CineVault account and start streaming thousands of movies and TV shows instantly. Upgrade to Premium for an ad-free experience."
        url="/signup"
        type="website"
      />

      <Link to="/" className="block text-center mb-8">
        <span className="text-violet-500 text-3xl font-bold">CineVault</span>
      </Link>

      <div className="auth-card">
          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-8">
            {stepIndicator(1)}
            {stepIndicator(2)}
            {stepIndicator(3)}
          </div>

          <h1 className="!text-2xl !mx-0 !max-w-none font-bold text-white text-center mb-2">
            {step === 1 && 'Create Your Account'}
            {step === 2 && 'Set Your Password'}
            {step === 3 && 'Choose Your Plan'}
          </h1>
          <p className="text-gray-400 text-sm text-center mb-8">
            {step === 1 && 'Start your streaming journey'}
            {step === 2 && 'Secure your account'}
            {step === 3 && 'Pick the plan that\'s right for you'}
          </p>

          {error && (
            <div className="bg-violet-500/10 border border-violet-500/30 rounded-lg px-4 py-3 mb-6">
              <p className="text-violet-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Step 1: Name & Email */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all duration-300"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all duration-300"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-xl transition-all duration-300 shadow-lg shadow-violet-600/25"
                >
                  Next Step
                </button>
              </div>
            )}

            {/* Step 2: Password */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all duration-300"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-xl transition-all duration-300 shadow-lg shadow-violet-600/25"
                >
                  Next Step
                </button>

                <button
                  type="button"
                  onClick={handleBack}
                  className="w-full text-gray-400 hover:text-white text-sm py-2 transition-colors"
                >
                  Back
                </button>
              </div>
            )}

            {/* Step 3: Plan Selection */}
            {step === 3 && (
              <div className="space-y-4">
                {PLANS.map((plan) => (
                  <button
                    key={plan.value}
                    type="button"
                    onClick={() => updateField('plan', plan.value)}
                    className={`w-full text-left border rounded-xl p-4 transition-all duration-300 ${formData.plan === plan.value
                      ? 'border-violet-500 bg-violet-600/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-bold">{plan.label}</span>
                      <span className="text-white font-bold">{plan.price}</span>
                    </div>
                    <p className="text-gray-400 text-sm">{plan.description}</p>
                  </button>
                ))}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-violet-600/50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all duration-300 shadow-lg shadow-violet-600/25 mt-2"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Creating Account...
                    </span>
                  ) : (
                    'Create Account'
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleBack}
                  className="w-full text-gray-400 hover:text-white text-sm py-2 transition-colors"
                >
                  Back
                </button>
              </div>
            )}
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
      </div>
    </PageLayout>
  );
};

export default SignupPage;