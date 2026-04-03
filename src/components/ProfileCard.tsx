import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Heart, Sparkles } from 'lucide-react';
import RelationshipBadge from './RelationshipBadge';

interface ProfileCardProps {
  profile: {
    id: string;
    name: string;
    college: string;
    branch: string;
    year: number | null;
    hobbies: string[];
    description: string;
    relationshipLevel: number;
    photoUrl?: string;
    galleryCount?: number;
  };
  onSendChatRequest: (profileId: string) => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile, onSendChatRequest }) => {
  return (
    <Card className="romantic-card overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="aspect-[4/3] bg-gradient-to-br from-romantic-light-pink via-white to-rose-100 dark:from-romantic-red/20 dark:via-romantic-dark-card dark:to-romantic-pink/20">
        {profile.photoUrl ? (
          <img src={profile.photoUrl} alt={profile.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <div className="text-center px-6">
              <div className="w-14 h-14 mx-auto rounded-full bg-white/70 dark:bg-romantic-red/20 flex items-center justify-center mb-3">
                <Heart className="w-6 h-6 text-romantic-red" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                HeartPath starts with a level-one glimpse.
              </p>
            </div>
          </div>
        )}
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{profile.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {profile.college} • {profile.branch}
              {profile.year ? ` • Year ${profile.year}` : ''}
            </p>
          </div>
          <RelationshipBadge level={profile.relationshipLevel} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">What you can see now</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{profile.description}</p>
        </div>

        <div>
          <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Shared interests</h4>
          <div className="flex flex-wrap gap-2">
            {profile.hobbies.length > 0 ? (
              profile.hobbies.map((hobby) => (
                <span
                  key={hobby}
                  className="px-2 py-1 bg-romantic-light-pink dark:bg-romantic-dark-card text-romantic-red dark:text-romantic-pink text-xs rounded-full"
                >
                  {hobby}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                More interests open up as mutual trust grows.
              </span>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-romantic-red/15 bg-romantic-light-pink/40 dark:bg-romantic-red/10 px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
          <div className="flex items-center gap-2 font-medium text-romantic-red mb-1">
            <Sparkles className="w-4 h-4" />
            <span>HeartPath reveal model</span>
          </div>
          <p>
            Start with a gentle first look. Deeper profile details and private galleries unlock only with mutual
            consent.
          </p>
        </div>

        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <Button onClick={() => onSendChatRequest(profile.id)} className="w-full romantic-btn flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            <span>Invite To HeartPath</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileCard;
