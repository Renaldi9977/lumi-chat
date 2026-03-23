'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { socketService } from '@/services/socket';
import { api } from '@/services/api';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { ConversationList } from '@/components/sidebar/ConversationList';
import { GroupList } from '@/components/sidebar/GroupList';
import { UserProfile } from '@/components/sidebar/UserProfile';
import { SearchBar } from '@/components/sidebar/SearchBar';
import { MessageList } from '@/components/chat/MessageList';
import { MessageInput } from '@/components/chat/MessageInput';
import { CallScreen } from '@/components/call/CallScreen';
import { CreateGroupModal } from '@/components/modals/CreateGroupModal';
import { UserSettingsModal } from '@/components/modals/UserSettingsModal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Phone, Video, MoreVertical, Loader2, MessageCircle, Users, ArrowLeft } from 'lucide-react';
import type { User, Conversation, Group, Message, CallSession, UploadResult } from '@/types';

export default function Home() {
  // Auth state
  const { user, token, isAuthenticated, isLoading, login, logout, setLoading, updateProfile } = useAuthStore();
  
  // Chat state
  const { 
    messages, 
    conversations, 
    groups, 
    activeChat, 
    typingUsers, 
    callSession,
    hasMore,
    isLoadingMessages,
    setMessages,
    addMessage,
    prependMessages,
    setHasMore,
    setLoadingMessages,
    setConversations,
    updateConversation,
    setGroups,
    addGroup,
    setActiveChat,
    setTyping,
    setCallSession,
    reset
  } = useChatStore();

  // UI state
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Check mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize auth on mount
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const userData = await api.getMe();
          login(userData, token);
          await socketService.connect(token);
        } catch (error) {
          console.error('Auth init failed:', error);
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  // Load conversations and groups when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      loadConversations();
      loadGroups();
    }
  }, [isAuthenticated, token]);

  // Socket event handlers
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubMessage = socketService.onMessage((message: Message) => {
      // Add message if it's for the current chat
      if (activeChat) {
        const isCurrentChat = 
          (activeChat.type === 'private' && 
            (message.senderId === activeChat.id || message.receiverId === activeChat.id)) ||
          (activeChat.type === 'group' && message.groupId === activeChat.id);
        
        if (isCurrentChat) {
          addMessage(message);
        }
      }

      // Update conversation list
      if (!message.groupId && message.sender) {
        updateConversation({
          id: message.senderId === user?.id ? message.receiverId || '' : message.senderId,
          user: message.sender,
          lastMessage: message.content,
          lastMessageTime: message.createdAt,
          lastMessageType: message.messageType,
        });
      }
    });

    const unsubTyping = socketService.onTyping((data) => {
      if (activeChat && 
          ((activeChat.type === 'private' && data.userId === activeChat.id) ||
           (activeChat.type === 'group' && data.groupId === activeChat.id))) {
        setTyping(data.userId, data.isTyping, data.userId);
      }
    });

    const unsubStatus = socketService.onStatusChange((data) => {
      // Update user status in conversations
      setConversations(conversations.map(c => 
        c.user.id === data.userId 
          ? { ...c, user: { ...c.user, status: data.status, lastSeen: data.lastSeen } }
          : c
      ));
    });

    const unsubCall = socketService.onIncomingCall((call: CallSession) => {
      setCallSession(call);
    });

    const unsubCallEnd = socketService.onCallEnded((data) => {
      if (callSession?.callId === data.callId) {
        setCallSession(null);
      }
    });

    return () => {
      unsubMessage();
      unsubTyping();
      unsubStatus();
      unsubCall();
      unsubCallEnd();
    };
  }, [isAuthenticated, activeChat, conversations, user?.id]);

  // Load functions
  const loadConversations = async () => {
    try {
      const data = await api.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadGroups = async () => {
    try {
      const data = await api.getGroups();
      setGroups(data);
    } catch (error) {
      console.error('Failed to load groups:', error);
    }
  };

  const loadMessages = async (chatId: string, type: 'private' | 'group', before?: string) => {
    setLoadingMessages(true);
    try {
      const data = type === 'private' 
        ? await api.getMessages(chatId, 50, before)
        : await api.getGroupMessages(chatId, 50, before);
      
      if (before) {
        prependMessages(data);
      } else {
        setMessages(data);
      }
      setHasMore(data.length === 50);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Auth handlers
  const handleLogin = async (email: string, password: string) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const response = await api.login({ email, password });
      login(response.user!, response.token!);
      await socketService.connect(response.token!);
    } catch (error: any) {
      setAuthError(error.message || 'Login failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (email: string, username: string, password: string, displayName: string) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const response = await api.register({ email, username, password, displayName });
      login(response.user!, response.token!);
      await socketService.connect(response.token!);
    } catch (error: any) {
      setAuthError(error.message || 'Registration failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    socketService.disconnect();
    logout();
    reset();
    setAuthMode('login');
  };

  // Chat handlers
  const handleSelectConversation = (conversation: Conversation) => {
    setActiveChat({
      type: 'private',
      id: conversation.user.id,
      user: conversation.user,
    });
    loadMessages(conversation.user.id, 'private');
    if (isMobile) setShowSidebar(false);
  };

  const handleSelectGroup = (group: Group) => {
    setActiveChat({
      type: 'group',
      id: group.id,
      group,
    });
    loadMessages(group.id, 'group');
    socketService.joinGroup(group.id);
    if (isMobile) setShowSidebar(false);
  };

  const handleSelectUser = (selectedUser: User) => {
    setActiveChat({
      type: 'private',
      id: selectedUser.id,
      user: selectedUser,
    });
    loadMessages(selectedUser.id, 'private');
    if (isMobile) setShowSidebar(false);
  };

  const handleSendMessage = async (content: string, type = 'text', metadata?: Record<string, unknown>) => {
    if (!activeChat || !content.trim()) return;

    try {
      const messageData: any = {
        messageType: type,
        content,
      };

      if (activeChat.type === 'private') {
        messageData.receiverId = activeChat.id;
      } else {
        messageData.groupId = activeChat.id;
      }

      if (metadata) {
        Object.assign(messageData, metadata);
      }

      await api.sendMessage(messageData);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleTyping = (isTyping: boolean) => {
    if (!activeChat) return;
    
    if (activeChat.type === 'private') {
      socketService.emitTyping(activeChat.id, undefined, isTyping);
    } else {
      socketService.emitTyping(undefined, activeChat.id, isTyping);
    }
  };

  const handleFileUpload = async (file: File): Promise<UploadResult> => {
    return api.uploadFile(file);
  };

  const handleCreateGroup = async (name: string, description: string, memberIds: string[]) => {
    const group = await api.createGroup({ name, description, memberIds });
    addGroup(group);
    socketService.joinGroup(group.id);
  };

  const handleUpdateProfile = async (data: { displayName?: string; username?: string; customStatus?: string }) => {
    const updated = await api.updateProfile(data);
    updateProfile(updated);
  };

  const handleUpdateStatus = async (status: string) => {
    await api.updateStatus(status);
    updateProfile({ status: status as any });
  };

  const handleUploadAvatar = async (file: File): Promise<string> => {
    const result = await api.uploadAvatar(file);
    updateProfile({ avatarUrl: result.avatarUrl });
    return result.avatarUrl;
  };

  const handleStartCall = async (callType: 'voice' | 'video') => {
    if (!activeChat || activeChat.type !== 'private') return;
    
    try {
      const result = await api.initiateCall(activeChat.id, callType);
      setCallSession({
        callId: result.callId,
        callType,
        caller: user!,
        status: 'ringing',
      });
    } catch (error) {
      console.error('Failed to start call:', error);
    }
  };

  const handleEndCall = async () => {
    if (!callSession) return;
    
    try {
      await api.endCall(callSession.callId);
      setCallSession(null);
    } catch (error) {
      console.error('Failed to end call:', error);
    }
  };

  // Typing usernames for current chat
  const typingUsernames = useMemo(() => {
    if (!activeChat) return [];
    return Array.from(typingUsers.values())
      .filter(t => {
        if (activeChat.type === 'private') return t.userId === activeChat.id;
        return true;
      })
      .map(t => t.username || 'Someone');
  }, [typingUsers, activeChat]);

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#3b82f6] animate-spin" />
      </div>
    );
  }

  // Auth screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0f0f14] flex items-center justify-center p-4">
        {authMode === 'login' ? (
          <LoginForm
            onLogin={handleLogin}
            onSwitchToRegister={() => { setAuthMode('register'); setAuthError(null); }}
            isLoading={authLoading}
            error={authError}
          />
        ) : (
          <RegisterForm
            onRegister={handleRegister}
            onSwitchToLogin={() => { setAuthMode('login'); setAuthError(null); }}
            isLoading={authLoading}
            error={authError}
          />
        )}
      </div>
    );
  }

  // Main app
  return (
    <div className="h-screen bg-[#0f0f14] flex overflow-hidden">
      {/* Call overlay */}
      {callSession && (
        <CallScreen
          callSession={callSession}
          currentUserId={user?.id || ''}
          onEnd={handleEndCall}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${isMobile && !showSidebar ? 'hidden' : 'flex'}
        ${isMobile ? 'fixed inset-0 z-40' : 'relative'}
        w-72 flex-col bg-[#12121a] border-r border-[#2a2a34]
      `}>
        {/* User profile */}
        <UserProfile
          user={user!}
          onSettings={() => setShowSettings(true)}
          onLogout={handleLogout}
          onToggleSidebar={() => setShowSidebar(false)}
          isMobile={isMobile}
        />

        {/* Search */}
        <SearchBar onUserSelect={handleSelectUser} />

        {/* Conversations */}
        <ConversationList
          conversations={conversations}
          activeId={activeChat?.type === 'private' ? activeChat.id : undefined}
          onSelect={handleSelectConversation}
        />

        {/* Groups */}
        <GroupList
          groups={groups}
          activeId={activeChat?.type === 'group' ? activeChat.id : undefined}
          onSelect={handleSelectGroup}
          onCreateGroup={() => setShowCreateGroup(true)}
        />
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeChat ? (
          <>
            {/* Chat header */}
            <div className="h-16 px-4 flex items-center justify-between border-b border-[#2a2a34] bg-[#12121a]">
              <div className="flex items-center gap-3">
                {isMobile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowSidebar(true)}
                    className="text-gray-400 hover:text-white"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                )}
                
                {activeChat.type === 'private' && activeChat.user && (
                  <>
                    <Avatar className="w-10 h-10 border border-[#2a2a34]">
                      <AvatarImage src={activeChat.user.avatarUrl || undefined} />
                      <AvatarFallback className="bg-[#3b82f6] text-white">
                        {(activeChat.user.displayName || activeChat.user.username || 'U').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-white font-medium">
                        {activeChat.user.displayName || activeChat.user.username}
                      </h2>
                      <p className="text-xs text-gray-400">
                        {activeChat.user.status === 'online' ? 'Online' : 
                         activeChat.user.status === 'dnd' ? 'Do Not Disturb' :
                         activeChat.user.status === 'idle' ? 'Idle' : 
                         activeChat.user.lastSeen ? `Last seen ${new Date(activeChat.user.lastSeen).toLocaleDateString()}` : 'Offline'}
                      </p>
                    </div>
                  </>
                )}

                {activeChat.type === 'group' && activeChat.group && (
                  <>
                    <Avatar className="w-10 h-10 border border-[#2a2a34]">
                      <AvatarImage src={activeChat.group.avatarUrl || undefined} />
                      <AvatarFallback className="bg-[#6366f1] text-white">
                        <Users className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-white font-medium">{activeChat.group.name}</h2>
                      <p className="text-xs text-gray-400">
                        {activeChat.group.memberCount} member{activeChat.group.memberCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Call buttons */}
              {activeChat.type === 'private' && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleStartCall('voice')}
                    className="text-gray-400 hover:text-white hover:bg-[#2a2a34]"
                  >
                    <Phone className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleStartCall('video')}
                    className="text-gray-400 hover:text-white hover:bg-[#2a2a34]"
                  >
                    <Video className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-white hover:bg-[#2a2a34]"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </div>
              )}
            </div>

            {/* Messages */}
            <MessageList
              messages={messages}
              currentUserId={user?.id || ''}
              typingUsernames={typingUsernames}
              isLoading={isLoadingMessages}
              hasMore={hasMore}
              onLoadMore={() => {
                if (messages.length > 0 && activeChat) {
                  loadMessages(activeChat.id, activeChat.type, messages[0].createdAt);
                }
              }}
              isGroup={activeChat.type === 'group'}
            />

            {/* Input */}
            <MessageInput
              onSend={handleSendMessage}
              onTyping={handleTyping}
              onFileUpload={handleFileUpload}
            />
          </>
        ) : (
          // Empty state
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <div className="w-20 h-20 rounded-full bg-[#1a1a24] flex items-center justify-center mb-4">
              <MessageCircle className="w-10 h-10 text-gray-500" />
            </div>
            <h2 className="text-xl font-medium text-white mb-2">Welcome to Lumi</h2>
            <p className="text-gray-400 text-center max-w-sm">
              Select a conversation from the sidebar or search for users to start chatting.
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      <UserSettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        user={user!}
        onUpdateProfile={handleUpdateProfile}
        onUpdateStatus={handleUpdateStatus}
        onUploadAvatar={handleUploadAvatar}
      />

      <CreateGroupModal
        open={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onCreateGroup={handleCreateGroup}
      />
    </div>
  );
}
