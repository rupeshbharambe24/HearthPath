
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, Heart } from 'lucide-react';
import ChatBubble from './ChatBubble';
import MemoryTrail from './MemoryTrail';
import RelationshipBadge from './RelationshipBadge';
import { cn } from '@/lib/utils';

interface ChatRoomProps {
  matchName: string;
  relationshipLevel: number;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ matchName, relationshipLevel }) => {
  const [message, setMessage] = useState('');
  
  // Mock chat messages
  const messages = [
    {
      id: '1',
      message: 'Hey! I saw you love photography too. What\'s your favorite subject to shoot?',
      isOwn: false,
      timestamp: '2:30 PM',
      senderName: matchName,
    },
    {
      id: '2',
      message: 'I love capturing nature and candid moments! There\'s something magical about golden hour shots.',
      isOwn: true,
      timestamp: '2:32 PM',
    },
    {
      id: '3',
      message: 'That sounds amazing! I\'d love to go on a photo walk sometime if you\'re up for it.',
      isOwn: false,
      timestamp: '2:35 PM',
      senderName: matchName,
    },
  ];

  // Mock memory entries
  const memories = [
    {
      id: '1',
      type: 'milestone' as const,
      title: 'Became Chat Friends',
      description: 'You both decided to start getting to know each other',
      date: '3 days ago',
      level: 2,
    },
    {
      id: '2',
      type: 'heart' as const,
      title: 'First Heart Exchange',
      description: `${matchName} sent you a heart for your photography passion`,
      date: '2 days ago',
      level: 3,
    },
    {
      id: '3',
      type: 'memory' as const,
      title: 'Shared Interest Discovery',
      description: 'You both love photography and outdoor adventures',
      date: '1 day ago',
      level: 3,
    },
  ];

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

  const handleSendMessage = () => {
    if (message.trim()) {
      console.log('Sending message:', message);
      setMessage('');
    }
  };

  return (
    <div className="h-full flex flex-col">
      <Card className="romantic-card flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              {matchName}
            </CardTitle>
            <RelationshipBadge level={relationshipLevel} />
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col">
          <Tabs defaultValue="chat" className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="memories">Memory Trail</TabsTrigger>
            </TabsList>
            
            <TabsContent value="chat" className="flex-1 flex flex-col">
              <div className={cn(
                "flex-1 p-4 rounded-lg overflow-y-auto mb-4",
                getChatBackgroundClass(relationshipLevel)
              )}>
                <div className="space-y-2">
                  {messages.map((msg) => (
                    <ChatBubble
                      key={msg.id}
                      message={msg.message}
                      isOwn={msg.isOwn}
                      timestamp={msg.timestamp}
                      senderName={msg.senderName}
                    />
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Input
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} className="romantic-btn">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="memories" className="flex-1">
              <MemoryTrail memories={memories} relationshipLevel={relationshipLevel} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatRoom;
