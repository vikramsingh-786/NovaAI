'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import ChatInterface from '../components/chat/ChatInterface'; 
import LoadingSpinner from '../components/ui/LoadingSpinner';   

export default function DashboardPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !userId) {
      router.push('/sign-in');
    }
  }, [isLoaded, userId, router]);

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--background-primary)]">
        <LoadingSpinner />
        <p className="ml-4 text-[var(--accent-purple)]">Loading your dashboard...</p>
      </div>
    );
  }

  if (!userId) {
    return (
        <div className="flex h-screen items-center justify-center bg-[var(--background-primary)]">
            <LoadingSpinner />
            <p className="ml-4 text-[var(--accent-purple)]">Redirecting...</p>
      </div>
    );
  }
  return <ChatInterface />;
}