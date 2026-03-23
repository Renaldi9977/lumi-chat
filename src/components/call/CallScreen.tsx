'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CallSession } from '@/types';

interface CallScreenProps {
  callSession: CallSession;
  currentUserId: string;
  onAnswer?: () => void;
  onEnd: () => void;
}

export function CallScreen({ callSession, currentUserId, onAnswer, onEnd }: CallScreenProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const isCaller = callSession.caller.id === currentUserId;
  const isVideo = callSession.callType === 'video';

  useEffect(() => {
    if (callSession.status === 'connected') {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [callSession.status]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleToggleVideo = () => {
    setIsVideoOff(!isVideoOff);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0f0f14] flex flex-col items-center justify-center">
      {/* Call info */}
      <div className="text-center mb-8">
        <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-[#3b82f6]">
          <AvatarImage src={callSession.caller.avatarUrl || undefined} />
          <AvatarFallback className="bg-[#3b82f6] text-white text-2xl font-medium">
            {(callSession.caller.displayName || callSession.caller.username || 'U').slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <h2 className="text-2xl font-bold text-white mb-2">
          {callSession.caller.displayName || callSession.caller.username}
        </h2>
        <p className="text-gray-400">
          {callSession.status === 'ringing' 
            ? (isCaller ? 'Calling...' : 'Incoming call...')
            : formatDuration(callDuration)
          }
        </p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className={cn(
            'px-3 py-1 rounded-full text-xs font-medium',
            isVideo ? 'bg-[#3b82f6]/20 text-[#3b82f6]' : 'bg-green-500/20 text-green-500'
          )}>
            {isVideo ? 'Video Call' : 'Voice Call'}
          </span>
        </div>
      </div>

      {/* Video preview placeholder */}
      {isVideo && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-full bg-[#1a1a24] flex items-center justify-center">
            <p className="text-gray-500">Video stream would appear here</p>
          </div>
          {/* Self video */}
          <div className="absolute bottom-32 right-8 w-32 h-24 bg-[#2a2a34] rounded-lg border border-[#3b82f6] flex items-center justify-center">
            <p className="text-xs text-gray-500">You</p>
          </div>
        </div>
      )}

      {/* Call controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-4">
          {/* Mute button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleMute}
            className={cn(
              'w-14 h-14 rounded-full',
              isMuted 
                ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' 
                : 'bg-[#2a2a34] text-white hover:bg-[#3a3a44]'
            )}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </Button>

          {/* Video toggle (for video calls) */}
          {isVideo && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleVideo}
              className={cn(
                'w-14 h-14 rounded-full',
                isVideoOff 
                  ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' 
                  : 'bg-[#2a2a34] text-white hover:bg-[#3a3a44]'
              )}
            >
              {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
            </Button>
          )}

          {/* Speaker button */}
          <Button
            variant="ghost"
            size="icon"
            className="w-14 h-14 rounded-full bg-[#2a2a34] text-white hover:bg-[#3a3a44]"
          >
            <Volume2 className="w-6 h-6" />
          </Button>

          {/* Answer button (for incoming calls) */}
          {!isCaller && callSession.status === 'ringing' && onAnswer && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onAnswer}
              className="w-14 h-14 rounded-full bg-green-500 text-white hover:bg-green-600"
            >
              <Phone className="w-6 h-6" />
            </Button>
          )}

          {/* End call button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onEnd}
            className="w-14 h-14 rounded-full bg-red-500 text-white hover:bg-red-600"
          >
            <PhoneOff className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
