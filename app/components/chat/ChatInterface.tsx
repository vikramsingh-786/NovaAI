"use client";

import React, { useState, useRef, useEffect, useCallback, ReactNode } from "react";
import Link from "next/link";
import Image from 'next/image';
import {
  Send,
  Mic,
  Paperclip,
  Menu,
  X as CloseIcon,
  Loader2,
  StopCircle,
  FileText,
  ImageIcon,
  Trash2,
} from "lucide-react";
import { toast } from "react-toastify";
import MessageBubble from "./MessageBubble";
import QuickActions from "./QuickActions";
import Sidebar from "./Sidebar";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import { motion, AnimatePresence } from "framer-motion";
import { useSubscription } from "@/app/context/SubscriptionContext";
import { useChatContext } from "@/app/context/ChatContext";
import {
  INITIAL_ASSISTANT_MESSAGE_CONTENT,
  DEFAULT_CHAT_TITLE,
} from "@/hooks/useChat";

// --- TypeScript Definitions for Web Speech API (FIXED 'any' to 'void') ---
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEventDetails {
  error:
    | "no-speech"
    | "audio-capture"
    | "not-allowed"
    | "network"
    | "aborted"
    | "language-not-supported"
    | "service-not-allowed"
    | "bad-grammar"
    | string;
  message: string;
}
interface CustomSpeechRecognition extends EventTarget {
  grammars: SpeechGrammarList;
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onaudiostart: ((this: CustomSpeechRecognition, ev: Event) => void) | null;
  onaudioend: ((this: CustomSpeechRecognition, ev: Event) => void) | null;
  onend: ((this: CustomSpeechRecognition, ev: Event) => void) | null;
  onerror:
    | ((
        this: CustomSpeechRecognition,
        ev: Event & Partial<SpeechRecognitionErrorEventDetails>
      ) => void)
    | null;
  onnomatch:
    | ((this: CustomSpeechRecognition, ev: SpeechRecognitionEvent) => void)
    | null;
  onresult:
    | ((this: CustomSpeechRecognition, ev: SpeechRecognitionEvent) => void)
    | null;
  onsoundstart: ((this: CustomSpeechRecognition, ev: Event) => void) | null;
  onsoundend: ((this: CustomSpeechRecognition, ev: Event) => void) | null;
  onspeechstart: ((this: CustomSpeechRecognition, ev: Event) => void) | null;
  onspeechend: ((this: CustomSpeechRecognition, ev: Event) => void) | null;
  onstart: ((this: CustomSpeechRecognition, ev: Event) => void) | null;
  addEventListener<K extends keyof SpeechRecognitionEventMap>(
    type: K,
    listener: (
      this: CustomSpeechRecognition,
      ev: SpeechRecognitionEventMap[K]
    ) => void,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener<K extends keyof SpeechRecognitionEventMap>(
    type: K,
    listener: (
      this: CustomSpeechRecognition,
      ev: SpeechRecognitionEventMap[K]
    ) => void,
    options?: boolean | EventListenerOptions
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void;
}
interface SpeechRecognitionEventMap {
  audiostart: Event;
  audioend: Event;
  end: Event;
  error: Event & Partial<SpeechRecognitionErrorEventDetails>;
  nomatch: SpeechRecognitionEvent;
  result: SpeechRecognitionEvent;
  soundstart: Event;
  soundend: Event;
  speechstart: Event;
  speechend: Event;
  start: Event;
}
declare global {
  interface Window {
    SpeechRecognition?: {
      prototype: CustomSpeechRecognition;
      new (): CustomSpeechRecognition;
    };
    webkitSpeechRecognition?: {
      prototype: CustomSpeechRecognition;
      new (): CustomSpeechRecognition;
    };
  }
  interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
  }
  interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
  }
  interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
  }
  type SpeechGrammarList = Record<string, unknown>; // Represent as an object type
}
// --- End TypeScript Definitions ---

export default function ChatInterface() {
  const {
    messages,
    chats,
    currentChatId,
    isLoading: isAISendingReceiving,
    isLoadingChats,
    isCreatingChat,
    isDeletingChat: isContextDeletingChat,
    isRenamingChat: isContextRenamingChat,
    loadChats: contextLoadChats,
    createNewChat: contextCreateNewChat,
    selectChat: contextSelectChat,
    sendMessage: contextSendMessage,
    renameChat: contextRenameChat,
    deleteChat: contextDeleteChat,
    stopStreaming: contextStopStreaming,
  } = useChatContext();

  const [inputValue, setInputValue] = useState("");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [renamingChatId, setRenamingChatId] = useState<string | null>(null);
  const [renamingTitleInput, setRenamingTitleInput] = useState<string>("");
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [chatIdToDelete, setChatIdToDelete] = useState<string | null>(null);
  const [activeMenuChatId, setActiveMenuChatId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const speechRecognitionRef = useRef<CustomSpeechRecognition | null>(null);
  const autoSubmitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isProUser, isLoading: isSubscriptionLoading } = useSubscription();

  const scrollToBottom = useCallback(() => {
    setTimeout(
      () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
      50
    );
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight =
        parseInt(getComputedStyle(textareaRef.current).maxHeight, 10) || 160;
      textareaRef.current.style.height = `${Math.min(
        scrollHeight,
        maxHeight
      )}px`;
      if (scrollHeight > maxHeight) {
        textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
      }
    }
  }, [inputValue]);

  useEffect(() => {
    contextLoadChats();
  }, [contextLoadChats]);


  const onCancelRename = useCallback(() => {
    setRenamingChatId(null);
    setRenamingTitleInput("");
  }, []); // setRenamingChatId & setRenamingTitleInput are stable

  const handleSubmit = useCallback(async (promptFromMic?: string) => {
    const textToSubmit = promptFromMic || inputValue;
    if (!textToSubmit.trim() && !selectedFile) return;
    if (isAISendingReceiving || (isListening && !promptFromMic)) return;
    if (renamingChatId) onCancelRename();

    await contextSendMessage(textToSubmit.trim(), selectedFile || undefined);
    setInputValue("");
    if (selectedFile) { // Only clear if a file was actually part of the submission
        setSelectedFile(null);
        setFilePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [inputValue, selectedFile, isAISendingReceiving, isListening, renamingChatId, contextSendMessage, onCancelRename]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognitionAPI =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        const recognitionInstance: CustomSpeechRecognition =
          new SpeechRecognitionAPI();
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = "en-US";

        recognitionInstance.onresult = (eventParam) => {
          const event = eventParam as SpeechRecognitionEvent;
          let interimTranscript = "";
          let finalTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          const currentTranscript = finalTranscript || interimTranscript;
          setInputValue(currentTranscript);

          if (autoSubmitTimerRef.current) {
            clearTimeout(autoSubmitTimerRef.current);
          }
          if (currentTranscript.trim()) {
            const isFinalResult =
              event.results[event.results.length - 1].isFinal;
            const delay = isFinalResult ? 700 : 1500;
            autoSubmitTimerRef.current = setTimeout(() => {
              if (
                textareaRef.current?.value.trim() ===
                  currentTranscript.trim() &&
                !isAISendingReceiving
              ) {
                handleSubmit(currentTranscript.trim());
              }
            }, delay);
          }
        };
        recognitionInstance.onerror = (eventParam) => {
          const event = eventParam as Event &
            Partial<SpeechRecognitionErrorEventDetails>;
          const errorCode = event.error || "unknown error";
          const eventMessage = event.message || "";
          console.error(
            "Speech recognition error code:", errorCode, "Message:", eventMessage
          );
          if (autoSubmitTimerRef.current) {
            clearTimeout(autoSubmitTimerRef.current);
          }
          let errorMessageText = "Speech recognition error.";
          if (errorCode === "no-speech") errorMessageText = "No speech detected.";
          else if (errorCode === "audio-capture") errorMessageText = "Microphone problem.";
          else if (errorCode === "not-allowed") errorMessageText = "Microphone permission denied.";
          else if (eventMessage) errorMessageText = eventMessage;
          toast.error(errorMessageText);
          setIsListening(false);
        };
        recognitionInstance.onend = () => {
          setIsListening(false);
          if (autoSubmitTimerRef.current) {
            clearTimeout(autoSubmitTimerRef.current);
          }
        };
        speechRecognitionRef.current = recognitionInstance;
      }
    }
    return () => {
      if (autoSubmitTimerRef.current) clearTimeout(autoSubmitTimerRef.current);
      if (speechRecognitionRef.current && isListening) {
        try {
          speechRecognitionRef.current.stop();
        } catch (_e: unknown) { /* ignore */ }
      }
    };
  }, [isListening, isAISendingReceiving, handleSubmit]); // Added handleSubmit

  const clearSelectedFile = useCallback(() => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []); // set... functions from useState are stable

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(`File too large (max ${maxSize / (1024 * 1024)}MB).`);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      const allowedDocTypes = [
        "application/pdf", "text/plain",
        "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      const allowedImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (![...allowedDocTypes, ...allowedImageTypes].includes(file.type)) {
        toast.error("Unsupported file. Use PDF, TXT, DOC(X), PNG, JPG, GIF, WEBP.");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      if (!isSubscriptionLoading && !isProUser) {
        toast.info(
          <div>
            File attachments are a Pro feature.{" "}
            <Link href="/pricing" className="underline text-[var(--accent-purple)]">Upgrade to Pro</Link>.
          </div>, { autoClose: 5000 }
        );
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setSelectedFile(file);
      if (allowedImageTypes.includes(file.type)) {
        const reader = new FileReader();
        reader.onloadend = () => setFilePreview(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleNewChat = useCallback(async () => {
    if (renamingChatId) onCancelRename();
    await contextCreateNewChat(DEFAULT_CHAT_TITLE);
    setIsMobileSidebarOpen(false);
    clearSelectedFile();
    setInputValue("");
  }, [renamingChatId, onCancelRename, contextCreateNewChat, clearSelectedFile]); // Added clearSelectedFile

  const handleChatSelect = useCallback(async (chatId: string) => {
    if (renamingChatId) onCancelRename();
    if (chatId === currentChatId) {
      if (isMobileSidebarOpen) setIsMobileSidebarOpen(false);
      return;
    }
    await contextSelectChat(chatId);
    setIsMobileSidebarOpen(false);
    clearSelectedFile();
    setInputValue("");
  }, [renamingChatId, onCancelRename, currentChatId, isMobileSidebarOpen, contextSelectChat, clearSelectedFile]);

  const handleStopStreaming = useCallback(() => {
    contextStopStreaming();
  }, [contextStopStreaming]);

  const handleStartRename = useCallback((chatId: string, currentTitle: string) => {
    setRenamingChatId(chatId);
    setRenamingTitleInput(currentTitle);
    setActiveMenuChatId(null);
  }, []); // set... functions are stable

  const onConfirmRename = useCallback(async () => {
    if (!renamingChatId || !renamingTitleInput.trim()) {
      onCancelRename();
      return;
    }
    await contextRenameChat(renamingChatId, renamingTitleInput.trim());
    onCancelRename();
  }, [renamingChatId, renamingTitleInput, contextRenameChat, onCancelRename]);

  const handleDeleteRequest = useCallback((chatId: string) => {
    setChatIdToDelete(chatId);
    setShowDeleteConfirmModal(true);
    setActiveMenuChatId(null);
  }, []); // set... functions are stable

  const handleCancelDelete = useCallback(() => {
    setShowDeleteConfirmModal(false);
    setChatIdToDelete(null);
  }, []); // set... functions are stable

  const handleConfirmDelete = useCallback(async () => {
    if (!chatIdToDelete) return;
    await contextDeleteChat(chatIdToDelete);
    handleCancelDelete();
  }, [chatIdToDelete, contextDeleteChat, handleCancelDelete]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (
      e.key === "Enter" && !e.shiftKey &&
      !isAISendingReceiving && !isListening
    ) {
      e.preventDefault();
      handleSubmit();
    }
  }, [isAISendingReceiving, isListening, handleSubmit]);

  const handleQuickAction = useCallback((action: string) => {
    setInputValue(action);
    if (textareaRef.current) textareaRef.current.focus();
    clearSelectedFile();
  }, [clearSelectedFile]); // setInputValue is stable

  const toggleMobileSidebar = useCallback(() =>
    setIsMobileSidebarOpen(prev => !prev), []); // Dependency on isMobileSidebarOpen removed by using functional update

  const showQuickActions =
    (!currentChatId ||
      (messages.length === 1 &&
        messages[0]?.content === INITIAL_ASSISTANT_MESSAGE_CONTENT)) &&
    !selectedFile &&
    !renamingChatId;

  const handleMicClick = useCallback(() => {
    if (isAISendingReceiving || selectedFile) {
      toast.info(selectedFile ? "Clear selected file to use microphone." : "Wait for AI response to complete.");
      return;
    }
    if (!speechRecognitionRef.current) {
      toast.info("Speech recognition is not supported or not yet initialized.");
      return;
    }
    if (isListening) {
      speechRecognitionRef.current.stop();
      if (autoSubmitTimerRef.current) clearTimeout(autoSubmitTimerRef.current);
      // setIsListening will be set by the 'onend' callback of SpeechRecognition
    } else {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then(() => {
          setInputValue(""); // Clear input when starting mic
          speechRecognitionRef.current?.start();
          setIsListening(true);
          toast.info("Listening...", { autoClose: 2000, position: "bottom-center" });
        })
        .catch((err: Error) => { // Type the error
          console.error("Mic access error:", err);
          if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
            toast.error("Microphone access denied.");
          } else {
            toast.error("Could not access microphone.");
          }
          setIsListening(false);
        });
    }
  }, [isAISendingReceiving, selectedFile, isListening]); // setIsListening, setInputValue are stable

  const canUseAdvancedFeatures = isProUser;
  const isWaitingForFirstAIChunk =
    isAISendingReceiving &&
    messages.length > 0 &&
    messages[messages.length - 1].type === "assistant" &&
    messages[messages.length - 1].isStreaming &&
    messages[messages.length - 1].content === "";

  return (
    <div className="flex h-screen bg-[var(--background-primary)] text-[var(--text-primary)] theme-transition">
      <motion.button
        onClick={toggleMobileSidebar}
        className="md:hidden fixed left-3 top-3 z-30 p-2.5 bg-[var(--background-accent)] rounded-full shadow-lg text-[var(--text-secondary)] hover:bg-[var(--border-primary)] hover:text-[var(--text-primary)] theme-transition"
        aria-label="Toggle sidebar" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
      >
        {isMobileSidebarOpen ? <CloseIcon size={20} /> : <Menu size={20} />}
      </motion.button>

      <motion.div
        className={`fixed md:relative z-20 w-64 sm:w-72 h-full bg-[var(--card-bg)] border-r border-[var(--border-primary)] shadow-xl md:shadow-none`}
        initial={{ x: "-100%" }}
        animate={{ x: (isMobileSidebarOpen || (typeof window !== 'undefined' && window.innerWidth >= 768)) ? "0%" : "-100%" }}
        transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
      >
        <Sidebar
          chats={chats}
          currentChatId={currentChatId}
          onNewChat={handleNewChat}
          onChatSelect={handleChatSelect}
          onCloseMobileSidebar={() => setIsMobileSidebarOpen(false)}
          isLoading={isLoadingChats || isCreatingChat}
          renamingChatId={renamingChatId}
          renamingTitleInput={renamingTitleInput}
          onSetRenamingTitleInput={setRenamingTitleInput}
          onStartRename={handleStartRename}
          onConfirmRename={onConfirmRename}
          onCancelRename={onCancelRename}
          onDeleteRequest={handleDeleteRequest}
          activeMenuChatId={activeMenuChatId}
          setActiveMenuChatId={setActiveMenuChatId}
        />
      </motion.div>

      <AnimatePresence>
        {isMobileSidebarOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-10 md:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col overflow-hidden">
        {isAISendingReceiving && !messages.some(m => m.isStreaming && m.content !== "") && !isWaitingForFirstAIChunk && (
           <div className="p-2 text-center text-sm text-[var(--text-muted)] bg-[var(--background-accent)]/70 border-b border-[var(--border-primary)]">
             <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-center"
             >
                <Loader2 className="w-4 h-4 animate-spin mr-2 text-[var(--accent-purple)]" />
                <span>NovaAI is processing your request...</span>
             </motion.div>
           </div>
         )}

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-4 pt-16 md:pt-6 scroll-smooth bg-[var(--background-primary)]">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={`${message.id}-${message.timestamp}`} 
                layout
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                transition={{ type: "spring", stiffness: 150, damping: 20, duration: 0.3 }}
              >
                <MessageBubble message={message} />
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} className="h-0.5" />
        </div>

        {showQuickActions && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <QuickActions onActionSelect={handleQuickAction} />
          </motion.div>
        )}

        <div className="border-t border-[var(--border-primary)] p-2 sm:p-3 md:p-4 bg-[var(--card-bg)]">
          <div className="max-w-3xl mx-auto">
            <AnimatePresence>
              {selectedFile && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: "0.5rem" }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="p-2.5 bg-[var(--background-accent)] rounded-lg flex items-center justify-between text-sm border border-[var(--border-primary)]"
                >
                  <div className="flex items-center space-x-2 overflow-hidden">
                    {filePreview ? (
                      <Image
                        src={filePreview} alt={selectedFile.name || "File preview"}
                        width={40} height={40}
                        className="w-10 h-10 object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-md bg-[var(--border-primary)] flex items-center justify-center">
                        {selectedFile.type.startsWith("image/") ? <ImageIcon className="w-5 h-5 text-[var(--text-muted)]" /> : <FileText className="w-5 h-5 text-[var(--text-muted)]" />}
                      </div>
                    )}
                    <span className="truncate text-[var(--text-secondary)]" title={selectedFile.name}>{selectedFile.name}</span>
                    <span className="text-xs text-[var(--text-muted)] flex-shrink-0"> ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <motion.button
                    onClick={clearSelectedFile} disabled={isAISendingReceiving}
                    className="p-1.5 text-red-500 hover:text-red-700 disabled:text-[var(--text-muted)] rounded-full hover:bg-red-500/10"
                    aria-label="Remove selected file" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  ><Trash2 size={18} /></motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className={`relative ${isAISendingReceiving ? 'opacity-70 cursor-wait' : ''}`}>
              <div className="flex items-end space-x-1.5 sm:space-x-2">
                <input
                  type="file" ref={fileInputRef} hidden onChange={handleFileChange}
                  accept=".pdf,.txt,.doc,.docx,image/png,image/jpeg,image/gif,image/webp"
                  disabled={isAISendingReceiving || isListening || !!selectedFile || (!isSubscriptionLoading && !canUseAdvancedFeatures) || !!renamingChatId || isContextRenamingChat}
                />
                <motion.button
                  type="button"
                  title={(!isSubscriptionLoading && !canUseAdvancedFeatures) ? "File Attachments (Pro Feature)" : "Attach file"}
                  onClick={() => {
                    if (!isAISendingReceiving && !isListening && !selectedFile && (isSubscriptionLoading || canUseAdvancedFeatures) && !renamingChatId && !isContextRenamingChat) {
                      fileInputRef.current?.click();
                    } else if (!isSubscriptionLoading && !canUseAdvancedFeatures) {
                      toast.info(<div>File attachments are a Pro feature. <Link href="/pricing" className="underline text-[var(--accent-purple)]">Upgrade to Pro</Link>.</div>, { autoClose: 5000 });
                    }
                  }}
                  disabled={isAISendingReceiving || isListening || !!selectedFile || (!isSubscriptionLoading && !canUseAdvancedFeatures) || !!renamingChatId || isContextRenamingChat}
                  className="p-2.5 text-[var(--text-muted)] hover:text-[var(--accent-purple)] rounded-lg theme-transition disabled:opacity-50 disabled:cursor-not-allowed hidden sm:inline-flex items-center justify-center"
                  aria-label="Attach file" whileHover={{ scale: 1.1, backgroundColor: "var(--background-accent)" }} whileTap={{ scale: 0.9 }}
                ><Paperclip className="w-5 h-5" /></motion.button>

                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef} value={inputValue}
                    onChange={(e) => {
                      if (isListening && autoSubmitTimerRef.current) clearTimeout(autoSubmitTimerRef.current);
                      setInputValue(e.target.value);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={isListening ? "Listening..." : selectedFile ? "Add a message for the file..." : "Message NovaAI..."}
                    className="w-full min-h-[46px] sm:min-h-[48px] max-h-32 sm:max-h-40 px-4 py-3 pr-10 sm:pr-12 bg-[var(--background-accent)] border border-[var(--border-primary)] rounded-xl focus:outline-none focus:ring-1 sm:focus:ring-2 focus:ring-[var(--accent-purple)] focus:border-transparent resize-none text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] theme-transition"
                    rows={1}
                    disabled={isAISendingReceiving || !!renamingChatId || isContextRenamingChat || (isListening && !inputValue)}
                  />
                  <motion.button
                    type="button" title={isListening ? "Stop listening" : "Use microphone"} onClick={handleMicClick}
                    disabled={isAISendingReceiving || !!selectedFile || (!speechRecognitionRef.current && !isListening) || !!renamingChatId || isContextRenamingChat}
                    className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full theme-transition ${isAISendingReceiving || !!selectedFile || (!speechRecognitionRef.current && !isListening) || !!renamingChatId || isContextRenamingChat ? "text-[var(--text-muted)] cursor-not-allowed opacity-60" : isListening ? "text-red-500 bg-red-500/10 animate-pulse" : "text-[var(--accent-purple)] hover:text-[var(--accent-purple)] hover:bg-[var(--accent-purple)]/10"}`}
                    aria-label={isListening ? "Stop listening" : "Use microphone"}
                    whileHover={{ scale: !isAISendingReceiving && !selectedFile && speechRecognitionRef.current && !renamingChatId && !isContextRenamingChat ? 1.1 : 1 }}
                    whileTap={{ scale: !isAISendingReceiving && !selectedFile && speechRecognitionRef.current && !renamingChatId && !isContextRenamingChat ? 0.9 : 1 }}
                  >{isListening ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}</motion.button>
                </div>

                <motion.button
                  onClick={isAISendingReceiving && messages.some(m => m.isStreaming) ? handleStopStreaming : handleSubmit}
                  disabled={
                    (!isAISendingReceiving && !messages.some(m => m.isStreaming) && !inputValue.trim() && !selectedFile) ||
                    (isAISendingReceiving && !messages.some(m => m.isStreaming) && !inputValue.trim() && !selectedFile) ||
                    !!renamingChatId || isContextRenamingChat || (isListening && !isAISendingReceiving)
                  }
                  className="p-2.5 sm:p-3 bg-[var(--accent-purple)] hover:bg-[var(--accent-purple)]/80 disabled:bg-[var(--border-primary)] disabled:text-[var(--text-muted)] disabled:cursor-not-allowed text-white rounded-xl theme-transition flex items-center justify-center"
                  aria-label={isAISendingReceiving && messages.some(m => m.isStreaming) ? "Stop generating" : "Send message"}
                  whileHover={{ scale: 1.05, filter: "brightness(1.1)" }} whileTap={{ scale: 0.95 }}
                >
                  {isAISendingReceiving && messages.some(m => m.isStreaming) ? (
                     <StopCircle className="w-5 h-5" />
                  ) : isAISendingReceiving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </motion.button>
              </div>
            </div>
            <div className="text-center mt-2 px-2">
              <p className="text-[10px] sm:text-xs text-[var(--text-muted)]">NovaAI can make mistakes. Consider checking important information.</p>
            </div>
            {!isSubscriptionLoading && !isProUser && (
              <p className="text-center text-xs text-[var(--accent-purple)] mt-1">Some features are limited. <Link href="/pricing" className="underline font-semibold">Upgrade to Pro</Link> for full access.</p>
            )}
          </div>
        </div>
      </div>
      <ConfirmDeleteModal
        isOpen={showDeleteConfirmModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        chatTitle={chats.find((c) => c._id === chatIdToDelete)?.title}
        isLoading={isContextDeletingChat}
      />
    </div>
  );
}