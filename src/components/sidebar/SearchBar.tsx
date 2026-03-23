'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, X, Loader2 } from 'lucide-react';
import { api } from '@/services/api';
import type { User } from '@/types';

interface SearchBarProps {
  onUserSelect: (user: User) => void;
  onGroupSelect?: (groupId: string) => void;
}

export function SearchBar({ onUserSelect }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const searchUsers = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const users = await api.searchUsers(searchQuery);
      setResults(users);
      setIsOpen(true);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) {
        searchUsers(query);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchUsers]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (user: User) => {
    onUserSelect(user);
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative p-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          className="pl-9 pr-9 h-9 bg-[#1a1a24] border-[#2a2a34] text-white placeholder:text-gray-500 focus:border-[#3b82f6] focus:ring-[#3b82f6] text-sm"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 animate-spin" />
        )}
        {!isLoading && query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-3 right-3 mt-1 bg-[#1a1a24] border border-[#2a2a34] rounded-lg shadow-xl z-50">
          <ScrollArea className="max-h-64">
            <div className="p-1">
              {results.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelect(user)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[#2a2a34] transition-colors"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.avatarUrl || undefined} />
                    <AvatarFallback className="bg-[#3b82f6] text-white text-xs">
                      {(user.displayName || user.username || 'U').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {user.displayName || user.username}
                    </p>
                    <p className="text-xs text-gray-400">@{user.username}</p>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {isOpen && query.length >= 2 && results.length === 0 && !isLoading && (
        <div className="absolute top-full left-3 right-3 mt-1 bg-[#1a1a24] border border-[#2a2a34] rounded-lg shadow-xl z-50 p-4 text-center text-gray-400 text-sm">
          No users found
        </div>
      )}
    </div>
  );
}
