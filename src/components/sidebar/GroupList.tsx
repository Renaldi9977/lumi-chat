'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Group } from '@/types';

interface GroupListProps {
  groups: Group[];
  activeId?: string;
  onSelect: (group: Group) => void;
  onCreateGroup: () => void;
}

export function GroupList({ groups, activeId, onSelect, onCreateGroup }: GroupListProps) {
  return (
    <div className="border-t border-[#2a2a34]">
      <div className="px-4 py-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Groups
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCreateGroup}
          className="w-6 h-6 text-gray-400 hover:text-white hover:bg-[#2a2a34]"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="max-h-48">
        <div className="px-2 pb-2 space-y-1">
          {groups.length === 0 ? (
            <div className="px-4 py-4 text-center">
              <Users className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No groups yet</p>
              <button
                onClick={onCreateGroup}
                className="text-xs text-[#3b82f6] hover:text-[#60a5fa] mt-1"
              >
                Create a group
              </button>
            </div>
          ) : (
            groups.map((group) => (
              <button
                key={group.id}
                onClick={() => onSelect(group)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
                  activeId === group.id
                    ? 'bg-[#3b82f6]/20 text-white'
                    : 'hover:bg-[#2a2a34] text-gray-300'
                }`}
              >
                <Avatar className="w-10 h-10 border border-[#2a2a34]">
                  <AvatarImage src={group.avatarUrl || undefined} />
                  <AvatarFallback className="bg-[#6366f1] text-white text-sm">
                    <Users className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium truncate">{group.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
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
