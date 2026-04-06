import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import ChatInbox from '@/components/ChatInbox';
import ChatRoom from '@/components/ChatRoom';
import { useMessages } from '@/hooks/useMessages';
import { useUserData } from '@/hooks/useUserData';
import { fadeUp } from '@/lib/animations';

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
    <AuthenticatedLayout>
      <div className="flex h-[calc(100vh-3.5rem)] lg:h-screen">
            {/* Left Panel - Chat Inbox */}
            <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-romantic-dark-card">
              <motion.div
                className="p-4 border-b border-gray-200 dark:border-gray-700"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Messages
                </h1>
              </motion.div>

              <ChatInbox
                chatPreviews={chatPreviews}
                loading={messagesLoading || userLoading}
                selectedPartnerId={selectedPartnerId}
                onSelectChat={setSelectedPartnerId}
              />
            </div>

            {/* Right Panel - Chat Room */}
            <div className="flex-1 flex flex-col">
              <AnimatePresence mode="wait">
                {selectedPartnerId ? (
                  <motion.div
                    key={selectedPartnerId}
                    className="flex-1 flex flex-col"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                  >
                    <ChatRoom
                      partnerId={selectedPartnerId}
                      matchName={selectedPartnerName}
                      relationshipLevel={selectedRelationshipLevel}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-romantic-dark-bg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="text-center">
                      <motion.div
                        className="w-16 h-16 mx-auto mb-4 bg-romantic-light-pink dark:bg-romantic-red/20 rounded-full flex items-center justify-center"
                        animate={{ scale: [1, 1.06, 1] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <span className="text-2xl">💬</span>
                      </motion.div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Select a conversation
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        Choose a conversation from the sidebar to start chatting
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
      </div>
    </AuthenticatedLayout>
  );
};

export default Chat;
