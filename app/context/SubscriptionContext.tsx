// app/context/SubscriptionContext.tsx

"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useRef,
} from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import type { UserDocument } from "@/types";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";

interface SubscriptionContextType {
  subscriptionStatus: UserDocument["subscriptionStatus"] | null;
  stripeCustomerId: string | null;
  isLoading: boolean;
  isProUser: boolean;
  fetchSubscriptionStatus: (options?: {
    forcePolling?: boolean;
    attempts?: number;
  }) => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined
);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const { isSignedIn, userId } = useAuth();
  const { user: clerkUser } = useUser();

  const [subscriptionStatus, setSubscriptionStatus] = useState<
    UserDocument["subscriptionStatus"] | null
  >(null);
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start true for initial load

  const router = useRouter();
  const searchParams = useSearchParams();

  const isPollingActiveRef = useRef(false);
  const isRegularFetchActiveRef = useRef(false); // To prevent multiple non-polling fetches

  const fetchSubscriptionStatus = useCallback(
    async (options?: { forcePolling?: boolean; attempts?: number }) => {
      const { forcePolling = false, attempts = 1 } = options || {};

      if (!isSignedIn || !userId) {
        setSubscriptionStatus("free");
        setStripeCustomerId(null);
        setIsLoading(false);
        isPollingActiveRef.current = false;
        isRegularFetchActiveRef.current = false;
        return;
      }

      if (forcePolling && attempts === 1) {
        if (isPollingActiveRef.current) {
          return;
        } // Already polling
        isPollingActiveRef.current = true;
        isRegularFetchActiveRef.current = false; // Stop any regular fetch thinking
      } else if (!forcePolling) {
        // This is a regular fetch attempt
        if (isRegularFetchActiveRef.current || isPollingActiveRef.current) {
          return;
        } // Another fetch (regular or polling) is already active
        isRegularFetchActiveRef.current = true;
      }

      setIsLoading(true);
      let fetchedStatusThisCall: UserDocument["subscriptionStatus"] | null = null; // Track status for this specific call

      try {
        const response = await fetch("/api/user/status", { cache: "no-store" }); // Ensure fresh data
        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ error: `Server error ${response.status}` }));
          console.error(
            "CONTEXT_SUB_ERROR: Failed to fetch /api/user/status.",
            errorData.error
          );
          fetchedStatusThisCall = "free"; // Assume free on error for this call's logic
          // Set state only if not actively polling for something better
          if (!isPollingActiveRef.current || attempts >= 5) {
            setSubscriptionStatus("free");
            setStripeCustomerId(null);
          }
        } else {
          const data: { user: UserDocument } = await response.json();
          if (data.user) {
            const newStatus = data.user.subscriptionStatus || "free";
            fetchedStatusThisCall = newStatus; // Update for this call's logic
            setSubscriptionStatus(newStatus);
            setStripeCustomerId(data.user.stripeCustomerId || null);

            if (forcePolling && newStatus !== "active" && attempts < 5) {
              setTimeout(
                () =>
                  fetchSubscriptionStatus({
                    forcePolling: true,
                    attempts: attempts + 1,
                  }),
                attempts * 1000 + 2000 // Basic backoff
              );
              return; // IMPORTANT: Exit to let polling continue, isLoading remains true
            }
          } else {
            fetchedStatusThisCall = "free";
            if (!isPollingActiveRef.current || attempts >= 5) {
              setSubscriptionStatus("free");
              setStripeCustomerId(null);
            }
          }
        }
      } catch (error: unknown) { // Catch should use unknown
        console.error(
          "CONTEXT_SUB_ERROR: Exception in fetchSubscriptionStatus:",
          error instanceof Error ? error.message : error
        );
        fetchedStatusThisCall = "free";
        if (!isPollingActiveRef.current || attempts >= 5) {
            setSubscriptionStatus("free");
            setStripeCustomerId(null);
        }
      } finally {
        // Logic to determine if loading should stop
        if (forcePolling) {
          // If polling ended (found active or max attempts)
          if (fetchedStatusThisCall === "active" || attempts >= 5) {
            isPollingActiveRef.current = false;
            setIsLoading(false);
            // Clean up URL params if polling was successful or exhausted
            if (
              searchParams.has("subscription_success") ||
              searchParams.has("from_portal") ||
              searchParams.has("subscription_canceled") // Also clean cancel if polling was triggered
            ) {
              const currentPath = window.location.pathname;
              const newSearchParams = new URLSearchParams(
                searchParams.toString()
              );
              newSearchParams.delete("subscription_success");
              newSearchParams.delete("from_portal");
              newSearchParams.delete("subscription_canceled");
              router.replace( // Use replace to not add to history
                `${currentPath}${
                  newSearchParams.size > 0
                    ? "?" + newSearchParams.toString()
                    : ""
                }`,
                { scroll: false }
              );
            }
          }
          // If polling continues, isLoading remains true (because of the return above)
        } else {
          // For regular (non-polling) fetches
          isRegularFetchActiveRef.current = false;
          setIsLoading(false);
        }
      }
    },
    [isSignedIn, userId, router, searchParams] // Dependencies for useCallback
  );

  // Effect for initial fetch and when auth state changes
  useEffect(() => {
    if (isSignedIn && userId) {
      if (!isPollingActiveRef.current && !isRegularFetchActiveRef.current) {
        fetchSubscriptionStatus();
      }
    } else if (!isSignedIn) {
      setSubscriptionStatus("free");
      setStripeCustomerId(null);
      setIsLoading(false);
      isPollingActiveRef.current = false;
      isRegularFetchActiveRef.current = false;
    }
  }, [isSignedIn, userId, fetchSubscriptionStatus]); // fetchSubscriptionStatus is stable

  // Effect to handle redirect from Stripe Checkout or Portal
  useEffect(() => {
    let actionTaken = false;
    const shouldPoll = searchParams.has("subscription_success") || searchParams.has("from_portal");
    const wasCanceled = searchParams.has("subscription_canceled");

    if (shouldPoll) {
      if (!isPollingActiveRef.current && !isRegularFetchActiveRef.current) { // Only start if not already fetching/polling
        if (searchParams.has("subscription_success")) {
            toast.success("Subscription successful! Your Pro plan is now active.", { autoClose: 5000 });
        }
        fetchSubscriptionStatus({ forcePolling: true, attempts: 1 });
        actionTaken = true;
      }
    } else if (wasCanceled) {
      toast.info("Subscription process was canceled.", { autoClose: 5000 });
      actionTaken = true;
    }

    // URL cleanup if an action was taken and polling is NOT active (or has finished)
    // For cancel, polling is not active, so cleanup immediately.
    // For success/portal, cleanup is handled in fetchSubscriptionStatus's finally block.
    if (actionTaken && wasCanceled && !isPollingActiveRef.current) {
        const currentPath = window.location.pathname;
        const newSearchParams = new URLSearchParams(searchParams.toString());
        newSearchParams.delete("subscription_success");
        newSearchParams.delete("subscription_canceled");
        newSearchParams.delete("from_portal");
        router.replace(
          `${currentPath}${
            newSearchParams.size > 0 ? "?" + newSearchParams.toString() : ""
          }`,
          { scroll: false }
        );
    }
  }, [searchParams, router, fetchSubscriptionStatus]); // fetchSubscriptionStatus is stable

  // Effect for syncing user with DB on Clerk user change
  useEffect(() => {
    const syncUserWithDb = async () => {
      if (
        isSignedIn &&
        clerkUser?.id &&
        clerkUser.primaryEmailAddress?.emailAddress
      ) {
        console.log('%%%%% CONTEXT_SYNC: Preparing to POST to /api/user/sync for user:', clerkUser.id);
        try {
          const syncResponse = await fetch("/api/user/sync", { // FIXED: Added method, headers, body
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              // clerkUserId from auth() on server-side for security.
              // Only send data that Clerk provides and you want to sync.
              email: clerkUser.primaryEmailAddress.emailAddress,
              firstName: clerkUser.firstName,
              lastName: clerkUser.lastName,
              imageUrl: clerkUser.imageUrl,
            }),
          });
          if (!syncResponse.ok) {
            // Handle non-OK responses if needed, e.g., log an error
            const errorData = await syncResponse.json().catch(() => ({}));
            console.error("CONTEXT_SYNC_ERROR: /api/user/sync failed:", syncResponse.status, errorData.error);
          }
        } catch (error: unknown) { // FIXED: 'any' to 'unknown'
           console.error("CONTEXT_SYNC_ERROR: Exception during /api/user/sync POST:", error instanceof Error ? error.message : error);
        }
      }
    };
    if (clerkUser?.id) { // Ensure clerkUser is loaded
        syncUserWithDb();
    }
  }, [isSignedIn, clerkUser]); // Dependencies for this effect

  const isProUser = !isLoading && subscriptionStatus === "active";

  return (
    <SubscriptionContext.Provider
      value={{
        subscriptionStatus,
        stripeCustomerId,
        isLoading,
        isProUser,
        fetchSubscriptionStatus,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider"
    );
  }
  return context;
};