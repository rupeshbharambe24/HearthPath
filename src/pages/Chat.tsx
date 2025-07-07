
import React from 'react';
import AppLayout from '@/components/AppLayout';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

const Chat = () => {
  return (
    <AppLayout>
      <div className="flex min-h-screen bg-gray-50 dark:bg-romantic-dark-bg">
        <Sidebar />
        <main className="flex-1 lg:ml-64 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Chat
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Connect with your matches through meaningful conversations.
              </p>
            </div>
            
            <Card className="romantic-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5" />
                  <span>Chat Feature</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  Chat functionality will be implemented here. This is where users can have conversations with their matches.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AppLayout>
  );
};

export default Chat;
