'use client';

import { useEffect, useCallback, useState } from 'react';
import { socketService } from '@/services/socket';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { useUIStore } from '@/store/uiStore';

export function useSocket() {
  const { token, isAuthenticated, user } = useAuthStore();
  const { 
    addMessage, 
    setTyping, 
    setCallSession, 
    activeChat,
    updateConversation,
  } = useChatStore();
  const { setIsMobile } = useUIStore();
  const [isConnected, setIsConnected] = useState(false);

  // Connect socket
  useEffect(() => {
    if (token && isAuthenticated && !isConnected) {
      socketService.connect(token).then((success) => {
        setIsConnected(success);
      });
    }

    return () => {
      if (isConnected) {
        socketService.disconnect();
        setIsConnected(false);
      }
    };
  }, [token, isAuthenticated]);

  // Handle incoming messages
  useEffect(() => {
    const unsubscribe = socketService.onMessage((message) => {
      // Add message if it's for current chat
      const isCurrentChat = 
        (activeChat?.type === 'private' && 
          (message.senderId === activeChat.id || message.receiverId === activeChat.id)) ||
        (activeChat?.type === 'group' && message.groupId === activeChat.id);

      if (isCurrentChat) {
        addMessage(message);
      }

      // Update conversation list
      if (!message.groupId) {
        const otherUserId = message.senderId === user?.id ? message.receiverId : message.senderId;
        if (otherUserId) {
          updateConversation({
            id: otherUserId,
            user: message.sender,
            lastMessage: message.content,
            lastMessageTime: message.createdAt,
            lastMessageType: message.messageType,
          });
        }
      }
    });

    return unsubscribe;
  }, [activeChat, addMessage, user?.id, updateConversation]);

  // Handle typing indicators
  useEffect(() => {
    const unsubscribe = socketService.onTyping((data) => {
      if (activeChat?.type === 'private' && data.userId === activeChat.id) {
        setTyping(data.userId, data.isTyping);
      } else if (activeChat?.type === 'group' && data.groupId === activeChat.id) {
        setTyping(data.userId, data.isTyping);
      }
    });

    return unsubscribe;
  }, [activeChat, setTyping]);

  // Handle incoming calls
  useEffect(() => {
    const unsubscribe = socketService.onIncomingCall((data) => {
      setCallSession(data);
    });

    return unsubscribe;
  }, [setCallSession]);

  // Handle call ended
  useEffect(() => {
    const unsubscribe = socketService.onCallEnded(() => {
      setCallSession(null);
    });

    return unsubscribe;
  }, [setCallSession]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [setIsMobile]);

  const emitTyping = useCallback((receiverId?: string, groupId?: string, isTyping?: boolean) => {
    socketService.emitTyping(receiverId, groupId, isTyping);
  }, []);

  const joinGroup = useCallback((groupId: string) => {
    socketService.joinGroup(groupId);
  }, []);

  const leaveGroup = useCallback((groupId: string) => {
    socketService.leaveGroup(groupId);
  }, []);

  return {
    isConnected,
    emitTyping,
    joinGroup,
    leaveGroup,
  };
}
