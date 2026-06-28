/**
 * Stripe Checkout helper
 *
 * Calls the Vercel serverless function to create a Stripe Checkout session,
 * then redirects the user to Stripe's hosted payment page.
 */

export const PRICE_IDS = {
  premium_monthly: 'premium_monthly',
  premium_yearly: 'premium_yearly',
  basic_monthly: 'basic_monthly',
};

/**
 * Opens Stripe Checkout for a given price ID.
 *
 * @param {string} priceId - e.g. 'premium_monthly'
 * @param {string} [customerEmail] - pre-fill email on checkout page
 * @returns {Promise<void>} - redirects browser to Stripe
 */
export async function openStripeCheckout(priceId, customerEmail) {
  const response = await fetch('/api/create-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      priceId,
      customerEmail: customerEmail || undefined,
      successUrl: `${window.location.origin}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${window.location.origin}/premium?canceled=true`,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to start checkout');
  }

  const { url } = await response.json();

  if (url) {
    window.location.href = url; // Redirect to Stripe Checkout
  } else {
    throw new Error('No checkout URL returned');
  }
}

/**
 * Available subscription plans shown to users.
 */
export const SUBSCRIPTION_PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: '',
    description: 'Ad-supported streaming',
    features: [
      'Access to all movies & TV shows',
      'Ad-supported experience',
      'Standard definition',
      '1 streaming source',
    ],
    popular: false,
    cta: 'Get Started',
    href: '/signup?plan=free',
  },
  {
    id: 'basic',
    name: 'Basic',
    price: '$4.99',
    period: '/month',
    description: 'Ad-free HD streaming',
    features: [
      'Ad-free experience',
      'HD (1080p) quality',
      '2 streaming sources',
      'Priority support',
    ],
    popular: false,
    cta: 'Subscribe',
    priceId: PRICE_IDS.basic_monthly,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$9.99',
    period: '/month',
    description: 'The ultimate experience',
    features: [
      'Ad-free experience',
      '4K Ultra HD quality',
      'All streaming sources',
      'Priority support',
      'Early access to new content',
    ],
    popular: true,
    cta: 'Subscribe',
    priceId: PRICE_IDS.premium_monthly,
  },
];