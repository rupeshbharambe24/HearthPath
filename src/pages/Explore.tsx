import React from 'react';
import AppLayout from '@/components/AppLayout';
import Sidebar from '@/components/Sidebar';
import ProfileCard from '@/components/ProfileCard';
import { useToast } from '@/hooks/use-toast';
import { useExploreData } from '@/hooks/useExploreData';
import { buildVisibleProfile } from '@/lib/heartpath';

const Explore = () => {
  const { toast } = useToast();
  const { profiles, loading, error, discoveryLocked, sendChatRequest } = useExploreData();

  const handleSendChatRequest = async (profileId: string) => {
    const profile = profiles.find((candidate) => candidate.id === profileId);
    const result = await sendChatRequest(profileId);

    if (result.success) {
      toast({
        title: 'HeartPath invitation sent',
        description: `Your request has been sent to ${profile?.name}. The path begins only if they accept it too.`,
      });
    } else {
      toast({
        title: 'Failed to send request',
        description: result.error || 'Please try again later.',
        variant: 'destructive',
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
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((item) => (
                    <div key={item} className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Explore HeartPath</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Discover people gently. HeartPath opens deeper layers only when both people are ready.
              </p>
            </div>

            {discoveryLocked ? (
              <div className="text-center p-8 bg-white dark:bg-romantic-dark-card rounded-lg shadow-sm">
                <div className="w-16 h-16 mx-auto mb-4 bg-romantic-light-pink dark:bg-romantic-red/20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-romantic-red">Lock</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Discovery Locked</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  You are already in an exclusive HeartPath. New discovery becomes available again only if that
                  relationship leaves exclusivity.
                </p>
              </div>
            ) : profiles.length === 0 ? (
              <div className="text-center p-8 bg-white dark:bg-romantic-dark-card rounded-lg shadow-sm">
                <div className="w-16 h-16 mx-auto mb-4 bg-romantic-light-pink dark:bg-romantic-red/20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-romantic-red">Open</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No New Profiles</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  You&apos;ve already seen the currently available profiles. Check back later for new connections.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {profiles.map((profile) => {
                  const visibleProfile = buildVisibleProfile(profile, 1, []);

                  return (
                    <ProfileCard
                      key={profile.id}
                      profile={{
                        id: profile.id,
                        name: visibleProfile.name,
                        college: visibleProfile.college,
                        branch: visibleProfile.branch,
                        year: visibleProfile.year,
                        hobbies: visibleProfile.hobbies,
                        description: visibleProfile.about,
                        relationshipLevel: 1,
                        photoUrl: visibleProfile.levelOnePhoto || visibleProfile.fullFacePhoto,
                        galleryCount: visibleProfile.privateGallery.length,
                      }}
                      onSendChatRequest={handleSendChatRequest}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </AppLayout>
  );
};

export default Explore;
