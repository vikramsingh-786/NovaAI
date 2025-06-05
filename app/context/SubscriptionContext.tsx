// app/context/SubscriptionContext.tsx
"use client"; // This context uses client hooks, so it's a client component module

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
import { useRouter, useSearchParams } from "next/navigation"; // useSearchParams makes this a client component
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

// RENAMED this export
export const ActualSubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const { isSignedIn, userId } = useAuth();
  const { user: clerkUser } = useUser();

  const [subscriptionStatus, setSubscriptionStatus] = useState<
    UserDocument["subscriptionStatus"] | null
  >(null);
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();
  const searchParams = useSearchParams(); // This hook makes this component client-side

  const isPollingActiveRef = useRef(false);
  const isRegularFetchActiveRef = useRef(false);

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
        if (isPollingActiveRef.current) { return; }
        isPollingActiveRef.current = true;
        isRegularFetchActiveRef.current = false;
      } else if (!forcePolling) {
        if (isRegularFetchActiveRef.current || isPollingActiveRef.current) { return;}
        isRegularFetchActiveRef.current = true;
      }
      setIsLoading(true);
      let fetchedStatusThisCall: UserDocument["subscriptionStatus"] | null = null;

      try {
        const response = await fetch("/api/user/status", { cache: "no-store" });
        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ error: `Server error ${response.status}` }));
          console.error(
            "CONTEXT_SUB_ERROR: Failed to fetch /api/user/status.",
            errorData.error
          );
          fetchedStatusThisCall = "free";
          if (!isPollingActiveRef.current || attempts >= 5) {
            setSubscriptionStatus("free");
            setStripeCustomerId(null);
          }
        } else {
          const data: { user: UserDocument } = await response.json();
          if (data.user) {
            const newStatus = data.user.subscriptionStatus || "free";
            fetchedStatusThisCall = newStatus;
            setSubscriptionStatus(newStatus);
            setStripeCustomerId(data.user.stripeCustomerId || null);

            if (forcePolling && newStatus !== "active" && attempts < 5) {
              setTimeout(
                () =>
                  fetchSubscriptionStatus({
                    forcePolling: true,
                    attempts: attempts + 1,
                  }),
                attempts * 1000 + 2000
              );
              return;
            }
          } else {
            fetchedStatusThisCall = "free";
            if (!isPollingActiveRef.current || attempts >= 5) {
              setSubscriptionStatus("free");
              setStripeCustomerId(null);
            }
          }
        }
      } catch (error: unknown) {
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
        if (forcePolling) {
          if (fetchedStatusThisCall === "active" || attempts >= 5) {
            isPollingActiveRef.current = false;
            setIsLoading(false);
            if (
              searchParams.has("subscription_success") ||
              searchParams.has("from_portal") ||
              searchParams.has("subscription_canceled")
            ) {
              const currentPath = window.location.pathname;
              const newSearchParams = new URLSearchParams(
                searchParams.toString()
              );
              newSearchParams.delete("subscription_success");
              newSearchParams.delete("from_portal");
              newSearchParams.delete("subscription_canceled");
              router.replace(
                `${currentPath}${
                  newSearchParams.size > 0
                    ? "?" + newSearchParams.toString()
                    : ""
                }`,
                { scroll: false }
              );
            }
          }
        } else {
          isRegularFetchActiveRef.current = false;
          setIsLoading(false);
        }
      }
    },
    [isSignedIn, userId, router, searchParams]
  );

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
  }, [isSignedIn, userId, fetchSubscriptionStatus]);

  useEffect(() => {
    let actionTaken = false;
    const shouldPoll = searchParams.has("subscription_success") || searchParams.has("from_portal");
    const wasCanceled = searchParams.has("subscription_canceled");

    if (shouldPoll) {
      if (!isPollingActiveRef.current && !isRegularFetchActiveRef.current) {
        if (searchParams.has("subscription_success")) {
            toast.success("Subscription successful! Your Pro plan is now active.", {
              autoClose: 5000,
            });
        }
        fetchSubscriptionStatus({ forcePolling: true, attempts: 1 });
        actionTaken = true;
      }
    } else if (wasCanceled) {
      toast.info("Subscription process was canceled.", { autoClose: 5000 });
      actionTaken = true;
    }

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
  }, [searchParams, router, fetchSubscriptionStatus]);

  useEffect(() => {
    const syncUserWithDb = async () => {
      if (
        isSignedIn &&
        clerkUser?.id &&
        clerkUser.primaryEmailAddress?.emailAddress
      ) {
        // console.log('%%%%% CONTEXT_SYNC: Preparing to POST to /api/user/sync for user:', clerkUser.id);
        try {
          const syncResponse = await fetch("/api/user/sync", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: clerkUser.primaryEmailAddress.emailAddress,
              firstName: clerkUser.firstName,
              lastName: clerkUser.lastName,
              imageUrl: clerkUser.imageUrl,
            }),
          });
          if (!syncResponse.ok) {
            const errorData = await syncResponse.json().catch(() => ({}));
            console.error("CONTEXT_SYNC_ERROR: /api/user/sync failed:", syncResponse.status, errorData.error);
          }
        } catch (error: unknown) {
           console.error("CONTEXT_SYNC_ERROR: Exception during /api/user/sync POST:", error instanceof Error ? error.message : error);
        }
      }
    };
    if (clerkUser?.id) {
        syncUserWithDb();
    }
  }, [isSignedIn, clerkUser]);

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