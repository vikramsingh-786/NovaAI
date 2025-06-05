"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useChat } from "@/hooks/useChat";
import { ChatContextType } from "@/types";

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const chatHookValue = useChat();

  return (
    <ChatContext.Provider value={chatHookValue}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext(): ChatContextType {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
}
