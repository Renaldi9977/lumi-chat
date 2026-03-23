'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatusIndicator } from '@/components/ui-custom/StatusIndicator';
import { MessageCircle } from 'lucide-react';
import type { Conversation, UserStatus } from '@/types';

interface ConversationListProps {
  conversations: Conversation[];
  activeId?: string;
  onSelect: (conversation: Conversation) => void;
}

export function ConversationList({ conversations, activeId, onSelect }: ConversationListProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getLastMessagePreview = (conversation: Conversation) => {
    if (!conversation.lastMessage) return null;

    const type = conversation.lastMessageType;
    if (type === 'image') return '📷 Image';
    if (type === 'video') return '🎥 Video';
    if (type === 'file') return '📎 File';
    if (type === 'sticker') return '😀 Sticker';
    if (type === 'voice') return '🎤 Voice';
    return conversation.lastMessage.slice(0, 30) + (conversation.lastMessage.length > 30 ? '...' : '');
  };

  return (
    <div className="flex-1 min-h-0">
      <div className="px-4 py-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Direct Messages
        </h3>
        <span className="text-xs text-gray-500">{conversations.length}</span>
      </div>

      <ScrollArea className="h-full">
        <div className="px-2 pb-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <MessageCircle className="w-10 h-10 text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No conversations yet</p>
              <p className="text-xs text-gray-600 mt-1">Search for users to start chatting</p>
            </div>
          ) : (
            conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => onSelect(conversation)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
                  activeId === conversation.user.id
                    ? 'bg-[#3b82f6]/20 text-white'
                    : 'hover:bg-[#2a2a34] text-gray-300'
                }`}
              >
                <div className="relative flex-shrink-0">
                  <Avatar className="w-10 h-10 border border-[#2a2a34]">
                    <AvatarImage src={conversation.user.avatarUrl || undefined} />
                    <AvatarFallback className="bg-[#3b82f6] text-white text-sm">
                      {(conversation.user.displayName || conversation.user.username || 'U').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <StatusIndicator
                    status={(conversation.user.status as UserStatus) || 'offline'}
                    className="absolute -bottom-0.5 -right-0.5 w-3 h-3"
                  />
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">
                      {conversation.user.displayName || conversation.user.username}
                    </p>
                    {conversation.lastMessageTime && (
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {formatTime(conversation.lastMessageTime)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {getLastMessagePreview(conversation)}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
