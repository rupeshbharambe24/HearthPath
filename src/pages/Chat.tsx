
import React from 'react';
import AppLayout from '@/components/AppLayout';
import Sidebar from '@/components/Sidebar';
import ChatRoom from '@/components/ChatRoom';

const Chat = () => {
  return (
    <AppLayout>
      <div className="flex min-h-screen bg-gray-50 dark:bg-romantic-dark-bg">
        <Sidebar />
        <main className="flex-1 lg:ml-64 p-6">
          <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)]">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Chat
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Connect with your matches through meaningful conversations.
              </p>
            </div>
            
            <ChatRoom 
              matchName="Emma Wilson" 
              relationshipLevel={3} 
            />
          </div>
        </main>
      </div>
    </AppLayout>
  );
};

export default Chat;
