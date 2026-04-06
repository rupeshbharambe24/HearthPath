import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send } from 'lucide-react';
import ChatBubble from './ChatBubble';
import MemoryTrail from './MemoryTrail';
import RelationshipBadge from './RelationshipBadge';
import { cn } from '@/lib/utils';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getLevelGlow } from '@/lib/animations';

interface ChatRoomProps {
  partnerId: string;
  matchName: string;
  relationshipLevel: number;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ partnerId, matchName, relationshipLevel }) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { user } = useAuth();
  const { getMessagesWithPartner } = useMessages();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);

  const messages = getMessagesWithPartner(partnerId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getChatBackgroundClass = (level: number) => {
    const backgrounds = {
      1: 'bg-gray-50 dark:bg-gray-900',
      2: 'bg-pink-50 dark:bg-pink-950/20',
      3: 'bg-rose-50 dark:bg-rose-950/20',
      4: 'bg-red-50 dark:bg-red-950/20',
      5: 'bg-romantic-light-pink dark:bg-romantic-red/10',
      6: 'bg-gradient-to-br from-romantic-light-pink to-romantic-pink/20 dark:from-romantic-red/10 dark:to-romantic-pink/10',
    };
    return backgrounds[level as keyof typeof backgrounds] || backgrounds[1];
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !user?.id || sending) return;

    try {
      setSending(true);

      const { error } = await supabase
        .from('messages')
        .insert([{
          content: message.trim(),
          sender_id: user.id,
          receiver_id: partnerId,
          content_type: 'text'
        }]);

      if (error) {
        console.error('Error sending message:', error);
        toast({
          title: "Failed to send message",
          description: "Please try again.",
          variant: "destructive",
        });
        return;
      }

      setMessage('');
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const levelGlow = getLevelGlow(relationshipLevel);

  return (
    <div className="h-full flex flex-col">
      <Card
        className="bg-white dark:bg-[#1a1215] border border-gray-200/70 dark:border-gray-800/70 rounded-2xl flex-1 flex flex-col transition-shadow duration-500 overflow-hidden"
        style={levelGlow ? { boxShadow: levelGlow } : undefined}
      >
        <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-700">
          <motion.div
            className="flex items-center justify-between"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              {matchName}
            </CardTitle>
            <RelationshipBadge level={relationshipLevel} />
          </motion.div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          <Tabs defaultValue="chat" className="flex-1 flex flex-col">
            <TabsList className="mx-6 mt-4 mb-0 grid w-auto grid-cols-2">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="memories">Memory Trail</TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="flex-1 flex flex-col mt-0">
              {/* Scrollable Chat Area */}
              <div
                ref={chatAreaRef}
                className={cn(
                  "flex-1 p-4 overflow-y-auto transition-colors duration-500",
                  getChatBackgroundClass(relationshipLevel)
                )}
                style={{ scrollbarWidth: 'thin' }}
              >
                <div className="space-y-2">
                  {messages.length === 0 ? (
                    <motion.div
                      className="text-center py-8"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4 }}
                    >
                      <motion.div
                        className="w-16 h-16 mx-auto mb-4 bg-romantic-light-pink dark:bg-romantic-red/20 rounded-full flex items-center justify-center"
                        animate={{ scale: [1, 1.08, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <span className="text-2xl">👋</span>
                      </motion.div>
                      <p className="text-gray-500 dark:text-gray-400">
                        Start your conversation with {matchName}
                      </p>
                    </motion.div>
                  ) : (
                    messages.map((msg) => (
                      <ChatBubble
                        key={msg.id}
                        message={msg.content || ''}
                        isOwn={msg.sender_id === user?.id}
                        timestamp={new Date(msg.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                        senderName={msg.sender_id === user?.id ? undefined : matchName}
                      />
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Sticky Input Area */}
              <motion.div
                className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-romantic-dark-bg"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.15 }}
              >
                <div className="flex space-x-2">
                  <Input
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 transition-shadow duration-200 focus:shadow-md focus:shadow-romantic-red/10"
                    disabled={sending}
                  />
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={handleSendMessage}
                      className="romantic-btn"
                      disabled={!message.trim() || sending}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="memories" className="flex-1 p-4">
              <MemoryTrail
                partnerId={partnerId}
                relationshipLevel={relationshipLevel}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatRoom;
