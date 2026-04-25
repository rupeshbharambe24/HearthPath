import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import ProfileCard from '@/components/ProfileCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useExploreData } from '@/hooks/useExploreData';
import { buildVisibleProfile } from '@/lib/heartpath';
import { fadeUp, staggerContainer, cardVariants, scaleIn } from '@/lib/animations';
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
        description: `${profile?.name || 'This profile'} has been removed from today's curated batch.`,
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
      <AuthenticatedLayout>
        <div className="p-6">
          <div className="mx-auto max-w-7xl">
            <div className="space-y-8 animate-pulse">
              <div className="h-8 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <div key={item} className="h-64 rounded-2xl bg-gray-200 dark:bg-gray-700" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (error) {
    return (
      <AuthenticatedLayout>
        <div className="p-6">
          <div className="mx-auto max-w-7xl">
            <div className="p-8 text-center">
              <p className="text-red-500 dark:text-red-400">{error}</p>
            </div>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="p-6">
        <div className="mx-auto max-w-7xl">
          <motion.div className="mb-8" variants={fadeUp} initial="initial" animate="animate">
            <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">Explore HeartPath</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Discovery is curated on purpose. HeartPath shows a few aligned people each day instead of endless browsing.
            </p>
          </motion.div>

          <motion.div
            className="mb-6 grid gap-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white p-4 shadow-sm dark:bg-romantic-dark-card lg:grid-cols-[1fr_auto_auto]"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
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
          </motion.div>

          {discoveryLocked ? (
            <motion.div
              className="rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-romantic-dark-card"
              variants={scaleIn}
              initial="initial"
              animate="animate"
            >
              <motion.div
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-romantic-light-pink dark:bg-romantic-red/20"
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <span className="text-sm font-semibold text-romantic-red">Lock</span>
              </motion.div>
              <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Discovery Locked</h3>
              <p className="text-gray-500 dark:text-gray-400">
                You are already in an exclusive HeartPath. New discovery becomes available again only if that
                relationship leaves exclusivity.
              </p>
            </motion.div>
          ) : profiles.length === 0 ? (
            <motion.div
              className="rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-romantic-dark-card"
              variants={scaleIn}
              initial="initial"
              animate="animate"
            >
              <motion.div
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-romantic-light-pink dark:bg-romantic-red/20"
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <span className="text-sm font-semibold text-romantic-red">Open</span>
              </motion.div>
              <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">No New Profiles</h3>
              <p className="text-gray-500 dark:text-gray-400">
                You have already worked through the current curated batch. Check back later for new, higher-quality
                introductions.
              </p>
            </motion.div>
          ) : (
            <motion.div
              className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              <AnimatePresence mode="popLayout">
                {profiles.map((profile) => {
                  const visibleProfile = buildVisibleProfile(profile, 1, []);
                  // buildVisibleProfile no longer ships photo paths — only a
                  // has<Level>Photo signal. The signed-URL hook fetches the
                  // actual asset; cross-user authorization is enforced
                  // server-side in viewer_can_see_photo_level.
                  const hasLevelOnePhoto = visibleProfile.hasLevelOnePhoto;

                  return (
                    <motion.div
                      key={profile.id}
                      variants={cardVariants}
                      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.25 } }}
                      layout
                    >
                      <ProfileCard
                        profile={{
                          id: profile.id,
                          name: visibleProfile.name,
                          college: visibleProfile.college,
                          branch: visibleProfile.branch,
                          year: visibleProfile.year,
                          hobbies: visibleProfile.hobbies,
                          description: visibleProfile.about,
                          relationshipLevel: 1,
                          photoLevel: 1,
                          hasPhoto: hasLevelOnePhoto,
                          galleryCount: visibleProfile.galleryPhotoCount,
                          compatibilityScore: profile.compatibility.score,
                          scoreBand: profile.compatibility.scoreBand,
                          reasons: profile.compatibility.reasons,
                          seriousnessSignals: profile.seriousnessSignals,
                          sharedValues: profile.compatibility.sharedValues,
                        }}
                        onSendChatRequest={handleSendChatRequest}
                        onDismiss={handleDismissSuggestion}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
};

export default Explore;
