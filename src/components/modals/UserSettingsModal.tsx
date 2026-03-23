'use client';

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Camera, User } from 'lucide-react';
import type { User as UserType, UserStatus } from '@/types';

interface UserSettingsModalProps {
  open: boolean;
  onClose: () => void;
  user: UserType;
  onUpdateProfile: (data: { displayName?: string; username?: string; customStatus?: string }) => Promise<void>;
  onUpdateStatus: (status: UserStatus) => Promise<void>;
  onUploadAvatar: (file: File) => Promise<string>;
}

const statusOptions: { value: UserStatus; label: string; color: string }[] = [
  { value: 'online', label: 'Online', color: 'bg-green-500' },
  { value: 'idle', label: 'Idle', color: 'bg-yellow-500' },
  { value: 'dnd', label: 'Do Not Disturb', color: 'bg-red-500' },
  { value: 'offline', label: 'Invisible', color: 'bg-gray-500' },
];

export function UserSettingsModal({
  open,
  onClose,
  user,
  onUpdateProfile,
  onUpdateStatus,
  onUploadAvatar,
}: UserSettingsModalProps) {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [username, setUsername] = useState(user.username);
  const [customStatus, setCustomStatus] = useState(user.customStatus || '');
  const [status, setStatus] = useState<UserStatus>(user.status);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await onUploadAvatar(file);
    } catch (error) {
      console.error('Avatar upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsUpdating(true);
    try {
      await Promise.all([
        onUpdateProfile({ displayName, username, customStatus }),
        status !== user.status ? onUpdateStatus(status) : Promise.resolve(),
      ]);
      onClose();
    } catch (error) {
      console.error('Update failed:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const initials = (user.displayName || user.username || 'U').slice(0, 2).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#1a1a24] border-[#2a2a34] text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#3b82f6]" />
            User Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="w-20 h-20 border-2 border-[#2a2a34]">
                <AvatarImage src={user.avatarUrl || undefined} />
                <AvatarFallback className="bg-[#3b82f6] text-white text-xl font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#3b82f6] flex items-center justify-center hover:bg-[#2563eb] transition-colors"
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <Camera className="w-4 h-4 text-white" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <div className="text-sm text-gray-400">
              <p>Click to change your avatar</p>
              <p className="text-xs mt-1">JPG, PNG or GIF. Max 5MB.</p>
            </div>
          </div>

          {/* Display name */}
          <div className="space-y-2">
            <Label htmlFor="display-name" className="text-gray-300">Display Name</Label>
            <Input
              id="display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How should we call you?"
              className="bg-[#0f0f14] border-[#2a2a34] text-white placeholder:text-gray-500 focus:border-[#3b82f6]"
            />
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username" className="text-gray-300">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
              placeholder="Your unique username"
              className="bg-[#0f0f14] border-[#2a2a34] text-white placeholder:text-gray-500 focus:border-[#3b82f6]"
            />
          </div>

          {/* Custom status */}
          <div className="space-y-2">
            <Label htmlFor="custom-status" className="text-gray-300">Custom Status</Label>
            <Input
              id="custom-status"
              value={customStatus}
              onChange={(e) => setCustomStatus(e.target.value)}
              placeholder="What's on your mind?"
              className="bg-[#0f0f14] border-[#2a2a34] text-white placeholder:text-gray-500 focus:border-[#3b82f6]"
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label className="text-gray-300">Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as UserStatus)}>
              <SelectTrigger className="bg-[#0f0f14] border-[#2a2a34] text-white focus:border-[#3b82f6]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a24] border-[#2a2a34]">
                {statusOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="text-white hover:bg-[#2a2a34] focus:bg-[#2a2a34]"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${option.color}`} />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-[#2a2a34] text-gray-300 hover:text-white hover:bg-[#2a2a34]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isUpdating}
              className="bg-[#3b82f6] hover:bg-[#2563eb] text-white"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
