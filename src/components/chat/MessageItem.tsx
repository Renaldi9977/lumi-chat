'use client';

import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, CheckCheck, FileText, Download } from 'lucide-react';
import type { Message, User } from '@/types';

interface MessageItemProps {
  message: Message;
  currentUserId: string;
  showAvatar?: boolean;
  isGroup?: boolean;
}

export function MessageItem({ message, currentUserId, showAvatar = true, isGroup = false }: MessageItemProps) {
  const isOwn = message.senderId === currentUserId;
  const sender = message.sender;
  const initials = (sender?.displayName || sender?.username || 'U').slice(0, 2).toUpperCase();

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const renderContent = () => {
    switch (message.messageType) {
      case 'image':
        return (
          <div className="max-w-xs sm:max-w-sm">
            <img
              src={message.mediaUrl || ''}
              alt="Image"
              className="rounded-lg max-h-64 w-auto object-contain"
              loading="lazy"
            />
            {message.content && (
              <p className="mt-1 text-sm">{message.content}</p>
            )}
          </div>
        );

      case 'video':
        return (
          <div className="max-w-xs sm:max-w-sm">
            <video
              src={message.mediaUrl || ''}
              controls
              className="rounded-lg max-h-64 w-auto"
            />
            {message.content && (
              <p className="mt-1 text-sm">{message.content}</p>
            )}
          </div>
        );

      case 'file':
        return (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-[#1a1a24] border border-[#2a2a34] max-w-xs">
            <div className="w-10 h-10 rounded-lg bg-[#3b82f6]/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#3b82f6]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{message.fileName}</p>
              <p className="text-xs text-gray-400">
                {message.fileSize && formatFileSize(message.fileSize)}
              </p>
            </div>
            <a
              href={message.mediaUrl || ''}
              download={message.fileName}
              className="p-2 rounded-lg hover:bg-[#2a2a34] text-gray-400 hover:text-white"
            >
              <Download className="w-4 h-4" />
            </a>
          </div>
        );

      case 'sticker':
        return (
          <span className="text-5xl">{message.content}</span>
        );

      default:
        return <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>;
    }
  };

  return (
    <div
      className={cn(
        'flex gap-2.5 px-4 py-1',
        isOwn ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {showAvatar && !isOwn && (
        <Avatar className="w-8 h-8 flex-shrink-0 mt-0.5">
          <AvatarImage src={sender?.avatarUrl || undefined} />
          <AvatarFallback className="bg-[#3b82f6] text-white text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
      )}

      {showAvatar && isOwn && <div className="w-8" />}

      <div
        className={cn(
          'max-w-[70%] flex flex-col gap-1',
          isOwn ? 'items-end' : 'items-start'
        )}
      >
        {isGroup && !isOwn && showAvatar && (
          <span className="text-xs text-gray-400 ml-1">
            {sender?.displayName || sender?.username}
          </span>
        )}

        <div
          className={cn(
            'rounded-2xl px-3 py-2',
            isOwn
              ? 'bg-[#3b82f6] text-white rounded-br-md'
              : 'bg-[#1a1a24] text-gray-100 rounded-bl-md border border-[#2a2a34]'
          )}
        >
          {renderContent()}
        </div>

        <div
          className={cn(
            'flex items-center gap-1 text-xs text-gray-500',
            isOwn ? 'flex-row-reverse' : 'flex-row'
          )}
        >
          <span>{formatTime(message.createdAt)}</span>
          {isOwn && (
            <CheckCheck className="w-3.5 h-3.5 text-[#3b82f6]" />
          )}
        </div>
      </div>
    </div>
  );
}
