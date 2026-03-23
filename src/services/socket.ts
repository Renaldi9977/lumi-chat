import { io, Socket } from 'socket.io-client';
import type { Message, User, CallSession } from '@/types';

type MessageHandler = (message: Message) => void;
type StatusHandler = (data: { userId: string; status: string; lastSeen?: string }) => void;
type TypingHandler = (data: { userId: string; isTyping: boolean; groupId?: string }) => void;
type CallHandler = (data: CallSession) => void;
type SignalHandler = (data: { callId: string; signal: any; fromUserId?: string }) => void;

class SocketService {
  private socket: Socket | null = null;
  private messageHandlers: MessageHandler[] = [];
  private statusHandlers: StatusHandler[] = [];
  private typingHandlers: TypingHandler[] = [];
  private callHandlers: CallHandler[] = [];
  private signalHandlers: SignalHandler[] = [];
  private callEndHandlers: ((data: { callId: string }) => void)[] = [];
  private groupAddHandlers: ((data: { groupId: string }) => void)[] = [];
  private groupRemoveHandlers: ((data: { groupId: string }) => void)[] = [];

  connect(token: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.socket?.connected) {
        resolve(true);
        return;
      }

      this.socket = io('/?XTransformPort=3030', {
        transports: ['websocket', 'polling'],
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 10000,
      });

      this.socket.on('connect', () => {
        console.log('Socket connected');
        resolve(true);
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        resolve(false);
      });

      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      // Message handlers
      this.socket.on('new-message', (message: Message) => {
        this.messageHandlers.forEach(handler => handler(message));
      });

      // Status handlers
      this.socket.on('user-status-changed', (data: { userId: string; status: string; lastSeen?: string }) => {
        this.statusHandlers.forEach(handler => handler(data));
      });

      // Typing handlers
      this.socket.on('user-typing', (data: { userId: string; isTyping: boolean; groupId?: string }) => {
        this.typingHandlers.forEach(handler => handler(data));
      });

      // Call handlers
      this.socket.on('incoming-call', (data: CallSession) => {
        this.callHandlers.forEach(handler => handler(data));
      });

      this.socket.on('call-ended', (data: { callId: string }) => {
        this.callEndHandlers.forEach(handler => handler(data));
      });

      // WebRTC signal handlers
      this.socket.on('call-signal', (data: { callId: string; signal: any; fromUserId: string }) => {
        this.signalHandlers.forEach(handler => handler(data));
      });

      this.socket.on('call-answer', (data: { callId: string; signal: any }) => {
        this.signalHandlers.forEach(handler => handler(data));
      });

      this.socket.on('call-ice-candidate', (data: { callId: string; candidate: any }) => {
        this.signalHandlers.forEach(handler => handler({ callId: data.callId, signal: data.candidate }));
      });

      // Group handlers
      this.socket.on('added-to-group', (data: { groupId: string }) => {
        this.groupAddHandlers.forEach(handler => handler(data));
      });

      this.socket.on('removed-from-group', (data: { groupId: string }) => {
        this.groupRemoveHandlers.forEach(handler => handler(data));
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Typing
  emitTyping(receiverId?: string, groupId?: string, isTyping = true) {
    if (this.socket) {
      this.socket.emit('typing', { receiverId, groupId, isTyping });
    }
  }

  // Group rooms
  joinGroup(groupId: string) {
    if (this.socket) {
      this.socket.emit('join-group', groupId);
    }
  }

  leaveGroup(groupId: string) {
    if (this.socket) {
      this.socket.emit('leave-group', groupId);
    }
  }

  // WebRTC signaling
  emitSignal(callId: string, signal: any, targetUserId: string) {
    if (this.socket) {
      this.socket.emit('call-signal', { callId, signal, targetUserId });
    }
  }

  emitAnswer(callId: string, signal: any, targetUserId: string) {
    if (this.socket) {
      this.socket.emit('call-answer', { callId, signal, targetUserId });
    }
  }

  emitIceCandidate(callId: string, candidate: any, targetUserId: string) {
    if (this.socket) {
      this.socket.emit('call-ice-candidate', { callId, candidate, targetUserId });
    }
  }

  // Event subscriptions
  onMessage(handler: MessageHandler) {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }

  onStatusChange(handler: StatusHandler) {
    this.statusHandlers.push(handler);
    return () => {
      this.statusHandlers = this.statusHandlers.filter(h => h !== handler);
    };
  }

  onTyping(handler: TypingHandler) {
    this.typingHandlers.push(handler);
    return () => {
      this.typingHandlers = this.typingHandlers.filter(h => h !== handler);
    };
  }

  onIncomingCall(handler: CallHandler) {
    this.callHandlers.push(handler);
    return () => {
      this.callHandlers = this.callHandlers.filter(h => h !== handler);
    };
  }

  onCallEnded(handler: (data: { callId: string }) => void) {
    this.callEndHandlers.push(handler);
    return () => {
      this.callEndHandlers = this.callEndHandlers.filter(h => h !== handler);
    };
  }

  onSignal(handler: SignalHandler) {
    this.signalHandlers.push(handler);
    return () => {
      this.signalHandlers = this.signalHandlers.filter(h => h !== handler);
    };
  }

  onAddedToGroup(handler: (data: { groupId: string }) => void) {
    this.groupAddHandlers.push(handler);
    return () => {
      this.groupAddHandlers = this.groupAddHandlers.filter(h => h !== handler);
    };
  }

  onRemovedFromGroup(handler: (data: { groupId: string }) => void) {
    this.groupRemoveHandlers.push(handler);
    return () => {
      this.groupRemoveHandlers = this.groupRemoveHandlers.filter(h => h !== handler);
    };
  }
}

export const socketService = new SocketService();
