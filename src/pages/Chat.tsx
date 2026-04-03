
import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import Sidebar from '@/components/Sidebar';
import ChatInbox from '@/components/ChatInbox';
import ChatRoom from '@/components/ChatRoom';
import { useMessages } from '@/hooks/useMessages';
import { useUserData } from '@/hooks/useUserData';

const Chat = () => {
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const { chatPreviews, loading: messagesLoading } = useMessages();
  const { relationships, loading: userLoading } = useUserData();

  const selectedPartner = selectedPartnerId 
    ? relationships.find(rel => 
        rel.user_a === selectedPartnerId || rel.user_b === selectedPartnerId
      )
    : null;

  const selectedPartnerName = selectedPartner?.partner?.name || 'Chat';
  const selectedRelationshipLevel = selectedPartner?.current_stage || selectedPartner?.current_level || 1;

  return (
    <AppLayout>
      <div className="flex min-h-screen bg-gray-50 dark:bg-romantic-dark-bg">
        <Sidebar />
        <main className="flex-1 lg:ml-64">
          <div className="flex h-screen">
            {/* Left Panel - Chat Inbox */}
            <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-romantic-dark-card">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Messages
                </h1>
              </div>
              
              <ChatInbox 
                chatPreviews={chatPreviews}
                loading={messagesLoading || userLoading}
                selectedPartnerId={selectedPartnerId}
                onSelectChat={setSelectedPartnerId}
              />
            </div>

            {/* Right Panel - Chat Room */}
            <div className="flex-1 flex flex-col">
              {selectedPartnerId ? (
                <ChatRoom 
                  partnerId={selectedPartnerId}
                  matchName={selectedPartnerName}
                  relationshipLevel={selectedRelationshipLevel}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-romantic-dark-bg">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-romantic-light-pink dark:bg-romantic-red/20 rounded-full flex items-center justify-center">
                      <span className="text-2xl">💬</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Select a conversation
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Choose a conversation from the sidebar to start chatting
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </AppLayout>
  );
};

export default Chat;
