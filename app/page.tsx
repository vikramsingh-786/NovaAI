"use client";
import { useEffect, useState } from "react";
import Navbar from "./components/home/Navbar";
import Hero from "./components/home/Hero";
import Features from "./components/home/Features";
import About from "./components/home/About";
import Testimonials from "./components/home/Testimonials";
import CallToAction from "./components/home/CallToAction";
import Footer from "./components/home/Footer";
import AuthListener from "./components/auth/AuthListener";
import PricingSection from "./components/home/PricingSection";

export default function Home() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background-primary)] via-[var(--background-secondary)] to-[var(--background-primary)] text-[var(--text-primary)] overflow-hidden">
      <AuthListener />
      <div className="fixed inset-0 opacity-30 dark:opacity-40 light:opacity-20 theme-transition"> 
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full mix-blend-multiply filter blur-xl animate-pulse theme-transition"
          style={{ backgroundColor: 'var(--blob1-color)' }}
        ></div>
        <div
          className="absolute top-3/4 right-1/4 w-96 h-96 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000 theme-transition"
          style={{ backgroundColor: 'var(--blob2-color)' }}
        ></div>
        <div
          className="absolute bottom-1/4 left-1/2 w-96 h-96 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000 theme-transition"
          style={{ backgroundColor: 'var(--blob3-color)' }}
        ></div>
      </div>
      <Navbar scrollY={scrollY} />
      <main className="relative z-10"> 
        <Hero />
        <Features />
        <About />
        <Testimonials />
         <PricingSection />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
}