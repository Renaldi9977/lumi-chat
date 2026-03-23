'use client';

import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  usernames: string[];
  className?: string;
}

export function TypingIndicator({ usernames, className }: TypingIndicatorProps) {
  if (usernames.length === 0) return null;

  const getText = () => {
    if (usernames.length === 1) {
      return `${usernames[0]} is typing`;
    } else if (usernames.length === 2) {
      return `${usernames[0]} and ${usernames[1]} are typing`;
    } else {
      return `${usernames[0]} and ${usernames.length - 1} others are typing`;
    }
  };

  return (
    <div className={cn('flex items-center gap-2 px-4 py-2', className)}>
      <div className="flex gap-1">
        <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-xs text-gray-400">{getText()}</span>
    </div>
  );
}
