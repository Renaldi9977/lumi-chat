// User types
export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  status: UserStatus;
  customStatus?: string | null;
  lastSeen?: string | null;
}

export type UserStatus = 'online' | 'idle' | 'dnd' | 'offline';

// Message types
export interface Message {
  id: string;
  senderId: string;
  receiverId?: string | null;
  groupId?: string | null;
  content: string | null;
  messageType: MessageType;
  mediaUrl?: string | null;
  mediaType?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  stickerId?: string | null;
  replyTo?: string | null;
  createdAt: string;
  sender: User;
  read?: boolean;
}

export type MessageType = 'text' | 'image' | 'video' | 'file' | 'sticker' | 'voice';

// Conversation types
export interface Conversation {
  id: string;
  user: User;
  lastMessage?: string | null;
  lastMessageTime?: string | null;
  lastMessageType?: MessageType | null;
  unreadCount?: number;
}

// Group types
export interface Group {
  id: string;
  name: string;
  description?: string | null;
  avatarUrl?: string | null;
  memberCount: number;
  createdAt: string;
  members?: GroupMember[];
}

export interface GroupMember {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  status: UserStatus;
  role: 'admin' | 'member';
}

// Sticker types
export interface Sticker {
  id: string;
  name: string;
  url: string;
  category: string;
}

// Call types
export interface CallSession {
  callId: string;
  callType: 'voice' | 'video';
  caller: User;
  status: 'ringing' | 'connected' | 'ended';
}

// API Response types
export interface ApiResponse<T> {
  message?: string;
  token?: string;
  user?: User;
  data?: T;
  error?: string;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  username: string;
  password: string;
  displayName?: string;
}

// Chat store types
export interface ActiveChat {
  type: 'private' | 'group';
  id: string;
  user?: User;
  group?: Group;
}

// Typing indicator
export interface TypingUser {
  userId: string;
  username?: string;
  isTyping: boolean;
}

// File upload
export interface UploadResult {
  url: string;
  type: string;
  mimeType: string;
  fileName: string;
  fileSize: number;
}
