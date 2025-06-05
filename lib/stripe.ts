import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  // @ts-expect-error - We're using a valid API version that might not be in the types yet
  apiVersion: '2023-08-16',
  typescript: true,
});