/**
 * Stripe Webhook — Vercel Serverless Function
 *
 * Listens for `checkout.session.completed` events from Stripe.
 * When a payment succeeds, it updates the customer's Appwrite account
 * preferences to set `isPremium: true`.
 *
 * Requires:
 *   - STRIPE_SECRET_KEY environment variable
 *   - STRIPE_WEBHOOK_SECRET (webhook signing secret)
 *   - Appwrite API Key with access to update account prefs
 *
 * POST /api/stripe-webhook
 */
import Stripe from 'stripe';
import { Client, Account, Users } from 'appwrite';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const APPWRITE_ENDPOINT = 'https://sgp.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!stripe) {
    return res.status(500).json({ error: 'Stripe is not configured' });
  }

  let event;

  // Verify webhook signature
  if (process.env.STRIPE_WEBHOOK_SECRET) {
    const sig = req.headers['stripe-signature'];
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }
  } else {
    // In development, parse the raw body
    try {
      event = JSON.parse(req.body);
    } catch {
      return res.status(400).json({ error: 'Invalid payload' });
    }
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;

      // Stripe sends customer_email in the session
      const customerEmail = session.customer_details?.email || session.customer_email;

      if (!customerEmail) {
        console.error('No customer email in session:', session.id);
        return res.status(200).json({ received: true });
      }

      // Update Appwrite user's preferences to mark as premium
      if (APPWRITE_PROJECT_ID && process.env.APPWRITE_API_KEY) {
        try {
          const client = new Client()
            .setEndpoint(APPWRITE_ENDPOINT)
            .setProject(APPWRITE_PROJECT_ID)
            .setKey(process.env.APPWRITE_API_KEY);

          const usersApi = new Users(client);

          // Find the Appwrite user by email
          const userList = await usersApi.list([], undefined, undefined, undefined, customerEmail);
          const appwriteUser = userList.users?.[0];

          if (appwriteUser) {
            // Set isPremium preference
            await usersApi.updatePrefs(appwriteUser.$id, {
              isPremium: true,
              stripeCustomerId: session.customer || '',
              stripeSubscriptionId: session.subscription || '',
              premiumSince: new Date().toISOString(),
            });
            console.log(`User ${customerEmail} upgraded to Premium via Stripe`);
          } else {
            console.log(`No Appwrite user found for email: ${customerEmail}`);
          }
        } catch (err) {
          console.error('Failed to update Appwrite user prefs:', err);
        }
      } else {
        console.log('Appwrite API Key not configured — skipping premium update');
      }

      break;
    }

    case 'customer.subscription.deleted':
    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      const status = subscription.status; // 'active', 'canceled', 'past_due', etc.

      // If subscription is canceled or past_due, downgrade the user
      if (status === 'canceled' || status === 'unpaid' || status === 'past_due') {
        // Find the customer email from the subscription
        // In a production app, you'd look up the customer ID from your DB
        console.log(`Subscription ${subscription.id} is now ${status} — would downgrade user`);
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const email = invoice.customer_email || invoice.customer_name;
      console.log(`Payment failed for ${email} — invoice ${invoice.id}`);
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.status(200).json({ received: true });
}