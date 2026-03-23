'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { StatusIndicator } from '@/components/ui-custom/StatusIndicator';
import { Settings, LogOut, Menu } from 'lucide-react';
import type { User } from '@/types';

interface UserProfileProps {
  user: User;
  onSettings: () => void;
  onLogout: () => void;
  onToggleSidebar: () => void;
  isMobile: boolean;
}

export function UserProfile({ user, onSettings, onLogout, onToggleSidebar, isMobile }: UserProfileProps) {
  const initials = (user.displayName || user.username || 'U').slice(0, 2).toUpperCase();

  return (
    <div className="p-4 border-b border-[#2a2a34]">
      <div className="flex items-center gap-3">
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="text-gray-400 hover:text-white hover:bg-[#2a2a34]"
          >
            <Menu className="w-5 h-5" />
          </Button>
        )}
        
        <div className="relative">
          <Avatar className="w-10 h-10 border-2 border-[#2a2a34]">
            <AvatarImage src={user.avatarUrl || undefined} alt={user.displayName || user.username} />
            <AvatarFallback className="bg-[#3b82f6] text-white font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <StatusIndicator status={user.status} className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-white truncate">
            {user.displayName || user.username}
          </h3>
          <p className="text-xs text-gray-400 truncate">@{user.username}</p>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onSettings}
            className="w-8 h-8 text-gray-400 hover:text-white hover:bg-[#2a2a34]"
          >
            <Settings className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onLogout}
            className="w-8 h-8 text-gray-400 hover:text-red-400 hover:bg-[#2a2a34]"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
