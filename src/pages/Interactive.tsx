
import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import Sidebar from '@/components/Sidebar';
import KnowMeGame from '@/components/KnowMeGame';
import ConfessionBox from '@/components/ConfessionBox';
import PasscodeUnlock from '@/components/PasscodeUnlock';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gamepad2, Mail, Lock } from 'lucide-react';

const Interactive = () => {
  const sampleUnlockData = {
    question: "What's my favorite season?",
    correctAnswer: "autumn",
    lockedContent: {
      type: 'text' as const,
      content: "I love the feeling of crisp autumn air and the way the leaves change colors. It reminds me of cozy coffee dates and long walks in the park. There's something magical about that time of year that makes everything feel possible."
    },
    title: "Secret Memory"
  };

  return (
    <AppLayout>
      <div className="flex min-h-screen bg-gray-50 dark:bg-romantic-dark-bg">
        <Sidebar />
        <main className="flex-1 lg:ml-64 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Interactive Features
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Build deeper connections through games, confessions, and shared secrets
              </p>
            </div>

            <Tabs defaultValue="games" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="games" className="flex items-center space-x-2">
                  <Gamepad2 className="w-4 h-4" />
                  <span>Games</span>
                </TabsTrigger>
                <TabsTrigger value="confessions" className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>Confessions</span>
                </TabsTrigger>
                <TabsTrigger value="secrets" className="flex items-center space-x-2">
                  <Lock className="w-4 h-4" />
                  <span>Secrets</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="games" className="space-y-6">
                <Card className="romantic-card">
                  <CardHeader>
                    <CardTitle>Know Me Better Game</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Test how well you know your matches with fun personality quizzes!
                    </p>
                    <KnowMeGame />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="confessions" className="space-y-6">
                <Card className="romantic-card">
                  <CardHeader>
                    <CardTitle>Anonymous Confessions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Share your feelings anonymously with someone from your college
                    </p>
                    <ConfessionBox />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="secrets" className="space-y-6">
                <Card className="romantic-card">
                  <CardHeader>
                    <CardTitle>Secret Memories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Unlock special memories by answering personal questions
                    </p>
                    <PasscodeUnlock {...sampleUnlockData} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </AppLayout>
  );
};

export default Interactive;
