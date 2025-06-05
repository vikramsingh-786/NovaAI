import React from "react";
import { Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  chatTitle?: string;
  isLoading?: boolean;
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  chatTitle,
  isLoading = false,
}: ConfirmDeleteModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="bg-[var(--card-bg)] p-6 rounded-xl shadow-2xl w-full max-w-md border border-[var(--border-primary)]"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
              delay: 0.05,
            }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                Confirm Deletion
              </h2>
              <button
                onClick={onClose}
                disabled={isLoading}
                className="p-1.5 rounded-full text-[var(--text-muted)] hover:bg-[var(--background-accent)] hover:text-[var(--text-primary)]"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-8">
              Are you sure you want to delete the chat "
              {chatTitle || "this chat"}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <motion.button
                onClick={onClose}
                disabled={isLoading}
                className="px-5 py-2.5 text-sm font-medium rounded-lg bg-[var(--background-accent)] text-[var(--text-secondary)] hover:bg-[var(--border-primary)] hover:text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-purple)]/50 disabled:opacity-70 theme-transition"
                whileHover={{ scale: isLoading ? 1 : 1.05 }}
                whileTap={{ scale: isLoading ? 1 : 0.95 }}
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={onConfirm}
                disabled={isLoading}
                className="px-5 py-2.5 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-[var(--card-bg)] disabled:opacity-70 flex items-center justify-center theme-transition"
                whileHover={{ scale: isLoading ? 1 : 1.05 }}
                whileTap={{ scale: isLoading ? 1 : 0.95 }}
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Delete
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
