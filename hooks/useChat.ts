import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { Message, Chat, ChatContextType } from "@/types";
import { useSubscription } from "@/app/context/SubscriptionContext";

export const INITIAL_ASSISTANT_MESSAGE_CONTENT =
  "Hello! I'm NovaAI, your AI assistant. How can I help you today?";
export const DEFAULT_CHAT_TITLE = "New Chat";
export const UNTITLED_CHAT_TITLE = "Untitled Chat";

export function useChat(): ChatContextType {
  const [messages, setMessagesInternal] = useState<Message[]>([]);
  const [chats, setChatsInternal] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatIdInternal] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoadingInternal] = useState(false);
  const [isLoadingChats, setIsLoadingChatsInternal] = useState(false);
  const [isCreatingChat, setIsCreatingChatInternal] = useState(false);
  const [isDeletingChat, setIsDeletingChatInternal] = useState(false);
  const [isRenamingChat, setIsRenamingChatInternal] = useState(false);

  const { isProUser, isLoading: isSubscriptionLoading } = useSubscription();
  const abortControllerRef = useRef<AbortController | null>(null);

  const initialAssistantMessage = useCallback(
    (): Message => ({
      id: Date.now(),
      type: "assistant",
      content: INITIAL_ASSISTANT_MESSAGE_CONTENT,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isStreaming: false,
    }),
    []
  );

  useEffect(() => {
    if (!currentChatId && messages.length === 0) {
      setMessagesInternal([initialAssistantMessage()]);
    }
  }, [currentChatId, messages.length, initialAssistantMessage]);

  const sortChats = (chatArray: Chat[]): Chat[] => {
    return [...chatArray].sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() -
        new Date(a.updatedAt || a.createdAt).getTime()
    );
  };

  const loadChats = useCallback(async () => {
    setIsLoadingChatsInternal(true);
    try {
      const response = await fetch("/api/chats");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to load chats");
      }
      const data = await response.json();
      setChatsInternal(sortChats(data.chats || []));
    } catch (error: any) {
      console.error("useChat - Error loading chats:", error);
      toast.error(error.message || "Failed to load chat history.");
      setChatsInternal([]);
    } finally {
      setIsLoadingChatsInternal(false);
    }
  }, []);
  const renameChat = useCallback(
    async (
      chatId: string,
      newTitle: string,
      silent: boolean = false
    ): Promise<boolean> => {
      if (!newTitle.trim() || !chatId) return false;
      const originalChat = chats.find((c) => c._id === chatId);
      if (!originalChat || newTitle.trim() === originalChat.title) return true;

      setIsRenamingChatInternal(true);
      const oldTitle = originalChat.title;
      setChatsInternal((prev) =>
        sortChats(
          prev.map((chat) =>
            chat._id === chatId
              ? {
                  ...chat,
                  title: newTitle,
                  updatedAt: new Date().toISOString(),
                }
              : chat
          )
        )
      );

      try {
        const response = await fetch(`/api/chats/${chatId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: newTitle }),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to rename chat");
        }
        if (!silent) toast.success("Chat renamed successfully.");
        return true;
      } catch (error: any) {
        console.error("useChat - Error renaming chat:", error);
        if (!silent)
          toast.error(error.message || "Failed to rename chat. Reverting.");
        setChatsInternal((prev) =>
          sortChats(
            prev.map((chat) =>
              chat._id === chatId
                ? {
                    ...chat,
                    title: oldTitle,
                    updatedAt: originalChat.updatedAt,
                  }
                : chat
            )
          )
        );
        return false;
      } finally {
        setIsRenamingChatInternal(false);
      }
    },
    [chats]
  );

  const createNewChat = useCallback(
    async (title: string = DEFAULT_CHAT_TITLE): Promise<Chat | undefined> => {
      setIsCreatingChatInternal(true);
      try {
        const response = await fetch("/api/chats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to create chat");
        }
        const data = await response.json();
        const newChat = data.chat as Chat;
        if (newChat) {
          setChatsInternal((prev) => sortChats([newChat, ...prev]));
          setCurrentChatIdInternal(newChat._id);
          setMessagesInternal([initialAssistantMessage()]);
          toast.success(`Chat "${newChat.title}" created`);
          return newChat;
        }
      } catch (error: any) {
        console.error("useChat - Error creating new chat:", error);
        toast.error(error.message || "Failed to create new chat.");
      } finally {
        setIsCreatingChatInternal(false);
      }
      return undefined;
    },
    [initialAssistantMessage]
  );

  const selectChat = useCallback(
    async (chatId: string | null) => {
      if (chatId === null) {
        setCurrentChatIdInternal(null);
        setMessagesInternal([initialAssistantMessage()]);
        return;
      }
      if (chatId === currentChatId) return;

      setIsLoadingInternal(true);
      try {
        const response = await fetch(`/api/chats/${chatId}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to load chat ${chatId}`);
        }
        const data = await response.json();
        const loadedChat = data.chat as Chat;
        if (loadedChat) {
          setCurrentChatIdInternal(loadedChat._id);
          if (loadedChat.messages && loadedChat.messages.length > 0) {
            setMessagesInternal(
              loadedChat.messages.map((m) => ({ ...m, isStreaming: false }))
            );
          } else {
            setMessagesInternal([initialAssistantMessage()]);
          }
        }
      } catch (error: any) {
        console.error(`useChat - Error loading chat ${chatId}:`, error);
        toast.error(error.message || `Failed to load chat.`);
      } finally {
        setIsLoadingInternal(false);
      }
    },
    [currentChatId, initialAssistantMessage]
  );
  const saveMessageToDb = useCallback(
    async (chatId: string, message: Message): Promise<boolean> => {
      try {
        const response = await fetch(`/api/chats/${chatId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error(
            "useChat - Failed to save message to DB:",
            errorData.error || response.status
          );
          toast.error("Could not save message to server.");
          return false;
        }
        return true;
      } catch (error: any) {
        console.error("useChat - Error saving message to DB:", error);
        toast.error("Network error: Could not save message.");
        return false;
      }
    },
    []
  );

  const sendMessage = useCallback(
    async (userInput: string, uploadedFile?: File) => {
      if (!userInput.trim() && !uploadedFile) return;

      if (!isSubscriptionLoading && !isProUser && currentChatId) {
        const currentChatUserMessages = messages.filter(
          (m) => m.type === "user"
        );
        if (currentChatUserMessages.length >= 5) {
          toast.info(
            `You've reached the message limit for free users in this chat. Upgrade to Pro for unlimited messages.`,
            { autoClose: 7000 }
          );
          return;
        }
      }
      if (!isSubscriptionLoading && !isProUser && uploadedFile) {
        toast.info(
          `File attachments are a Pro feature. Upgrade to Pro to use this feature.`,
          { autoClose: 7000 }
        );
        return;
      }

      setIsLoadingInternal(true);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const userMessageContent =
        userInput + (uploadedFile ? `\n[File: ${uploadedFile.name}]` : "");
      const userMessage: Message = {
        id: Date.now(),
        type: "user",
        content: userMessageContent,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      const assistantMessageId = Date.now() + 1;
      const assistantPlaceholderMessage: Message = {
        id: assistantMessageId,
        type: "assistant",
        content: "",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isStreaming: true,
      };

      let chatIdToUse = currentChatId;
      let isNewChatFlow = false;
      let tempMessages = messages;

      if (
        !chatIdToUse ||
        (messages.length === 1 &&
          messages[0].content === INITIAL_ASSISTANT_MESSAGE_CONTENT)
      ) {
        isNewChatFlow = true;
        const baseTitle =
          userInput || (uploadedFile ? uploadedFile.name : UNTITLED_CHAT_TITLE);
        const tempChatTitle =
          baseTitle.length > 30
            ? baseTitle.substring(0, 27) + "..."
            : baseTitle;

        const newChat = await createNewChat(tempChatTitle);
        if (newChat) {
          chatIdToUse = newChat._id;
          tempMessages = [initialAssistantMessage()];
        } else {
          toast.error("Failed to create a new chat session to send message.");
          setIsLoadingInternal(false);
          return;
        }
      }

      const messagesForThisTurn =
        tempMessages[0]?.content === INITIAL_ASSISTANT_MESSAGE_CONTENT &&
        tempMessages.length === 1
          ? [userMessage, assistantPlaceholderMessage]
          : [...tempMessages, userMessage, assistantPlaceholderMessage];
      setMessagesInternal(messagesForThisTurn);

      if (chatIdToUse) {
        await saveMessageToDb(chatIdToUse, userMessage);
      } else {
        console.error(
          "useChat - sendMessage: chatIdToUse is null, critical error."
        );
        toast.error("Error: No active chat session available.");
        setIsLoadingInternal(false);
        return;
      }

      const currentChatData = chats.find((c) => c._id === chatIdToUse); // Find from current 'chats' state
      if (
        chatIdToUse &&
        currentChatData &&
        (currentChatData.title === DEFAULT_CHAT_TITLE ||
          currentChatData.title === UNTITLED_CHAT_TITLE) &&
        !isNewChatFlow &&
        userInput.trim()
      ) {
        const newTitleBase =
          userInput.trim() ||
          (uploadedFile ? uploadedFile.name : currentChatData.title);
        const newTitle =
          newTitleBase.length > 30
            ? newTitleBase.substring(0, 27) + "..."
            : newTitleBase;
        if (newTitle !== currentChatData.title) {
          await renameChat(chatIdToUse, newTitle, true);
        }
      }

      try {
        const formData = new FormData();
        formData.append("message", userInput);
        if (uploadedFile) formData.append("file", uploadedFile);

        const historyForAI = messagesForThisTurn
          .filter(
            (m) =>
              m.id !== assistantMessageId &&
              m.content !== INITIAL_ASSISTANT_MESSAGE_CONTENT
          )
          .slice(-10)
          .map((m) => ({ type: m.type, content: m.content }));
        formData.append("conversationHistory", JSON.stringify(historyForAI));

        const response = await fetch("/api/chat", {
          method: "POST",
          body: formData,
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok || !response.body) {
          const errData = await response
            .json()
            .catch(() => ({ error: `Server error: ${response.status}` }));
          throw new Error(
            errData.error || `HTTP error! status: ${response.status}`
          );
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedResponse = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          try {
            const errorPayload = JSON.parse(chunk);
            if (errorPayload.error) {
              console.error(
                "useChat - Stream error payload:",
                errorPayload.error,
                errorPayload.details
              );
              accumulatedResponse = errorPayload.error;
              toast.error(`AI Error: ${errorPayload.error}`);
              break;
            }
          } catch (e) {
            accumulatedResponse += chunk;
          }

          setMessagesInternal((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: accumulatedResponse, isStreaming: true }
                : msg
            )
          );
        }

        const finalAIMessage: Message = {
          id: assistantMessageId,
          type: "assistant",
          content: accumulatedResponse.trim() || "...",
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          isStreaming: false,
        };

        if (chatIdToUse) await saveMessageToDb(chatIdToUse, finalAIMessage);

        setMessagesInternal((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId ? finalAIMessage : msg
          )
        );

        if (chatIdToUse) {
          setChatsInternal((prevChats) =>
            sortChats(
              prevChats.map((chat) =>
                chat._id === chatIdToUse
                  ? {
                      ...chat,
                      messages: (
                        prevChats.find((c) => c._id === chatIdToUse)
                          ?.messages || []
                      )
                        .filter(
                          (m) =>
                            m.id !== userMessage.id &&
                            m.id !== assistantMessageId
                        )
                        .concat([userMessage, finalAIMessage]),
                      updatedAt: new Date().toISOString(),
                    }
                  : chat
              )
            )
          );
        }
      } catch (error: any) {
        if (error.name === "AbortError") {
          console.log("useChat - Fetch aborted by user");
          setMessagesInternal((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    isStreaming: false,
                    content: msg.content || "[Response generation stopped]",
                  }
                : msg
            )
          );
        } else {
          console.error("useChat - Error sending message or streaming:", error);
          const errMsg =
            error.message || "I'm having trouble processing your request.";
          const errorAIMessage: Message = {
            id: assistantMessageId,
            type: "assistant",
            content: `Error: ${errMsg}`,
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            isStreaming: false,
          };
          if (chatIdToUse) await saveMessageToDb(chatIdToUse, errorAIMessage);
          setMessagesInternal((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId ? errorAIMessage : msg
            )
          );
          toast.error("Failed to get AI response.");
        }
      } finally {
        setIsLoadingInternal(false);
        abortControllerRef.current = null;
      }
    },
    [
      currentChatId,
      messages,
      chats,
      isProUser,
      isSubscriptionLoading,
      createNewChat,
      initialAssistantMessage,
      renameChat,
      saveMessageToDb,
    ]
  ); // Added saveMessageToDb

  const deleteChat = useCallback(
    async (chatId: string): Promise<boolean> => {
      if (!chatId) return false;
      setIsDeletingChatInternal(true);
      try {
        const response = await fetch(`/api/chats/${chatId}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to delete chat");
        }
        toast.success("Chat deleted successfully.");
        setChatsInternal((prev) => prev.filter((chat) => chat._id !== chatId));
        if (currentChatId === chatId) {
          setCurrentChatIdInternal(null);
          setMessagesInternal([initialAssistantMessage()]);
        }
        return true;
      } catch (error: any) {
        console.error("useChat - Error deleting chat:", error);
        toast.error(error.message || "Failed to delete chat.");
        return false;
      } finally {
        setIsDeletingChatInternal(false);
      }
    },
    [currentChatId, initialAssistantMessage]
  );

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    messages,
    chats,
    currentChatId,
    isLoading,
    isLoadingChats,
    isCreatingChat,
    isDeletingChat,
    isRenamingChat,
    setMessages: setMessagesInternal,
    loadChats,
    createNewChat,
    selectChat,
    sendMessage,
    renameChat,
    deleteChat,
    stopStreaming,
  };
}
