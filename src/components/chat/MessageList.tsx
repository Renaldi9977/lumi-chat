'use client';

import { useEffect, useRef, useCallback } from 'react';
import { MessageItem } from './MessageItem';
import { TypingIndicator } from './TypingIndicator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import type { Message, User } from '@/types';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  typingUsernames: string[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  isGroup?: boolean;
}

export function MessageList({
  messages,
  currentUserId,
  typingUsernames,
  isLoading,
  hasMore,
  onLoadMore,
  isGroup = false,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevScrollHeight = useRef(0);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // Handle scroll for loading more messages
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    
    // Check if scrolled to top
    if (target.scrollTop === 0 && hasMore && !isLoading) {
      prevScrollHeight.current = target.scrollHeight;
      onLoadMore();
    }
  }, [hasMore, isLoading, onLoadMore]);

  // Maintain scroll position when prepending messages
  useEffect(() => {
    if (containerRef.current && prevScrollHeight.current > 0) {
      const newScrollHeight = containerRef.current.scrollHeight;
      containerRef.current.scrollTop = newScrollHeight - prevScrollHeight.current;
      prevScrollHeight.current = 0;
    }
  }, [messages]);

  // Group messages by sender for consecutive messages
  const groupedMessages = messages.reduce<(Message & { showAvatar: boolean })[]>((acc, message, index) => {
    const prevMessage = messages[index - 1];
    const showAvatar = !prevMessage || 
      prevMessage.senderId !== message.senderId ||
      (new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime()) > 5 * 60 * 1000;
    
    acc.push({ ...message, showAvatar });
    return acc;
  }, []);

  const formatDateSeparator = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString(undefined, { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  // Add date separators
  const messagesWithSeparators: (Message & { showAvatar: boolean } | { type: 'separator'; date: string })[] = [];
  let lastDate = '';

  groupedMessages.forEach((message) => {
    const messageDate = new Date(message.createdAt).toDateString();
    if (messageDate !== lastDate) {
      messagesWithSeparators.push({ type: 'separator', date: message.createdAt });
      lastDate = messageDate;
    }
    messagesWithSeparators.push(message);
  });

  return (
    <div 
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto"
    >
      {/* Load more indicator */}
      {isLoading && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
        </div>
      )}

      {!hasMore && messages.length > 0 && (
        <div className="text-center py-4 text-xs text-gray-500">
          Start of conversation
        </div>
      )}

      {/* Messages */}
      <div className="py-4 space-y-1">
        {messagesWithSeparators.map((item, index) => {
          if ('type' in item && item.type === 'separator') {
            return (
              <div key={`sep-${index}`} className="flex items-center justify-center py-4">
                <span className="px-3 py-1 rounded-full bg-[#1a1a24] text-xs text-gray-400 border border-[#2a2a34]">
                  {formatDateSeparator(item.date)}
                </span>
              </div>
            );
          }

          const message = item as Message & { showAvatar: boolean };
          return (
            <MessageItem
              key={message.id}
              message={message}
              currentUserId={currentUserId}
              showAvatar={message.showAvatar}
              isGroup={isGroup}
            />
          );
        })}
      </div>

      {/* Typing indicator */}
      {typingUsernames.length > 0 && (
        <div className="px-4 pb-2">
          <TypingIndicator usernames={typingUsernames} />
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={scrollRef} />
    </div>
  );
}
