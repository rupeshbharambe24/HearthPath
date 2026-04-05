import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Heart, ShieldCheck, Sparkles, X } from 'lucide-react';
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
    compatibilityScore: number;
    scoreBand: string;
    reasons: string[];
    seriousnessSignals: string[];
    sharedValues: string[];
  };
  onSendChatRequest: (profileId: string) => void;
  onDismiss: (profileId: string) => void;
}

const scoreBandStyles: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200',
  good: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-200',
  strong: 'bg-romantic-light-pink text-romantic-red dark:bg-romantic-red/20 dark:text-romantic-pink',
  excellent: 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-200',
};

const ProfileCard: React.FC<ProfileCardProps> = ({ profile, onSendChatRequest, onDismiss }) => {
  const sharedTraits = profile.sharedValues.length > 0 ? profile.sharedValues : profile.hobbies;

  return (
    <Card className="romantic-card overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="aspect-[4/3] bg-gradient-to-br from-romantic-light-pink via-white to-rose-100 dark:from-romantic-red/20 dark:via-romantic-dark-card dark:to-romantic-pink/20">
        {profile.photoUrl ? (
          <img src={profile.photoUrl} alt={profile.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="px-6 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/70 dark:bg-romantic-red/20">
                <Heart className="h-6 w-6 text-romantic-red" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">HeartPath starts with a level-one glimpse.</p>
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
          <div className="space-y-2 text-right">
            <RelationshipBadge level={profile.relationshipLevel} />
            <Badge className={scoreBandStyles[profile.scoreBand] || scoreBandStyles.good}>
              {profile.compatibilityScore}% match
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <h4 className="mb-2 font-medium text-gray-800 dark:text-gray-200">Why HeartPath chose this person</h4>
          <div className="space-y-2">
            {profile.reasons.map((reason) => (
              <p key={reason} className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {reason}
              </p>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-2 font-medium text-gray-800 dark:text-gray-200">What you can see now</h4>
          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">{profile.description}</p>
        </div>

        <div>
          <h4 className="mb-2 font-medium text-gray-800 dark:text-gray-200">Shared alignment</h4>
          <div className="flex flex-wrap gap-2">
            {sharedTraits.length > 0 ? (
              sharedTraits.map((trait) => (
                <span
                  key={trait}
                  className="rounded-full bg-romantic-light-pink px-2 py-1 text-xs text-romantic-red dark:bg-romantic-dark-card dark:text-romantic-pink"
                >
                  {trait}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Shared values and interests become clearer as both profiles deepen.
              </span>
            )}
          </div>
        </div>

        <div>
          <h4 className="mb-2 font-medium text-gray-800 dark:text-gray-200">Seriousness signals</h4>
          <div className="flex flex-wrap gap-2">
            {profile.seriousnessSignals.length > 0 ? (
              profile.seriousnessSignals.map((signal) => (
                <Badge key={signal} variant="outline" className="border-romantic-red/30 text-romantic-red">
                  <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                  {signal}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                More seriousness signals unlock once they complete their HeartPath.
              </span>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-romantic-red/15 bg-romantic-light-pink/40 px-3 py-2 text-sm text-gray-700 dark:bg-romantic-red/10 dark:text-gray-300">
          <div className="mb-1 flex items-center gap-2 font-medium text-romantic-red">
            <Sparkles className="h-4 w-4" />
            <span>HeartPath reveal model</span>
          </div>
          <p>
            Start with a gentle first look. Deeper profile details, galleries, and richer closeness unlock only with
            mutual trust.
          </p>
        </div>

        <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
          <div className="flex gap-2">
            <Button onClick={() => onSendChatRequest(profile.id)} className="romantic-btn flex flex-1 items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span>Invite To HeartPath</span>
            </Button>
            <Button variant="outline" onClick={() => onDismiss(profile.id)} className="px-4" aria-label="Dismiss suggestion">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileCard;
