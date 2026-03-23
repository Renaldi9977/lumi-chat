'use client';

import { cn } from '@/lib/utils';
import type { UserStatus } from '@/types';

interface StatusIndicatorProps {
  status: UserStatus;
  className?: string;
}

const statusColors: Record<UserStatus, string> = {
  online: 'bg-green-500',
  idle: 'bg-yellow-500',
  dnd: 'bg-red-500',
  offline: 'bg-gray-500',
};

export function StatusIndicator({ status, className }: StatusIndicatorProps) {
  return (
    <span
      className={cn(
        'inline-block rounded-full ring-2 ring-[#0f0f14]',
        statusColors[status],
        className
      )}
      title={status === 'dnd' ? 'Do Not Disturb' : status.charAt(0).toUpperCase() + status.slice(1)}
    />
  );
}
