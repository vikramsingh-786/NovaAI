import Stripe from 'stripe';
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { // Added ! for process.env
  // @ts-ignore - If TS types are being overly specific or misaligned with a valid runtime version
  apiVersion: '2023-08-16',
  typescript: true,
});