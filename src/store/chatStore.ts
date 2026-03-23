import { create } from 'zustand';
import type { Message, Conversation, Group, ActiveChat, TypingUser, CallSession } from '@/types';

interface ChatState {
  // Messages
  messages: Message[];
  hasMore: boolean;
  isLoadingMessages: boolean;
  
  // Conversations & Groups
  conversations: Conversation[];
  groups: Group[];
  
  // Active chat
  activeChat: ActiveChat | null;
  
  // Typing indicators
  typingUsers: Map<string, TypingUser>;
  
  // Call session
  callSession: CallSession | null;
  
  // Actions
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  prependMessages: (messages: Message[]) => void;
  setHasMore: (hasMore: boolean) => void;
  setLoadingMessages: (loading: boolean) => void;
  
  setConversations: (conversations: Conversation[]) => void;
  updateConversation: (conversation: Conversation) => void;
  
  setGroups: (groups: Group[]) => void;
  addGroup: (group: Group) => void;
  
  setActiveChat: (chat: ActiveChat | null) => void;
  
  setTyping: (userId: string, isTyping: boolean, username?: string) => void;
  clearTyping: () => void;
  
  setCallSession: (session: CallSession | null) => void;
  
  reset: () => void;
}

const initialState = {
  messages: [],
  hasMore: true,
  isLoadingMessages: false,
  conversations: [],
  groups: [],
  activeChat: null,
  typingUsers: new Map<string, TypingUser>(),
  callSession: null,
};

export const useChatStore = create<ChatState>((set) => ({
  ...initialState,

  setMessages: (messages) => set({ messages }),
  
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),
  
  prependMessages: (messages) => set((state) => ({
    messages: [...messages, ...state.messages]
  })),
  
  setHasMore: (hasMore) => set({ hasMore }),
  
  setLoadingMessages: (isLoadingMessages) => set({ isLoadingMessages }),

  setConversations: (conversations) => set({ conversations }),
  
  updateConversation: (conversation) => set((state) => {
    const existing = state.conversations.findIndex(c => c.id === conversation.id);
    if (existing >= 0) {
      const updated = [...state.conversations];
      updated[existing] = conversation;
      // Move to top
      const [removed] = updated.splice(existing, 1);
      return { conversations: [removed, ...updated] };
    }
    return { conversations: [conversation, ...state.conversations] };
  }),

  setGroups: (groups) => set({ groups }),
  
  addGroup: (group) => set((state) => ({
    groups: [group, ...state.groups]
  })),

  setActiveChat: (activeChat) => set({ 
    activeChat, 
    messages: [],
    hasMore: true,
    typingUsers: new Map()
  }),

  setTyping: (userId, isTyping, username) => set((state) => {
    const typingUsers = new Map(state.typingUsers);
    if (isTyping) {
      typingUsers.set(userId, { userId, isTyping, username });
    } else {
      typingUsers.delete(userId);
    }
    return { typingUsers };
  }),
  
  clearTyping: () => set({ typingUsers: new Map() }),

  setCallSession: (callSession) => set({ callSession }),

  reset: () => set(initialState)
}));
