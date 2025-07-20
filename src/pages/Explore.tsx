
import React from 'react';
import AppLayout from '@/components/AppLayout';
import Sidebar from '@/components/Sidebar';
import ProfileCard from '@/components/ProfileCard';
import { useToast } from '@/hooks/use-toast';
import { useExploreData } from '@/hooks/useExploreData';

const Explore = () => {
  const { toast } = useToast();
  const { profiles, loading, error, sendChatRequest } = useExploreData();

  const handleSendChatRequest = async (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    const result = await sendChatRequest(profileId);
    
    if (result.success) {
      toast({
        title: "Chat Request Sent! 💕",
        description: `Your chat request has been sent to ${profile?.name}. They'll be notified soon!`,
      });
    } else {
      toast({
        title: "Failed to Send Request",
        description: result.error || "Please try again later.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex min-h-screen bg-gray-50 dark:bg-romantic-dark-bg">
          <Sidebar />
          <main className="flex-1 lg:ml-64 p-6">
            <div className="max-w-7xl mx-auto">
              <div className="animate-pulse space-y-8">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1,2,3,4,5,6].map(i => (
                    <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="flex min-h-screen bg-gray-50 dark:bg-romantic-dark-bg">
          <Sidebar />
          <main className="flex-1 lg:ml-64 p-6">
            <div className="max-w-7xl mx-auto">
              <div className="text-center p-8">
                <p className="text-red-500 dark:text-red-400">{error}</p>
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
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Explore Hearts
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Discover meaningful connections with fellow students.
              </p>
            </div>
            
            {profiles.length === 0 ? (
              <div className="text-center p-8 bg-white dark:bg-romantic-dark-card rounded-lg shadow-sm">
                <div className="w-16 h-16 mx-auto mb-4 bg-romantic-light-pink dark:bg-romantic-red/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">💝</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No New Profiles
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  You've seen all available profiles! Check back later for new connections.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {profiles.map((profile) => (
                  <ProfileCard
                    key={profile.id}
                    profile={{
                      id: profile.id,
                      name: profile.name,
                      college: profile.college_name || 'Unknown College',
                      branch: profile.branch || 'Unknown Branch',
                      year: profile.year || 1,
                      hobbies: profile.hobbies || [],
                      interests: [], // Could be added to schema later
                      description: profile.about || 'No description available',
                      relationshipLevel: 1, // Start at level 1 for new connections
                    }}
                    onSendChatRequest={handleSendChatRequest}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </AppLayout>
  );
};

export default Explore;
