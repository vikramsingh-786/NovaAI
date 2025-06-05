// app/components/auth/AuthListener.tsx
'use client';

import { useEffect } from 'react'; // Import ReactNode if needed for stricter typing
import { useUser, useAuth } from '@clerk/nextjs';
import { toast, ToastOptions } from 'react-toastify'; // Import ToastOptions for better typing

const WELCOME_TOAST_SHOWN_KEY = 'novaWelcomeToastShownForSession';

export default function AuthListener() {
  const { user, isSignedIn: isClerkUserSignedIn } = useUser();
  const { isLoaded: isAuthHookLoaded, isSignedIn: isAuthHookSignedIn } = useAuth();

  useEffect(() => {
    if (!isAuthHookLoaded) { // Only need to check if auth hook is loaded
      return;
    }

    if (!isAuthHookSignedIn) { // If user is definitively signed out
      if (sessionStorage.getItem(WELCOME_TOAST_SHOWN_KEY)) {
        sessionStorage.removeItem(WELCOME_TOAST_SHOWN_KEY);
        // console.log("AuthListener: User signed out, welcome toast flag cleared.");
      }
      return;
    }

    // If we reach here, isAuthHookLoaded is true AND isAuthHookSignedIn is true
    // Now check if user object is also available (isClerkUserSignedIn implies user should be loaded)
    if (user && isClerkUserSignedIn) {
      const welcomeToastShown = sessionStorage.getItem(WELCOME_TOAST_SHOWN_KEY);

      if (!welcomeToastShown) {
        // console.log("AuthListener: Showing welcome toast for the first time this session.");

        // Define toast options with explicit types if needed
        const toastProps: ToastOptions = {
          icon: '👋', // Directly use the string emoji
          toastId: 'welcome-back-toast',
        };

        toast.success(`Welcome back, ${user.firstName || user.username || 'User'}!`, toastProps);
        sessionStorage.setItem(WELCOME_TOAST_SHOWN_KEY, 'true');
      } else {
        // console.log("AuthListener: Welcome toast already shown this session.");
      }
    }
  }, [user, isClerkUserSignedIn, isAuthHookLoaded, isAuthHookSignedIn]);

  return null;
}