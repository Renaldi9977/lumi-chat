'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, Lock, User, AtSign, MessageCircle } from 'lucide-react';

interface RegisterFormProps {
  onRegister: (email: string, username: string, password: string, displayName: string) => Promise<void>;
  onSwitchToLogin: () => void;
  isLoading: boolean;
  error: string | null;
}

export function RegisterForm({ onRegister, onSwitchToLogin, isLoading, error }: RegisterFormProps) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && username && password) {
      await onRegister(email, username, password, displayName || username);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#3b82f6] mb-4">
          <MessageCircle className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Create Account</h1>
        <p className="text-gray-400">Join Lumi and start chatting</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-300">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 bg-[#1a1a24] border-[#2a2a34] text-white placeholder:text-gray-500 focus:border-[#3b82f6] focus:ring-[#3b82f6]"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="username" className="text-gray-300">Username</Label>
          <div className="relative">
            <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              id="username"
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
              className="pl-10 bg-[#1a1a24] border-[#2a2a34] text-white placeholder:text-gray-500 focus:border-[#3b82f6] focus:ring-[#3b82f6]"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="displayName" className="text-gray-300">Display Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              id="displayName"
              type="text"
              placeholder="How should we call you?"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="pl-10 bg-[#1a1a24] border-[#2a2a34] text-white placeholder:text-gray-500 focus:border-[#3b82f6] focus:ring-[#3b82f6]"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-gray-300">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              id="password"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 bg-[#1a1a24] border-[#2a2a34] text-white placeholder:text-gray-500 focus:border-[#3b82f6] focus:ring-[#3b82f6]"
              required
              minLength={6}
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white py-2.5 rounded-lg font-medium transition-colors"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating account...
            </>
          ) : (
            'Create Account'
          )}
        </Button>

        <div className="text-center text-gray-400 text-sm">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-[#3b82f6] hover:text-[#60a5fa] font-medium transition-colors"
          >
            Sign in
          </button>
        </div>
      </form>
    </div>
  );
}
