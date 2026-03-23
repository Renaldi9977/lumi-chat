import type { 
  User, 
  Message, 
  Conversation, 
  Group, 
  Sticker, 
  LoginCredentials, 
  RegisterCredentials,
  UploadResult,
  ApiResponse 
} from '@/types';

// Get API base URL from environment variable or detect automatically
const getApiBaseUrl = (): string => {
  // Check for environment variable first
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // For browser environment
  if (typeof window !== 'undefined') {
    // Check if we're on Replit (has XTransformPort support)
    const hostname = window.location.hostname;
    if (hostname.includes('replit.dev') || hostname.includes('repl.co')) {
      // On Replit, use relative path with port transform
      return '';
    }
  }
  
  // Default to localhost for development
  return 'http://localhost:3030';
};

const API_BASE_URL = getApiBaseUrl();

class ApiService {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    const authData = localStorage.getItem('lumi-auth');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        return parsed.state?.token || null;
      } catch {
        return null;
      }
    }
    return null;
  }

  private getUrl(endpoint: string): string {
    // If we have a base URL, use it directly
    if (API_BASE_URL) {
      return `${API_BASE_URL}/api${endpoint}`;
    }
    // Otherwise use relative path with Replit port transform
    return `/api${endpoint}?XTransformPort=3030`;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const url = this.getUrl(endpoint);
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response:', text.substring(0, 200));
      throw new Error('Server returned non-JSON response. Backend may not be running.');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }

    return data;
  }

  // Auth endpoints
  async login(credentials: LoginCredentials): Promise<ApiResponse<User>> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(credentials: RegisterCredentials): Promise<ApiResponse<User>> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getMe(): Promise<User> {
    return this.request('/auth/me');
  }

  async updateProfile(data: { displayName?: string; username?: string; customStatus?: string }): Promise<User> {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({
        display_name: data.displayName,
        username: data.username,
        custom_status: data.customStatus,
      }),
    });
  }

  async updateStatus(status: string): Promise<{ message: string; status: string }> {
    return this.request('/auth/status', {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async uploadAvatar(file: File): Promise<{ message: string; avatarUrl: string }> {
    const formData = new FormData();
    formData.append('avatar', file);

    const token = this.getToken();
    const url = this.getUrl('/auth/avatar');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Upload failed');
    }
    return data;
  }

  // User endpoints
  async searchUsers(query: string): Promise<User[]> {
    return this.request(`/users/search?q=${encodeURIComponent(query)}`);
  }

  async getUser(id: string): Promise<User> {
    return this.request(`/users/${id}`);
  }

  // Message endpoints
  async getConversations(): Promise<Conversation[]> {
    return this.request('/conversations');
  }

  async getMessages(userId: string, limit = 50, before?: string): Promise<Message[]> {
    let url = `/messages/${userId}?limit=${limit}`;
    if (before) url += `&before=${encodeURIComponent(before)}`;
    return this.request(url);
  }

  async sendMessage(data: {
    receiverId?: string;
    groupId?: string;
    content?: string;
    messageType?: string;
    mediaUrl?: string;
    mediaType?: string;
    fileName?: string;
    fileSize?: number;
    stickerId?: string;
    replyTo?: string;
  }): Promise<Message> {
    return this.request('/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async uploadFile(file: File): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);

    const token = this.getToken();
    const url = this.getUrl('/messages/upload');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Upload failed');
    }
    return data;
  }

  // Group endpoints
  async getGroups(): Promise<Group[]> {
    return this.request('/groups');
  }

  async createGroup(data: { name: string; description?: string; memberIds?: string[] }): Promise<Group> {
    return this.request('/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getGroupMessages(groupId: string, limit = 50, before?: string): Promise<Message[]> {
    let url = `/groups/${groupId}/messages?limit=${limit}`;
    if (before) url += `&before=${encodeURIComponent(before)}`;
    return this.request(url);
  }

  async addGroupMember(groupId: string, userId: string): Promise<{ message: string }> {
    return this.request(`/groups/${groupId}/members`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  async removeGroupMember(groupId: string, userId: string): Promise<{ message: string }> {
    return this.request(`/groups/${groupId}/members/${userId}`, {
      method: 'DELETE',
    });
  }

  // Sticker endpoints
  async getStickers(category?: string): Promise<Sticker[]> {
    let url = '/stickers';
    if (category) url += `?category=${encodeURIComponent(category)}`;
    return this.request(url);
  }

  async getStickerCategories(): Promise<string[]> {
    return this.request('/stickers/categories');
  }

  // Call endpoints
  async initiateCall(receiverId: string, callType: 'voice' | 'video'): Promise<{ callId: string; status: string }> {
    return this.request('/calls', {
      method: 'POST',
      body: JSON.stringify({ receiverId, callType }),
    });
  }

  async endCall(callId: string): Promise<{ message: string }> {
    return this.request(`/calls/${callId}/end`, {
      method: 'PUT',
    });
  }
}

export const api = new ApiService();
