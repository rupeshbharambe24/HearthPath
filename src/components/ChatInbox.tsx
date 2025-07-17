
import React from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface ChatPreview {
  partnerId: string;
  partnerName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

interface ChatInboxProps {
  chatPreviews: ChatPreview[];
  loading: boolean;
  selectedPartnerId: string | null;
  onSelectChat: (partnerId: string) => void;
}

const ChatInbox: React.FC<ChatInboxProps> = ({ 
  chatPreviews, 
  loading, 
  selectedPartnerId, 
  onSelectChat 
}) => {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (chatPreviews.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
          <span className="text-2xl">💬</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No conversations yet
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Start exploring to find matches and begin conversations
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full">
      {chatPreviews.map((chat) => (
        <Card
          key={chat.partnerId}
          className={cn(
            "m-2 p-3 cursor-pointer transition-colors border-l-4 hover:bg-gray-50 dark:hover:bg-gray-800",
            selectedPartnerId === chat.partnerId
              ? "bg-romantic-light-pink dark:bg-romantic-red/20 border-l-romantic-red"
              : "border-l-transparent"
          )}
          onClick={() => onSelectChat(chat.partnerId)}
        >
          <div className="flex items-center space-x-3">
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-romantic-red text-white font-semibold">
                {chat.partnerName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-medium text-gray-900 dark:text-white truncate">
                  {chat.partnerName}
                </h4>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatTime(chat.lastMessageTime)}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {chat.lastMessage || 'No messages yet'}
              </p>
              
              {chat.unreadCount > 0 && (
                <div className="mt-1">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-romantic-red text-white">
                    {chat.unreadCount}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default ChatInbox;
