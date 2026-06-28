/**
 * Stripe Checkout Session — Vercel Serverless Function
 *
 * Creates a Stripe Checkout Session for Premium subscriptions.
 * Requires STRIPE_SECRET_KEY environment variable.
 *
 * POST /api/create-checkout
 * Body: { priceId: string, customerEmail?: string, successUrl?: string, cancelUrl?: string }
 *
 * Returns: { url: string } (redirect user to this Stripe Checkout URL)
 */
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Default price IDs — replace these with your Stripe price IDs
const PRICE_IDS = {
  premium_monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY || 'price_premium_monthly',
  premium_yearly: process.env.STRIPE_PRICE_PREMIUM_YEARLY || 'price_premium_yearly',
  basic_monthly: process.env.STRIPE_PRICE_BASIC_MONTHLY || 'price_basic_monthly',
};

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe is not configured. Set STRIPE_SECRET_KEY environment variable.' });
  }

  try {
    const { priceId, customerEmail, successUrl, cancelUrl } = req.body;

    if (!priceId) {
      return res.status(400).json({ error: 'priceId is required' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: customerEmail || undefined,
      success_url: successUrl || `${req.headers.origin}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.headers.origin}/premium?canceled=true`,
      metadata: {
        source: 'cinevault',
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create checkout session' });
  }
}