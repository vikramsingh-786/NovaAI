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
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();
  const searchParams = useSearchParams(); 

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
      let fetchedStatusThisCall: UserDocument["subscriptionStatus"] | null =
        null;

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
          setSubscriptionStatus("free");
          setStripeCustomerId(null);
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
            setSubscriptionStatus("free");
            setStripeCustomerId(null);
          }
        }
      } catch (error: any) {
        console.error(
          "CONTEXT_SUB_ERROR: Exception in fetchSubscriptionStatus:",
          error
        );
        fetchedStatusThisCall = "free";
        setSubscriptionStatus("free");
        setStripeCustomerId(null);
      } finally {
        if (forcePolling) {
          if (fetchedStatusThisCall === "active" || attempts >= 5) {
            isPollingActiveRef.current = false;
            setIsLoading(false);
            if (
              searchParams.has("subscription_success") ||
              searchParams.has("from_portal")
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
    if (searchParams.has("subscription_success")) {
      if (!isPollingActiveRef.current && !isRegularFetchActiveRef.current) {
        toast.success("Subscription successful! Your Pro plan is now active.", {
          autoClose: 5000,
        });
        fetchSubscriptionStatus({ forcePolling: true, attempts: 1 });
        actionTaken = true;
      }
    } else if (searchParams.has("from_portal")) {
      if (!isPollingActiveRef.current && !isRegularFetchActiveRef.current) {
        fetchSubscriptionStatus({ forcePolling: true, attempts: 1 });
        actionTaken = true;
      }
    } else if (searchParams.has("subscription_canceled")) {
      toast.info("Subscription process was canceled.", { autoClose: 5000 });
      actionTaken = true;
    }
    if (actionTaken && !isPollingActiveRef.current) {
      if (
        searchParams.has("subscription_canceled") ||
        (searchParams.has("from_portal") && !isPollingActiveRef.current)
      ) {
        const currentPath = window.location.pathname;
        const newSearchParams = new URLSearchParams(searchParams.toString());
        newSearchParams.delete("subscription_success"); // Clean all relevant
        newSearchParams.delete("subscription_canceled");
        newSearchParams.delete("from_portal");
        router.replace(
          `${currentPath}${
            newSearchParams.size > 0 ? "?" + newSearchParams.toString() : ""
          }`,
          { scroll: false }
        );
      }
    }
  }, [searchParams, router, fetchSubscriptionStatus]); 

  useEffect(() => {
    const syncUserWithDb = async () => {
      if (
        isSignedIn &&
        clerkUser?.id &&
        clerkUser.primaryEmailAddress?.emailAddress
      ) {
        try {
          await fetch("/api/user/sync", {
          });
        } catch (error: any) {
        }
      }
    };
    if (clerkUser?.id) syncUserWithDb();
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
