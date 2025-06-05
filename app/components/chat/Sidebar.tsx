"use client";
import React, { useState, useEffect, useRef } from "react";
import {Plus,MessageSquare,User as UserIcon,Sparkles,MoreHorizontal,ChevronDown,Loader2,Check,X as LucideX,ArrowUpCircle,Settings,HardDrive, Zap,
} from "lucide-react";
import {SignedIn,SignedOut,UserButton,SignInButton,} from "@clerk/nextjs";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import ThemeSwitcher from "@/app/components/ui/ThemeSwitcher";
import { useSubscription } from "@/app/context/SubscriptionContext";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Message } from "@/types";

interface Chat {
  _id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt?: string;
}
interface SidebarProps {
  chats?: Chat[];
  currentChatId: string | null;
  onNewChat: () => void;
  onChatSelect: (chatId: string) => void;
  onCloseMobileSidebar?: () => void;
  isLoading?: boolean;
  renamingChatId: string | null;
  renamingTitleInput: string;
  onSetRenamingTitleInput: (title: string) => void;
  onStartRename: (chatId: string, currentTitle: string) => void;
  onConfirmRename: () => void;
  onCancelRename: () => void;
  onDeleteRequest: (chatId: string) => void;
  activeMenuChatId: string | null;
  setActiveMenuChatId: (id: string | null) => void;
}

export default function Sidebar({
  chats = [],
  currentChatId,
  onNewChat,
  onChatSelect,
  onCloseMobileSidebar,
  isLoading = false,
  renamingChatId,
  renamingTitleInput,
  onSetRenamingTitleInput,
  onStartRename,
  onConfirmRename,
  onCancelRename,
  onDeleteRequest,
  activeMenuChatId,
  setActiveMenuChatId,
}: SidebarProps) {
  const {
    isProUser,
    isLoading: isSubscriptionLoading,
    subscriptionStatus,
  } = useSubscription();
  const router = useRouter();
  const [showHistory, setShowHistory] = useState(true);
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

 const handleNewChatClick = () => {
    onNewChat();
    if (onCloseMobileSidebar) onCloseMobileSidebar();
    setActiveMenuChatId(null);
  };

  const handleChatSelectClick = (chatId: string) => {
    if (renamingChatId && renamingChatId !== chatId) {
      onCancelRename();
    }
    onChatSelect(chatId);
    if (onCloseMobileSidebar) onCloseMobileSidebar();
    setActiveMenuChatId(null);
  };

  const handleManageSubscription = async () => {
    setIsPortalLoading(true);
    try {
      const response = await fetch("/api/stripe/create-portal-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/dashboard`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create portal session.");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Could not open subscription management.";
      toast.error(errorMessage);
    } finally {
      setIsPortalLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Recent";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid date";
      const now = new Date();
      const diffTime = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (now.toDateString() === date.toDateString()) return "Today";
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      if (yesterday.toDateString() === date.toDateString()) return "Yesterday";
      if (diffDays < 7 && diffDays > 0) return `${diffDays} days ago`;
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Recent";
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuChatId(null);
      }
    };
    if (activeMenuChatId) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeMenuChatId, setActiveMenuChatId]);

  useEffect(() => {
    if (renamingChatId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingChatId]);


  const clerkUserButtonAppearance = {
    elements: {
      userButtonBox: "w-full",
      userButtonTrigger: `w-full flex items-center p-2 hover:bg-[var(--background-accent)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-purple)]`,
      userButtonAvatarBox: "w-8 h-8 mr-3 ring-1 ring-[var(--accent-purple)]", // Avatar on the left
      userButtonName: `flex-1 text-sm font-medium text-[var(--text-primary)] truncate text-left`,
      userButtonCaret: "text-[var(--text-muted)]",
      userButtonPopoverCard:
        "bg-[var(--card-bg)] border border-[var(--border-primary)] text-[var(--text-primary)] shadow-xl",
      userButtonPopoverActionButton: "hover:bg-[var(--border-primary)]",
      userButtonPopoverActionButtonText:
        "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
      userButtonPopoverActionButtonIcon:
        "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
      userButtonPopoverFooter: "hidden",
    },
  };

  const listItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  };

  return (
    <div className="w-full bg-[var(--card-bg)] flex flex-col h-full theme-transition">
      {/* Header Section */}
      <div className="p-4 border-b border-[var(--border-primary)]">
        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="flex items-center space-x-2 group">
            <motion.div
              className="w-9 h-9 bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg"
              whileHover={{ scale: 1.1, rotate: -10 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Sparkles className="w-5 h-5 text-white" />
            </motion.div>
            <span className="text-xl font-bold bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-blue)] bg-clip-text text-transparent group-hover:opacity-80 theme-transition">
              NovaAI
            </span>
          </Link>

          <div className="hidden md:block">
            <ThemeSwitcher />
          </div>
        </div>

        <motion.button
          onClick={handleNewChatClick}
          className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] hover:opacity-90 text-white rounded-lg shadow-md hover:shadow-lg theme-transition"
          whileHover={{ scale: 1.02, filter: "brightness(1.1)" }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-semibold">New Chat</span>
        </motion.button>
      </div>

      {/* Chat History Section */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-[var(--border-accent)] scrollbar-track-[var(--background-accent)]">
        <div className="space-y-1">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between p-2.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--background-accent)] hover:text-[var(--text-primary)] rounded-lg theme-transition"
          >
            <span>Chat History</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                showHistory ? "" : "-rotate-180"
              }`}
            />
          </button>

          <AnimatePresence initial={false}>
            {showHistory && (
              <motion.div
                className="mt-1 space-y-0.5"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center p-4 space-x-2 text-[var(--text-muted)]">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Loading chats...</span>
                  </div>
                ) : chats.length > 0 ? (
                  <AnimatePresence>
                    {chats.map((chat) => (
                      <motion.div
                        key={chat._id}
                        layout
                        variants={listItemVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{
                          type: "spring",
                          stiffness: 200,
                          damping: 25,
                        }}
                        onClick={() =>
                          renamingChatId !== chat._id &&
                          handleChatSelectClick(chat._id)
                        }
                        className={`group relative flex items-center justify-between p-2.5 rounded-lg theme-transition ${
                          currentChatId === chat._id && !renamingChatId
                            ? "bg-[var(--accent-purple)]/15 text-[var(--accent-purple)]"
                            : "hover:bg-[var(--background-accent)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        } ${
                          renamingChatId === chat._id
                            ? "bg-[var(--background-accent)]"
                            : ""
                        } ${
                          renamingChatId !== chat._id
                            ? "cursor-pointer"
                            : "cursor-default"
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                          <MessageSquare
                            className={`w-4 h-4 flex-shrink-0 ${
                              currentChatId === chat._id && !renamingChatId
                                ? "text-[var(--accent-purple)]"
                                : "text-[var(--text-muted)] group-hover:text-[var(--text-primary)]"
                            }`}
                          />
                          {renamingChatId === chat._id ? (
                            <div className="flex-1 min-w-0 flex items-center space-x-1.5">
                              <input
                                ref={renameInputRef}
                                type="text"
                                value={renamingTitleInput}
                                onChange={(e) =>
                                  onSetRenamingTitleInput(e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    onConfirmRename();
                                  }
                                  if (e.key === "Escape") {
                                    e.preventDefault();
                                    onCancelRename();
                                  }
                                }}
                                className="w-full text-sm px-2 py-1.5 border border-[var(--accent-purple)] rounded-md bg-[var(--card-bg)] text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--accent-purple)] outline-none theme-transition"
                                onClick={(e) => e.stopPropagation()} // Prevent chat selection
                              />
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onConfirmRename();
                                }}
                                className="p-1 text-green-500 hover:text-green-600 rounded-md hover:bg-green-500/10"
                                aria-label="Confirm rename"
                              >
                                <Check size={18} />
                              </motion.button>
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onCancelRename();
                                }}
                                className="p-1 text-red-500 hover:text-red-600 rounded-md hover:bg-red-500/10"
                                aria-label="Cancel rename"
                              >
                                <LucideX size={18} />
                              </motion.button>
                            </div>
                          ) : (
                            <span className="text-sm truncate">
                              {chat.title || "Untitled Chat"}
                            </span>
                          )}
                        </div>

                        {renamingChatId !== chat._id && (
                          <div className="flex items-center space-x-1.5 flex-shrink-0 pl-1">
                            <span className="text-xs text-[var(--text-muted)]/70 hidden group-hover:inline sm:inline">
                              {formatDate(chat.updatedAt || chat.createdAt)}
                            </span>
                            <motion.button
                              className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-0.5 rounded-full transition-opacity focus:opacity-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuChatId(
                                  activeMenuChatId === chat._id
                                    ? null
                                    : chat._id
                                );
                              }}
                              aria-label="More options"
                              whileTap={{ scale: 0.9 }}
                            >
                              <MoreHorizontal className="w-5 h-5" />
                            </motion.button>

                            <AnimatePresence>
                              {activeMenuChatId === chat._id && (
                                <motion.div
                                  ref={menuRef}
                                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                  transition={{ duration: 0.15 }}
                                  className="absolute right-0 sm:right-2 top-full mt-1.5 w-40 bg-[var(--card-bg)] rounded-lg shadow-xl z-20 border border-[var(--border-primary)] py-1.5"
                                  onClick={(e) => e.stopPropagation()} // Prevent chat selection
                                >
                                  <button
                                    onClick={() => {
                                      onStartRename(chat._id, chat.title);
                                      setActiveMenuChatId(null);
                                    }}
                                    className="flex items-center w-full text-left px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--background-accent)] hover:text-[var(--text-primary)] theme-transition"
                                  >
                                    Rename
                                  </button>
                                  <button
                                    onClick={() => {
                                      onDeleteRequest(chat._id);
                                      setActiveMenuChatId(null);
                                    }}
                                    className="flex items-center w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 hover:text-red-600 theme-transition"
                                  >
                                    Delete
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-3 text-sm text-[var(--text-muted)] text-center"
                  >
                    No chat history yet.
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Section */}
      <div className="p-3 border-t border-[var(--border-primary)]">
        <div className="flex items-start justify-between gap-2">
          {/* Left side - UserButton */}
          <div className="flex-shrink-0">
            <SignedIn>
              <UserButton
                afterSignOutUrl="/"
                userProfileMode="modal"
                appearance={clerkUserButtonAppearance}
              />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <motion.button
                  className="flex items-center justify-center p-2 bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] hover:opacity-90 text-white rounded-lg theme-transition shadow-md hover:shadow-lg"
                  aria-label="Sign In or Sign Up"
                  whileHover={{ scale: 1.02, filter: "brightness(1.1)" }}
                  whileTap={{ scale: 0.98 }}
                >
                  <UserIcon className="w-5 h-5" />
                </motion.button>
              </SignInButton>
            </SignedOut>
          </div>

          {/* Right side - Subscription and Storage info */}
          <div className="flex-1 space-y-2">
            {/* Subscription Status */}
            <SignedIn>
              {!isSubscriptionLoading ? (
                isProUser ? (
                  <motion.button
                    onClick={handleManageSubscription}
                    disabled={isPortalLoading}
                    className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg theme-transition text-sm font-medium shadow-sm"
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isPortalLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Settings className="w-4 h-4" />
                    )}
                    <span>Manage Pro Plan</span>
                  </motion.button>
                ) : (
                  subscriptionStatus !== "active" && (
                    <motion.button
                      onClick={() => router.push("/pricing")}
                      className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-[var(--accent-purple)]/20 hover:bg-[var(--accent-purple)]/30 text-[var(--accent-purple)] rounded-lg theme-transition text-sm font-medium shadow-sm"
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <ArrowUpCircle className="w-4 h-4" />
                      <span>Upgrade to Pro</span>
                    </motion.button>
                  )
                )
              ) : (
                <div className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-[var(--background-accent)] text-[var(--text-muted)] rounded-lg text-sm font-medium">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading status...</span>
                </div>
              )}
            </SignedIn>

            {/* Storage Usage */}
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)] px-2 py-1">
              <div className="flex items-center space-x-1">
                <HardDrive className="w-3 h-3" />
                <span>Storage</span>
              </div>
              <div className="flex items-center space-x-1">
                <Zap className="w-3 h-3 text-yellow-500" />
                <span>
                  {isProUser
                    ? "Unlimited"
                    : `${Math.min(chats.length, 5)}/5 chats`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
