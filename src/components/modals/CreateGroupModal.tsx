'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Users, Search } from 'lucide-react';
import { api } from '@/services/api';
import type { User } from '@/types';

interface CreateGroupModalProps {
  open: boolean;
  onClose: () => void;
  onCreateGroup: (name: string, description: string, memberIds: string[]) => Promise<void>;
}

export function CreateGroupModal({ open, onClose, onCreateGroup }: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const users = await api.searchUsers(searchQuery);
        setSearchResults(users.filter(u => !selectedMembers.find(m => m.id === u.id)));
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(searchUsers, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedMembers]);

  const toggleMember = (user: User) => {
    setSelectedMembers(prev => 
      prev.find(m => m.id === user.id)
        ? prev.filter(m => m.id !== user.id)
        : [...prev, user]
    );
  };

  const handleCreate = async () => {
    if (!name.trim()) return;

    setIsCreating(true);
    try {
      await onCreateGroup(
        name.trim(),
        description.trim(),
        selectedMembers.map(m => m.id)
      );
      handleClose();
    } catch (error) {
      console.error('Create group error:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedMembers([]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-[#1a1a24] border-[#2a2a34] text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#3b82f6]" />
            Create New Group
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Create a group to chat with multiple people at once.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Group name */}
          <div className="space-y-2">
            <Label htmlFor="group-name" className="text-gray-300">Group Name *</Label>
            <Input
              id="group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter group name"
              className="bg-[#0f0f14] border-[#2a2a34] text-white placeholder:text-gray-500 focus:border-[#3b82f6]"
            />
          </div>

          {/* Group description */}
          <div className="space-y-2">
            <Label htmlFor="group-desc" className="text-gray-300">Description (optional)</Label>
            <Textarea
              id="group-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this group about?"
              className="bg-[#0f0f14] border-[#2a2a34] text-white placeholder:text-gray-500 focus:border-[#3b82f6] resize-none"
              rows={2}
            />
          </div>

          {/* Selected members */}
          {selectedMembers.length > 0 && (
            <div className="space-y-2">
              <Label className="text-gray-300">
                Selected Members ({selectedMembers.length})
              </Label>
              <div className="flex flex-wrap gap-2">
                {selectedMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-2 px-2 py-1 rounded-full bg-[#3b82f6]/20 border border-[#3b82f6]/30"
                  >
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={member.avatarUrl || undefined} />
                      <AvatarFallback className="bg-[#3b82f6] text-white text-xs">
                        {(member.displayName || member.username || 'U').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{member.displayName || member.username}</span>
                    <button
                      onClick={() => toggleMember(member)}
                      className="text-gray-400 hover:text-white"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search users */}
          <div className="space-y-2">
            <Label className="text-gray-300">Add Members</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users to add..."
                className="pl-9 bg-[#0f0f14] border-[#2a2a34] text-white placeholder:text-gray-500 focus:border-[#3b82f6]"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 animate-spin" />
              )}
            </div>

            {searchResults.length > 0 && (
              <ScrollArea className="h-40 rounded-lg border border-[#2a2a34] bg-[#0f0f14]">
                <div className="p-2 space-y-1">
                  {searchResults.map((user) => (
                    <label
                      key={user.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#1a1a24] cursor-pointer"
                    >
                      <Checkbox
                        checked={!!selectedMembers.find(m => m.id === user.id)}
                        onCheckedChange={() => toggleMember(user)}
                        className="border-[#3b82f6] data-[state=checked]:bg-[#3b82f6]"
                      />
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.avatarUrl || undefined} />
                        <AvatarFallback className="bg-[#3b82f6] text-white text-xs">
                          {(user.displayName || user.username || 'U').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {user.displayName || user.username}
                        </p>
                        <p className="text-xs text-gray-400">@{user.username}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              className="border-[#2a2a34] text-gray-300 hover:text-white hover:bg-[#2a2a34]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!name.trim() || isCreating}
              className="bg-[#3b82f6] hover:bg-[#2563eb] text-white"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Group'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
