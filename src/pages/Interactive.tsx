
import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import Sidebar from '@/components/Sidebar';
import KnowMeGame from '@/components/KnowMeGame';
import ConfessionBox from '@/components/ConfessionBox';
import PasscodeUnlock from '@/components/PasscodeUnlock';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useInteractiveData } from '@/hooks/useInteractiveData';
import { Gamepad2, Mail, Lock, Heart, Check, X, Users } from 'lucide-react';

const Interactive = () => {
  const { toast } = useToast();
  const {
    incomingRequests,
    outgoingRequests,
    activeRelationships,
    funPosts,
    loading,
    acceptRequest,
    rejectRequest,
    sendHeart,
    createFunPost
  } = useInteractiveData();

  const handleAcceptRequest = async (requestId: string) => {
    const result = await acceptRequest(requestId);
    if (result.success) {
      toast({
        title: "Request Accepted! 💕",
        description: "You can now start chatting and building your connection!",
      });
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    const result = await rejectRequest(requestId);
    if (result.success) {
      toast({
        title: "Request Declined",
        description: "The request has been politely declined.",
      });
    }
  };

  const handleSendHeart = async (relationshipId: string) => {
    const result = await sendHeart(relationshipId);
    if (result.success) {
      toast({
        title: "Heart Sent! 💖",
        description: "Your love has been shared!",
      });
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex min-h-screen bg-gray-50 dark:bg-romantic-dark-bg">
          <Sidebar />
          <main className="flex-1 lg:ml-64 p-6">
            <div className="max-w-4xl mx-auto">
              <div className="animate-pulse space-y-8">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1,2].map(i => (
                    <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </AppLayout>
    );
  }

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

            <Tabs defaultValue="requests" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="requests" className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Requests</span>
                  {incomingRequests.length > 0 && (
                    <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                      {incomingRequests.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="hearts" className="flex items-center space-x-2">
                  <Heart className="w-4 h-4" />
                  <span>Hearts</span>
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

              <TabsContent value="requests" className="space-y-6">
                <Card className="romantic-card">
                  <CardHeader>
                    <CardTitle>Incoming Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {incomingRequests.length === 0 ? (
                      <p className="text-gray-600 dark:text-gray-400">No pending requests</p>
                    ) : (
                      <div className="space-y-4">
                        {incomingRequests.map((request) => (
                          <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <h4 className="font-medium">{request.partner.name}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {request.partner.college_name || 'Unknown College'}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <Button size="sm" onClick={() => handleAcceptRequest(request.id)}>
                                <Check className="w-4 h-4 mr-1" />
                                Accept
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleRejectRequest(request.id)}>
                                <X className="w-4 h-4 mr-1" />
                                Decline
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="romantic-card">
                  <CardHeader>
                    <CardTitle>Sent Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {outgoingRequests.length === 0 ? (
                      <p className="text-gray-600 dark:text-gray-400">No pending outgoing requests</p>
                    ) : (
                      <div className="space-y-4">
                        {outgoingRequests.map((request) => (
                          <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <h4 className="font-medium">{request.partner.name}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {request.partner.college_name || 'Unknown College'}
                              </p>
                            </div>
                            <Badge variant="secondary">Pending</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="hearts" className="space-y-6">
                <Card className="romantic-card">
                  <CardHeader>
                    <CardTitle>Send Hearts to Your Connections</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {activeRelationships.length === 0 ? (
                      <p className="text-gray-600 dark:text-gray-400">
                        No active connections yet. Accept some requests to start sharing hearts!
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {activeRelationships.map((relationship) => {
                          const heartsGiven = relationship.user_a === relationship.user_a ? relationship.hearts_a2b : relationship.hearts_b2a;
                          const heartsReceived = relationship.user_a === relationship.user_a ? relationship.hearts_b2a : relationship.hearts_a2b;
                          
                          return (
                            <div key={relationship.id} className="flex items-center justify-between p-4 border rounded-lg">
                              <div>
                                <h4 className="font-medium">{relationship.partner.name}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Level {relationship.current_level} • Hearts: {heartsGiven} sent, {heartsReceived} received
                                </p>
                              </div>
                              <Button onClick={() => handleSendHeart(relationship.id)} className="bg-romantic-red hover:bg-romantic-red/90">
                                <Heart className="w-4 h-4 mr-1" />
                                Send Heart
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
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
                      Share and unlock special memories with your connections
                    </p>
                    {funPosts.filter(post => post.type === 'secret').length === 0 ? (
                      <p className="text-gray-500">No secret memories yet. Create some with your connections!</p>
                    ) : (
                      <div className="space-y-4">
                        {funPosts.filter(post => post.type === 'secret').map((post) => (
                          <div key={post.id} className="p-4 border rounded-lg">
                            <h5 className="font-medium mb-2">{post.question}</h5>
                            {post.visible_to_target && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">{post.message}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
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
