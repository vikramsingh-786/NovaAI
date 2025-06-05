import { ObjectId } from 'mongodb';
export interface Message {
  id: number; 
  type: 'user' | 'assistant';
  content: string;
  timestamp: string; 
  isStreaming?: boolean; 
}
export interface ChatDocument {
  _id: ObjectId; 
  userId: string;
  title: string;
  messages: Message[];
  createdAt: Date;  
  updatedAt: Date; 
}

export interface Chat {
  _id: string;
  userId: string;
  title: string;
  messages: Message[];
  createdAt: string; 
  updatedAt: string; 
}


export interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  emailAddress?: string;
  imageUrl?: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
export interface UserDocument {
  _id: ObjectId;
  clerkUserId: string;
  email: string;
  firstName?: string; 
  lastName?: string;  
  imageUrl?: string;  

  // Stripe Subscription Fields
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string; 
  stripeCurrentPeriodEnd?: Date; 
  subscriptionStatus: 'free' | 'active' | 'canceled' | 'past_due' | 'incomplete' | 'incomplete_expired'; // Added more states

  messageCountToday: number;
  lastMessageDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatContextType {
  messages: Message[];
  chats: Chat[];
  currentChatId: string | null;
  isLoading: boolean; 
  isLoadingChats: boolean; 
  isCreatingChat: boolean;
  isDeletingChat: boolean;
  isRenamingChat: boolean;
  
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>; 
  
  loadChats: () => Promise<void>;
  createNewChat: (title?: string) => Promise<Chat | undefined>;
  selectChat: (chatId: string | null) => Promise<void>;
  sendMessage: (userInput: string, uploadedFile?: File) => Promise<void>;
  renameChat: (chatId: string, newTitle: string, silent?: boolean) => Promise<boolean>;
  deleteChat: (chatId: string) => Promise<boolean>;
  stopStreaming: () => void;
}

export interface QuickAction {
  icon: React.ReactNode;
  title: string;
  prompt: string;
  category?: string;
}

export interface NavigationItem {
  name: string;
  href: string;
  icon?: React.ReactNode;
  current?: boolean;
}

export interface Testimonial {
  name: string;
  role: string;
  content: string;
  avatar: string;
  rating?: number;
}

export interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  link?: string;
}