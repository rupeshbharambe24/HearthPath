
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, Heart } from 'lucide-react';
import ChatBubble from './ChatBubble';
import MemoryTrail from './MemoryTrail';
import RelationshipBadge from './RelationshipBadge';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  message: string;
  isOwn: boolean;
  timestamp: string;
  senderName?: string;
}

interface ChatRoomProps {
  matchName: string;
  relationshipLevel: number;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ matchName, relationshipLevel }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
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
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mock memory entries
  const memories = [
    {
      id: '1',
      type: 'milestone' as const,
      title: 'First Chat',
      description: 'You both started your conversation about shared interests',
      date: '3 days ago',
      level: 2,
      icon: '💬'
    },
    {
      id: '2',
      type: 'heart' as const,
      title: 'Heart Exchange',
      description: `${matchName} appreciated your photography passion`,
      date: '2 days ago',
      level: 3,
      icon: '🧡'
    },
    {
      id: '3',
      type: 'memory' as const,
      title: 'Common Ground',
      description: 'Discovered mutual love for outdoor adventures and photography',
      date: '1 day ago',
      level: 3,
      icon: '💑'
    },
    {
      id: '4',
      type: 'milestone' as const,
      title: 'Photo Walk Plans',
      description: 'Exciting plans for your first meetup adventure',
      date: 'Just now',
      level: 4,
      icon: '🎉'
    }
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

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        message: message.trim(),
        isOwn: true,
        timestamp: getCurrentTime(),
      };
      
      setMessages(prev => [...prev, newMessage]);
      setMessage('');
      
      // Simulate a response after a delay
      setTimeout(() => {
        const responses = [
          "That's really interesting!",
          "I'd love to hear more about that 😊",
          "We should definitely explore this together!",
          "You have such great taste! 💕",
          "I'm really enjoying our conversation"
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        const responseMessage: Message = {
          id: (Date.now() + 1).toString(),
          message: randomResponse,
          isOwn: false,
          timestamp: getCurrentTime(),
          senderName: matchName,
        };
        
        setMessages(prev => [...prev, responseMessage]);
      }, 1000 + Math.random() * 2000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col">
      <Card className="romantic-card flex-1 flex flex-col">
        <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              {matchName}
            </CardTitle>
            <RelationshipBadge level={relationshipLevel} />
          </div>
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
                  "flex-1 p-4 overflow-y-auto max-h-96",
                  getChatBackgroundClass(relationshipLevel)
                )}
                style={{ scrollbarWidth: 'thin' }}
              >
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
                  <div ref={messagesEndRef} />
                </div>
              </div>
              
              {/* Sticky Input Area */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-romantic-dark-bg">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    className="romantic-btn"
                    disabled={!message.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="memories" className="flex-1 p-4">
              <MemoryTrail memories={memories} relationshipLevel={relationshipLevel} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatRoom;
