'use client';

import { useEffect } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { toast } from 'react-toastify';

const WELCOME_TOAST_SHOWN_KEY = 'novaWelcomeToastShownForSession';

export default function AuthListener() {
  const { user, isSignedIn: isClerkUserSignedIn } = useUser();
  const { isLoaded: isAuthHookLoaded, isSignedIn: isAuthHookSignedIn } = useAuth();

  useEffect(() => {
    if (!isAuthHookLoaded || !isClerkUserSignedIn) {
      if (!isAuthHookSignedIn && sessionStorage.getItem(WELCOME_TOAST_SHOWN_KEY)) {
        sessionStorage.removeItem(WELCOME_TOAST_SHOWN_KEY);
      }
      return;
    }

    if (user) {
      const welcomeToastShown = sessionStorage.getItem(WELCOME_TOAST_SHOWN_KEY);

      if (!welcomeToastShown) {
        toast.success(`Welcome back, ${user.firstName || user.username || 'User'}!`, {
          icon: '👋' as any,
          toastId: 'welcome-back-toast',
        });
        sessionStorage.setItem(WELCOME_TOAST_SHOWN_KEY, 'true');
      }
    }
  }, [user, isClerkUserSignedIn, isAuthHookLoaded, isAuthHookSignedIn]);

  return null; 
}