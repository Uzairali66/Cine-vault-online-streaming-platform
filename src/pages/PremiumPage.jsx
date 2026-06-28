import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { openStripeCheckout, SUBSCRIPTION_PLANS } from '../services/payment';
import SEO from '../components/SEO';
import PageLayout from '../components/layout/PageLayout';
import PageHeader from '../components/layout/PageHeader';

const PremiumPage = () => {
  const { user, isPremium, upgradeToPremium } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedPlan, setSelectedPlan] = useState('premium');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const canceled = searchParams.get('canceled') === 'true';

  const handleSubscribe = async (planId) => {
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    if (!plan || !plan.priceId) {
      // Free plan — redirect to signup
      navigate(`/signup?plan=${planId}`);
      return;
    }

    // For paid plans, open Stripe Checkout
    setIsProcessing(true);
    setError('');

    try {
      await openStripeCheckout(plan.priceId, user?.email);
    } catch (err) {
      setError(err.message || 'Failed to start checkout. Please try again.');
      setIsProcessing(false);
    }
  };

  if (isPremium) {
    return (
      <PageLayout variant="centered" width="2xl">
        <SEO title="Premium — Already Upgraded — CineVault" url="/premium" />
        <div className="text-center">
          <div className="text-6xl mb-6">👑</div>
          <h1 className="page-title page-title--center !text-3xl mb-4">You're Already Premium!</h1>
          <p className="text-gray-400 mb-8">
            Enjoy your ad-free 4K streaming experience.
          </p>
          <Link
            to="/browse"
            className="inline-block bg-gradient-to-r from-[#D6C7FF] to-[#AB8BFF] text-dark-100 font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity"
          >
            Start Watching
          </Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout width="5xl">
      <SEO
        title="Go Premium — CineVault"
        description="Upgrade to CineVault Premium for ad-free streaming in 4K Ultra HD. Enjoy unlimited access to thousands of movies and TV shows."
        url="/premium"
      />

      <PageHeader
        align="center"
        badge={<span>⚡</span>}
        title="Upgrade Your Experience"
        description="Choose the plan that's right for you. Cancel anytime."
        className="mb-12"
      />
      {!user && (
        <p className="text-center text-gray-400 -mt-8 mb-10">
          Already have an account?{' '}
          <Link to="/login" className="text-[#AB8BFF] hover:underline">Sign in</Link>
        </p>
      )}

        {/* Canceled message */}
        {canceled && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-6 py-4 mb-8 text-center">
            <p className="text-yellow-400">
              Checkout was canceled. No charges were made. Ready to try again?
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-6 py-4 mb-8 text-center">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-6 border transition-all duration-300 ${plan.popular
                  ? 'border-[#AB8BFF] bg-[#AB8BFF]/5 shadow-lg shadow-[#AB8BFF]/10 scale-105 md:scale-105'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
                } ${selectedPlan === plan.id ? 'ring-2 ring-[#AB8BFF]' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#D6C7FF] to-[#AB8BFF] text-dark-100 text-xs font-bold px-4 py-1 rounded-full">
                  Most Popular
                </div>
              )}

              <div className="text-center mb-6 mt-2">
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                <div className="text-white">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && <span className="text-gray-400 text-lg">{plan.period}</span>}
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                    <svg className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => {
                  setSelectedPlan(plan.id);
                  handleSubscribe(plan.id);
                }}
                disabled={isProcessing}
                className={`w-full py-3 rounded-xl font-bold transition-all duration-200 ${plan.popular
                    ? 'bg-gradient-to-r from-[#D6C7FF] to-[#AB8BFF] text-dark-100 hover:opacity-90'
                    : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isProcessing && selectedPlan === plan.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  plan.cta
                )}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { q: 'Can I cancel anytime?', a: 'Yes, you can cancel your subscription at any time. Your Premium benefits will continue until the end of the billing period.' },
              { q: 'What payment methods are accepted?', a: 'We accept all major credit and debit cards via Stripe. Apple Pay and Google Pay are also available on supported devices.' },
              { q: 'Is there a free trial?', a: 'We offer a limited free plan with ads. Upgrade to Premium anytime for an ad-free experience.' },
              { q: 'How do I access Premium content after subscribing?', a: 'After subscribing via Stripe, your account is automatically upgraded. Simply sign in and enjoy Premium features.' },
            ].map((faq, i) => (
              <details key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 group">
                <summary className="text-white font-medium cursor-pointer list-none flex items-center justify-between">
                  {faq.q}
                  <svg className="h-5 w-5 text-gray-400 group-open:rotate-180 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </summary>
                <p className="text-gray-400 text-sm mt-3 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </PageLayout>
  );
};

export default PremiumPage;