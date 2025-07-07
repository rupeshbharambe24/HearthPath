
import React from 'react';
import { cn } from '@/lib/utils';

interface ChatBubbleProps {
  message: string;
  isOwn: boolean;
  timestamp: string;
  senderName?: string;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ 
  message, 
  isOwn, 
  timestamp, 
  senderName 
}) => {
  return (
    <div className={cn(
      "flex mb-4",
      isOwn ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-xs lg:max-w-md px-4 py-2 rounded-2xl",
        isOwn 
          ? "bg-romantic-red text-white rounded-br-md" 
          : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-md"
      )}>
        {!isOwn && senderName && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            {senderName}
          </p>
        )}
        <p className="text-sm">{message}</p>
        <p className={cn(
          "text-xs mt-1",
          isOwn ? "text-white/70" : "text-gray-500 dark:text-gray-400"
        )}>
          {timestamp}
        </p>
      </div>
    </div>
  );
};

export default ChatBubble;
