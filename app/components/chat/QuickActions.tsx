"use client";

import React from "react";
import { Code, FileText, Sparkles, Brain } from "lucide-react";
import { motion } from "framer-motion";
interface QuickActionsProps {
  onActionSelect: (action: string) => void;
}

const quickActions = [
  {
    icon: <Brain className="w-5 h-5" />,
    title: "Explain complex topics",
    prompt: "Explain quantum computing in simple terms",
    color: "text-purple-500 dark:text-purple-400",
  },
  {
    icon: <Code className="w-5 h-5" />,
    title: "Generate code snippets",
    prompt: "Write a Python function to fetch API data",
    color: "text-sky-500 dark:text-sky-400",
  },
  {
    icon: <FileText className="w-5 h-5" />,
    title: "Draft an email",
    prompt: "Draft a follow-up email for a job application",
    color: "text-emerald-500 dark:text-emerald-400",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 120, damping: 12 },
  },
  hover: {
    scale: 1.03,
    boxShadow: "0 4px 10px -2px var(--shadow-color-soft)",
    borderColor: "var(--border-accent)",
    transition: { duration: 0.2 },
  },
  tap: {
    scale: 0.97,
  },
};

export default function QuickActions({ onActionSelect }: QuickActionsProps) {
  return (
    <div className="px-4 pb-6 pt-2">
      {" "}
      {/* Adjusted padding */}
      <div className="max-w-3xl mx-auto">
        <motion.h3
          className="text-sm font-medium text-[var(--text-muted)] mb-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          Try asking NovaMind... {/* Renamed */}
        </motion.h3>
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {quickActions.map((action, index) => (
            <motion.button
              key={index}
              onClick={() => onActionSelect(action.prompt)}
              className="flex flex-col items-start p-3.5 bg-[var(--card-bg)] border border-[var(--border-primary)] rounded-lg hover:bg-[var(--background-accent)] text-left theme-transition shadow-sm hover:shadow-md"
              variants={itemVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <div className={`flex items-center mb-2.5 ${action.color}`}>
                {React.cloneElement(action.icon, { className: "w-6 h-6" })}{" "}
                {/* Ensure icon size */}
              </div>
              <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1.5">
                {action.title}
              </h4>
              <p className="text-xs text-[var(--text-muted)] leading-snug">
                {action.prompt}
              </p>
            </motion.button>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
