"use client";
import Navbar from '../components/home/Navbar'; 
import Footer from '../components/home/Footer';
import PricingSection from '../components/home/PricingSection'; 
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function PricingPage() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);


  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background-primary)] via-[var(--background-secondary)] to-[var(--background-primary)] text-[var(--text-primary)]">
      <Navbar scrollY={scrollY} /> {}
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <PricingSection />
        <div className="text-center mt-12">
          <Link href="/dashboard" className="text-[var(--accent-blue)] hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}