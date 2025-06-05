// app/context/SubscriptionProviderClient.tsx
"use client"; // Mark this as a Client Component

// Ensure this import name matches the renamed export from SubscriptionContext.tsx
import { ActualSubscriptionProvider } from './SubscriptionContext';
import { ReactNode, Suspense } from 'react';
import LoadingSpinner from '../components/ui/LoadingSpinner'; // Or your preferred minimal loader

export function SubscriptionProviderClientWrapper({ children }: { children: ReactNode }) {
  return (
    // The Suspense boundary allows ActualSubscriptionProvider (which uses useSearchParams)
    // to suspend if needed, without breaking static generation of pages like /_not-found.
    <Suspense fallback={<LoadingSpinner /> /* Or even just null if no loader desired here */}>
      <ActualSubscriptionProvider>{children}</ActualSubscriptionProvider>
    </Suspense>
  );
}