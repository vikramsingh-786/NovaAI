'use client';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { ArrowRight, CheckCircle, Loader2, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useSubscription } from '@/app/context/SubscriptionContext';

export default function PricingSection() {
  const { isSignedIn, userId } = useAuth(); 
  const router = useRouter();
  const { subscriptionStatus, isProUser, isLoading: isSubscriptionLoading } = useSubscription();

  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const proPriceId = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID;

  const handleUpgrade = async () => {

    if (!isSignedIn) {
      const signInUrlPath = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || '/sign-in';
      const redirectParam = `redirect_url=${encodeURIComponent(window.location.pathname + '?action=upgrade')}`;
      router.push(`${signInUrlPath}?${redirectParam}`);
      return;
    }

    if (!proPriceId) {
      toast.error("Pro plan configuration is missing. Please contact support.");
      return;
    }
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
        toast.error("Stripe configuration is missing. Please contact support.");
        return;
    }
    if (!process.env.NEXT_PUBLIC_APP_URL) {
        toast.error("Application URL configuration is missing.");
        return;
    }

    setIsCheckoutLoading(true);
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: proPriceId,
          successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?subscription_success=true`,
          cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?subscription_canceled=true`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to process request." }));
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { sessionId } = await response.json();
      const stripeJs = await import('@stripe/stripe-js');
      const stripe = await stripeJs.loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

      if (stripe && sessionId) {
        const { error } = await stripe.redirectToCheckout({ sessionId });
        if (error) {
            toast.error(error.message || "Failed to redirect to Stripe.");
        }
      } else if (!sessionId) {
        toast.error("Could not initiate Stripe checkout session.");
      }
      else {
        toast.error("Stripe.js failed to load.");
      }
    } catch (error: any) {
      toast.error(error.message || 'An unexpected error occurred during upgrade.');
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!isSignedIn) {
      toast.error("You must be signed in to manage your subscription.");
      return;
    }

    if (!process.env.NEXT_PUBLIC_APP_URL) {
        toast.error("Application URL configuration is missing.");
        return;
    }

    setIsCheckoutLoading(true);
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?from_portal=true`
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to process request." }));
        throw new Error(errorData.error || 'Failed to open subscription portal');
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      } else {
        toast.error("Could not retrieve subscription portal URL.");
      }
    } catch (error: any) {
      toast.error(error.message || 'Could not open subscription management.');
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  const proFeatures = [
    "Unlimited chat history",
    "Access to advanced AI models",
    "Priority support",
    "Early access to new features",
    "Higher message limits",
    "File Uploads (PDF, DOCX, Images)",
  ];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8" id="pricing">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-[var(--hero-gradient-from)] via-[var(--hero-highlight-from)] to-[var(--hero-highlight-to)] bg-clip-text text-transparent">
          Choose Your Plan
        </h2>
        <p className="text-xl text-[var(--text-secondary)] mb-12 max-w-2xl mx-auto">
          Unlock the full potential of NovaAI with our Pro plan.
        </p>
      </div>

      <div className="max-w-md mx-auto bg-[var(--card-bg)] rounded-xl shadow-2xl p-8 border border-[var(--border-primary)]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-3xl font-semibold text-[var(--text-primary)]">Pro Plan</h3>
          <span className="px-4 py-1 bg-[var(--accent-purple)]/20 text-[var(--accent-purple)] rounded-full text-sm font-medium inline-flex items-center">
            <Star size={16} className="mr-1.5" /> Popular
          </span>
        </div>
        <p className="text-4xl font-bold text-[var(--text-primary)] mb-2">
            ₹100 <span className="text-xl font-normal text-[var(--text-muted)]">/ month</span>
        </p>
        <p className="mb-8 text-[var(--text-secondary)]">
            Everything you need to supercharge your productivity and creativity.
        </p>
        <ul className="space-y-3 mb-10 text-left">
          {proFeatures.map((feature, idx) => (
            <li key={idx} className="flex items-center text-[var(--text-secondary)]">
              <CheckCircle className="text-green-500 mr-3 flex-shrink-0" size={20} />
              {feature}
            </li>
          ))}
        </ul>

        {isSubscriptionLoading ? (
          <button disabled className="w-full px-8 py-3.5 rounded-lg bg-gray-500 opacity-70 text-white flex justify-center items-center text-lg font-semibold">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading Status...
          </button>
        ) : isProUser ? (
          <button
            onClick={handleManageSubscription}
            disabled={isCheckoutLoading || !isSignedIn} 
            className="w-full px-8 py-3.5 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 text-white text-lg font-semibold flex justify-center items-center shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out disabled:opacity-70"
          >
            {isCheckoutLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Manage Subscription'}
          </button>
        ) : (
          <button
            onClick={handleUpgrade}
            disabled={isCheckoutLoading}
            className="w-full px-8 py-3.5 rounded-lg bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] text-white text-lg font-semibold flex justify-center items-center shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out disabled:opacity-70"
          >
            {isCheckoutLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>{isSignedIn ? "Upgrade to Pro" : "Get Started with Pro"} <ArrowRight className="ml-2" /></>}
          </button>
        )}

        {subscriptionStatus && subscriptionStatus !== 'free' && subscriptionStatus !== 'active' && !isSubscriptionLoading && (
          <p className="text-center mt-4 text-sm text-[var(--text-muted)]">
            Your current plan: <span className="font-semibold capitalize text-[var(--accent-purple)]">{subscriptionStatus.replace('_', ' ')}</span>.
          </p>
        )}
      </div>
    </section>
  );
}