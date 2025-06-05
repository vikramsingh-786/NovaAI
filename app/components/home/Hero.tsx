"use client";

import { Sparkles, ArrowRight, Brain } from 'lucide-react';
import { motion, MotionProps } from 'framer-motion';
import Link from 'next/link';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import { forwardRef, PropsWithChildren, ButtonHTMLAttributes, AnchorHTMLAttributes, Suspense } from 'react';
import dynamic from 'next/dynamic';

const InteractiveBrainCanvas = dynamic(() => import('../ui/InteractiveBrain'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center opacity-50">
      <Brain className="w-16 h-16 text-[var(--accent-purple)]/50 animate-pulse" />
    </div>
  ),
});

type MotionElementProps = PropsWithChildren<
  (ButtonHTMLAttributes<HTMLButtonElement> & { as?: 'button' }) |
  (AnchorHTMLAttributes<HTMLAnchorElement> & { as: 'a'; href?: string })
> & MotionProps;

const MotionButton = forwardRef<HTMLButtonElement | HTMLAnchorElement, MotionElementProps>(
  ({ children, as = 'button', ...props }, ref) => {
    const commonMotionProps = {
      whileHover: { scale: 1.05, filter: "brightness(1.15)" }, 
      whileTap: { scale: 0.95 },                          
      transition: { type: 'spring', stiffness: 400, damping: 15 },
      ...props,
    };

    if (as === 'a') {
      return (
        <motion.a
          ref={ref as React.Ref<HTMLAnchorElement>}
          {...commonMotionProps}
        >
          {children}
        </motion.a>
      );
    }

    return (
      <motion.button
        ref={ref as React.Ref<HTMLButtonElement>}
        type="button" 
        {...commonMotionProps}
      >
        {children}
      </motion.button>
    );
  }
);
MotionButton.displayName = "MotionButton";

const Hero = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 120,
        damping: 12,
        mass: 0.5,
      },
    },
  };

  const gradientButtonVariants = {
    hover: {
      backgroundPosition: '100% 50%', 
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
      scale: 1.05, 
    },
    tap: {
      scale: 0.98,
    },
  };

  const watchDemoUrl = "https://www.youtube.com/watch?v=LhkC1X6BfB0"; 

  return (
    <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden">
      {/* Animated background element */}
      <div className="absolute inset-0 z-0 opacity-20 dark:opacity-30 pointer-events-none">
        <Suspense fallback={
          <div className="w-full h-full flex items-center justify-center">
            <Brain className="w-24 h-24 text-[var(--accent-purple)]/30 animate-pulse" />
          </div>
        }>
          <InteractiveBrainCanvas />
        </Suspense>
      </div>

      <motion.div
        className="max-w-4xl mx-auto text-center relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          variants={itemVariants}
          className="inline-flex items-center px-4 py-2 bg-[var(--card-bg)] rounded-full mb-8 backdrop-blur-sm border border-[var(--border-primary)] shadow-md hover:shadow-lg transition-shadow"
        >
          <Sparkles className="w-5 h-5 mr-2 text-[var(--accent-purple)] animate-pulse" />
          <span className="text-sm text-[var(--text-secondary)] font-medium">
            Powered by Advanced NovaAI
          </span>
        </motion.div>
        <motion.h1
          variants={itemVariants}
          className="text-5xl md:text-7xl font-extrabold mb-8 leading-tight"
        >
          <span className="bg-gradient-to-r from-[var(--hero-gradient-from)] via-[var(--hero-gradient-via)] to-[var(--hero-gradient-to)] bg-clip-text text-transparent">
            Think Smarter,
          </span>
          <br />
          <span className="bg-gradient-to-r from-[var(--hero-highlight-from)] to-[var(--hero-highlight-to)] bg-clip-text text-transparent">
            Create Faster
          </span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          variants={itemVariants}
          className="text-xl md:text-2xl text-[var(--text-secondary)] mb-12 max-w-3xl mx-auto leading-relaxed"
        >
          Experience the next generation of AI conversation. NovaAI understands context,
          reasons through complex problems, and adapts to your unique thinking style.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <SignedIn>
            <Link href="/dashboard">
              <MotionButton
                as="button"
                className="group relative bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] px-8 py-3 rounded-full text-lg font-semibold text-[var(--button-text)] overflow-hidden"
                style={{
                  backgroundSize: '200% 100%',
                  transition: 'background-position 0.5s ease', 
                }}
                variants={gradientButtonVariants} 
              >
                <span className="relative z-10 flex items-center">
                  Start Exploring
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </MotionButton>
            </Link>
          </SignedIn>
          
          <SignedOut>
            <SignInButton mode="modal" redirectUrl="/dashboard" asChild>
              <MotionButton
                className="group relative bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] px-8 py-3 rounded-full text-lg font-semibold text-[var(--button-text)] overflow-hidden"
                style={{
                  backgroundSize: '200% 100%',
                  transition: 'background-position 0.5s ease',
                }}
                variants={gradientButtonVariants}
              >
                <span className="relative z-10 flex items-center">
                  Start Exploring
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </MotionButton>
            </SignInButton>
          </SignedOut>
          <motion.a
            href={watchDemoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3 rounded-full text-lg font-semibold border-2 border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--accent-purple)] hover:bg-[var(--accent-purple)]/10 hover:text-[var(--accent-purple)] transition-all duration-300"
            whileHover={{ 
              scale: 1.05,
              boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)'
            }}
            whileTap={{ scale: 0.98 }}
          >
            Watch Demo
          </motion.a>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;