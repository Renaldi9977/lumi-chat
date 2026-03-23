'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, Mic, Image, X, Loader2 } from 'lucide-react';
import { StickerPicker } from './StickerPicker';
import { cn } from '@/lib/utils';
import type { Sticker, UploadResult } from '@/types';

interface MessageInputProps {
  onSend: (content: string, type?: string, metadata?: Record<string, unknown>) => void;
  onTyping: (isTyping: boolean) => void;
  onFileUpload: (file: File) => Promise<UploadResult>;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({ 
  onSend, 
  onTyping, 
  onFileUpload, 
  disabled,
  placeholder = 'Type a message...' 
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<{
    file: File;
    preview: string;
    type: 'image' | 'video' | 'file';
  } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  // Handle typing indicator
  const handleTypingStart = useCallback(() => {
    onTyping(true);
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }
    typingTimeout.current = setTimeout(() => {
      onTyping(false);
    }, 3000);
  }, [onTyping]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [message]);

  const handleSend = () => {
    if (uploadPreview) {
      // Send file
      sendFile();
      return;
    }

    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
      onTyping(false);
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
    }
  };

  const sendFile = async () => {
    if (!uploadPreview || disabled || isUploading) return;

    setIsUploading(true);
    try {
      const result = await onFileUpload(uploadPreview.file);
      onSend(
        uploadPreview.type === 'file' ? uploadPreview.file.name : '',
        uploadPreview.type,
        {
          mediaUrl: result.url,
          mediaType: result.type,
          fileName: result.fileName,
          fileSize: result.fileSize,
        }
      );
      setUploadPreview(null);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleStickerSelect = (sticker: Sticker) => {
    onSend(sticker.url, 'sticker', { stickerId: sticker.id });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const type = file.type.split('/')[0];
    let preview = '';

    if (type === 'image') {
      preview = URL.createObjectURL(file);
    } else if (type === 'video') {
      preview = URL.createObjectURL(file);
    }

    setUploadPreview({
      file,
      preview,
      type: type === 'image' || type === 'video' ? type : 'file',
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const cancelUpload = () => {
    if (uploadPreview?.preview) {
      URL.revokeObjectURL(uploadPreview.preview);
    }
    setUploadPreview(null);
  };

  return (
    <div className="p-4 border-t border-[#2a2a34] bg-[#0f0f14]">
      {/* Upload preview */}
      {uploadPreview && (
        <div className="mb-3 p-3 rounded-lg bg-[#1a1a24] border border-[#2a2a34]">
          <div className="flex items-start gap-3">
            {uploadPreview.type === 'image' && (
              <img
                src={uploadPreview.preview}
                alt="Preview"
                className="w-20 h-20 object-cover rounded-lg"
              />
            )}
            {uploadPreview.type === 'video' && (
              <video
                src={uploadPreview.preview}
                className="w-20 h-20 object-cover rounded-lg"
              />
            )}
            {uploadPreview.type === 'file' && (
              <div className="w-20 h-20 bg-[#2a2a34] rounded-lg flex items-center justify-center">
                <Paperclip className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {uploadPreview.file.name}
              </p>
              <p className="text-xs text-gray-400">
                {(uploadPreview.file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={cancelUpload}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* File upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="h-9 w-9 text-gray-400 hover:text-white hover:bg-[#2a2a34]"
        >
          <Paperclip className="w-5 h-5" />
        </Button>

        {/* Image picker */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (fileInputRef.current) {
              fileInputRef.current.accept = 'image/*';
              fileInputRef.current.click();
            }
          }}
          disabled={disabled || isUploading}
          className="h-9 w-9 text-gray-400 hover:text-white hover:bg-[#2a2a34]"
        >
          <Image className="w-5 h-5" />
        </Button>

        {/* Sticker picker */}
        <StickerPicker onSelect={handleStickerSelect} disabled={disabled || isUploading} />

        {/* Message input */}
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            handleTypingStart();
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isUploading}
          className="flex-1 min-h-[40px] max-h-[120px] resize-none bg-[#1a1a24] border-[#2a2a34] text-white placeholder:text-gray-500 focus:border-[#3b82f6] focus:ring-[#3b82f6] py-2.5"
          rows={1}
        />

        {/* Send button */}
        <Button
          onClick={handleSend}
          disabled={disabled || isUploading || (!message.trim() && !uploadPreview)}
          className={cn(
            'h-10 w-10 p-0 rounded-full',
            (message.trim() || uploadPreview)
              ? 'bg-[#3b82f6] hover:bg-[#2563eb] text-white'
              : 'bg-[#2a2a34] text-gray-500'
          )}
        >
          {isUploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>

        {/* Voice message button (UI only) */}
        <Button
          variant="ghost"
          size="icon"
          disabled={disabled || isUploading}
          className="h-9 w-9 text-gray-400 hover:text-white hover:bg-[#2a2a34] hidden sm:flex"
        >
          <Mic className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
