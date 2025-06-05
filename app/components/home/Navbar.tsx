"use client";

import { useState, useEffect, forwardRef, PropsWithChildren, ButtonHTMLAttributes } from "react";
import Link from "next/link";
import {
  UserButton,
  SignedIn,
  SignedOut,
  SignInButton,
  useUser,
} from "@clerk/nextjs";
import { Sparkles, Menu, X } from "lucide-react";
import { toast } from "react-toastify";
import LoadingSpinner from "../ui/LoadingSpinner";
import ThemeSwitcher from "../ui/ThemeSwitcher";
import { motion, AnimatePresence, MotionProps } from "framer-motion";

interface NavbarProps {
  scrollY: number;
}
type MotionButtonPropsForClerk = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & 
  MotionProps 
  & {
    redirectUrl?: string; 
    asChild?: boolean;    
    mode?: 'modal' | 'redirect'; 
  }
>;

const MotionButtonAsChild = forwardRef<HTMLButtonElement, MotionButtonPropsForClerk>(
  (props, ref) => {
    const {
      children,
      ...validHtmlAndMotionProps 
    } = props;

    return (
      <motion.button ref={ref} {...validHtmlAndMotionProps}>
        {children}
      </motion.button>
    );
  }
);
MotionButtonAsChild.displayName = "MotionButtonAsChild";


export default function Navbar({ scrollY }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { isLoaded: isClerkHookLoaded } = useUser();
  const [isClerkComponentsReady, setIsClerkComponentsReady] = useState(false);

  useEffect(() => {
    if (isClerkHookLoaded) {
      setIsClerkComponentsReady(true);
    }
  }, [isClerkHookLoaded]);

  const navItemVariants = {
    hover: {
      color: "var(--accent-purple)",
      scale: 1.05,
      transition: { duration: 0.2 },
    },
    tap: {
      scale: 0.95,
    },
  };

  const signInButtonMotionProps = {
    whileHover: { scale: 1.05, filter: "brightness(1.1)" },
    whileTap: { scale: 0.95 },
  };

  if (!isClerkComponentsReady) {
    return (
      <nav className="fixed w-full z-50 h-16 bg-transparent flex items-center justify-center">
        <LoadingSpinner size="sm" />
      </nav>
    );
  }

  return (
    <>
      {isLoading && <LoadingSpinner />}
      <nav
        className={`fixed w-full z-40 theme-transition ${
          scrollY > 50
            ? "bg-[var(--navbar-bg)] backdrop-blur-md border-b border-[var(--border-primary)] shadow-lg"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link
              href="/"
              className="flex items-center space-x-2 cursor-pointer group"
            >
              <motion.div
                className="w-10 h-10 bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg"
                whileHover={{ scale: 1.1, rotate: 15 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Sparkles className="w-6 h-6 text-white" />
              </motion.div>
              <span className="text-2xl font-bold bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-blue)] bg-clip-text text-transparent group-hover:opacity-80 theme-transition">
                NovaAI
              </span>
            </Link>
            <div className="hidden md:flex items-center space-x-6">
              <motion.a href="#features" className="text-[var(--text-secondary)] hover:text-[var(--accent-purple)] theme-transition" variants={navItemVariants} whileHover="hover" whileTap="tap">Features</motion.a>
              <motion.a href="#about" className="text-[var(--text-secondary)] hover:text-[var(--accent-purple)] theme-transition" variants={navItemVariants} whileHover="hover" whileTap="tap">About</motion.a>
              <motion.a href="#testimonials" className="text-[var(--text-secondary)] hover:text-[var(--accent-purple)] theme-transition" variants={navItemVariants} whileHover="hover" whileTap="tap">Testimonials</motion.a>

              <SignedIn>
                <motion.div variants={navItemVariants} whileHover="hover" whileTap="tap">
                  <Link href="/dashboard" className="text-[var(--text-secondary)] hover:text-[var(--accent-purple)] theme-transition">
                    Dashboard
                  </Link>
                </motion.div>
                <UserButton afterSignOutUrl="/" appearance={{
                    elements: {
                      userButtonAvatarBox: "w-8 h-8 ring-2 ring-[var(--accent-purple)]",
                      userButtonPopoverCard: "bg-[var(--background-accent)] border border-[var(--border-primary)] text-[var(--text-primary)] shadow-xl",
                      userButtonPopoverActionButton: "hover:bg-[var(--border-primary)]",
                      userButtonPopoverActionButtonText: "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                      userButtonPopoverActionButtonIcon: "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                      userButtonPopoverFooter: "hidden",
                    },
                  }}
                />
              </SignedIn>

              <SignedOut>
                <SignInButton
                  mode="modal"
                  redirectUrl="/dashboard"
                  asChild
                >
                  <MotionButtonAsChild
                    {...signInButtonMotionProps}
                    className="bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] px-6 py-2 rounded-full text-[var(--button-text)] font-semibold shadow-md hover:shadow-lg theme-transition"
                    onClick={() => {
                      setIsLoading(true);
                      toast.info("Redirecting to sign in...");
                    }}
                    type="button"
                  >
                    Sign In
                  </MotionButtonAsChild>
                </SignInButton>
              </SignedOut>
              <ThemeSwitcher />
            </div>
            <div className="md:hidden flex items-center space-x-2">
              <ThemeSwitcher />
              <button
                className="text-[var(--text-secondary)] hover:text-[var(--accent-purple)] p-1.5"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              key="mobile-menu"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="md:hidden bg-[var(--navbar-bg)]/95 backdrop-blur-lg border-t border-[var(--border-primary)] shadow-xl overflow-hidden"
            >
              <div className="px-4 py-6 space-y-4">
                {["Features", "About", "Testimonials"].map((item) => (
                  <a key={item} href={`#${item.toLowerCase()}`} className="block py-2 text-lg text-[var(--text-secondary)] hover:text-[var(--accent-purple)] theme-transition" onClick={() => setIsMenuOpen(false)}>
                    {item}
                  </a>
                ))}
                <SignedIn>
                  <Link href="/dashboard" className="block py-2 text-lg text-[var(--text-secondary)] hover:text-[var(--accent-purple)] theme-transition" onClick={() => setIsMenuOpen(false)}>
                    Dashboard
                  </Link>
                  <div className="pt-3 border-t border-[var(--border-primary)] mt-3">
                    <UserButton afterSignOutUrl="/" showName appearance={{
                        elements: {
                          userButtonAvatarBox: "w-10 h-10 ring-2 ring-[var(--accent-purple)]",
                          userButtonBox: "flex flex-row-reverse items-center space-x-reverse space-x-3",
                          userButtonTrigger: "focus:shadow-none w-full justify-start p-2 hover:bg-[var(--background-accent)] rounded-lg",
                          userButtonText: "text-md text-[var(--text-primary)]",
                          userButtonPopoverCard: "bg-[var(--card-bg)] border border-[var(--border-primary)] text-[var(--text-primary)] shadow-xl",
                          userButtonPopoverActionButton: "hover:bg-[var(--border-primary)]",
                          userButtonPopoverActionButtonText: "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                          userButtonPopoverActionButtonIcon: "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                        },
                      }}
                    />
                  </div>
                </SignedIn>
                <SignedOut>
                  <SignInButton
                    mode="modal"
                    redirectUrl="/dashboard"
                    asChild
                  >
                    <MotionButtonAsChild
                      {...signInButtonMotionProps}
                      className="w-full bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] px-6 py-3 rounded-lg text-[var(--button-text)] font-semibold shadow-md hover:shadow-lg theme-transition"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsLoading(true);
                        toast.info("Redirecting to sign in...");
                      }}
                      type="button"
                    >
                      Sign In
                    </MotionButtonAsChild>
                  </SignInButton>
                </SignedOut>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}