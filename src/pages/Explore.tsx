import React from 'react';
import AppLayout from '@/components/AppLayout';
import Sidebar from '@/components/Sidebar';
import ProfileCard from '@/components/ProfileCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useExploreData } from '@/hooks/useExploreData';
import { buildVisibleProfile } from '@/lib/heartpath';
import type { DiscoveryMode } from '@/lib/compatibility';

const Explore = () => {
  const { toast } = useToast();
  const {
    profiles,
    loading,
    error,
    discoveryLocked,
    discoveryMode,
    invitationsRemaining,
    sendChatRequest,
    dismissSuggestion,
    updateDiscoveryMode,
  } = useExploreData();

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

  const handleDismissSuggestion = async (profileId: string) => {
    const profile = profiles.find((candidate) => candidate.id === profileId);
    const result = await dismissSuggestion(profileId);

    if (result.success) {
      toast({
        title: 'Suggestion cleared',
        description: `${profile?.name || 'This profile'} has been removed from today’s curated batch.`,
      });
    } else {
      toast({
        title: 'Unable to update suggestions',
        description: result.error || 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const handleModeChange = async (mode: DiscoveryMode) => {
    const result = await updateDiscoveryMode(mode);
    if (!result.success) {
      toast({
        title: 'Unable to change discovery mode',
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
          <main className="flex-1 p-6 lg:ml-64">
            <div className="mx-auto max-w-7xl">
              <div className="space-y-8 animate-pulse">
                <div className="h-8 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((item) => (
                    <div key={item} className="h-64 rounded bg-gray-200 dark:bg-gray-700" />
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
          <main className="flex-1 p-6 lg:ml-64">
            <div className="mx-auto max-w-7xl">
              <div className="p-8 text-center">
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
        <main className="flex-1 p-6 lg:ml-64">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8">
              <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">Explore HeartPath</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Discovery is curated on purpose. HeartPath shows a few aligned people each day instead of endless browsing.
              </p>
            </div>

            <div className="mb-6 grid gap-4 rounded-2xl border border-romantic-pink/20 bg-white p-4 shadow-sm dark:border-romantic-red/10 dark:bg-romantic-dark-card lg:grid-cols-[1fr_auto_auto]">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Curated daily mode</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Choose the type of connection energy HeartPath should prioritize today.
                </p>
              </div>
              <div className="min-w-[220px]">
                <Select value={discoveryMode} onValueChange={(value) => void handleModeChange(value as DiscoveryMode)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pick discovery mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="friendship_first">Friendship First</SelectItem>
                    <SelectItem value="slow_burn">Slow Burn</SelectItem>
                    <SelectItem value="serious_only">Serious Only</SelectItem>
                    <SelectItem value="same_campus">Same Campus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-end">
                <Badge className="bg-romantic-red text-white">{invitationsRemaining} invites left today</Badge>
              </div>
            </div>

            {discoveryLocked ? (
              <div className="rounded-lg bg-white p-8 text-center shadow-sm dark:bg-romantic-dark-card">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-romantic-light-pink dark:bg-romantic-red/20">
                  <span className="text-sm font-semibold text-romantic-red">Lock</span>
                </div>
                <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Discovery Locked</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  You are already in an exclusive HeartPath. New discovery becomes available again only if that
                  relationship leaves exclusivity.
                </p>
              </div>
            ) : profiles.length === 0 ? (
              <div className="rounded-lg bg-white p-8 text-center shadow-sm dark:bg-romantic-dark-card">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-romantic-light-pink dark:bg-romantic-red/20">
                  <span className="text-sm font-semibold text-romantic-red">Open</span>
                </div>
                <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">No New Profiles</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  You have already worked through the current curated batch. Check back later for new, higher-quality
                  introductions.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                        compatibilityScore: profile.compatibility.score,
                        scoreBand: profile.compatibility.scoreBand,
                        reasons: profile.compatibility.reasons,
                        seriousnessSignals: profile.seriousnessSignals,
                        sharedValues: profile.compatibility.sharedValues,
                      }}
                      onSendChatRequest={handleSendChatRequest}
                      onDismiss={handleDismissSuggestion}
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
