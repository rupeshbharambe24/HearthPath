
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Heart } from 'lucide-react';
import RelationshipBadge from './RelationshipBadge';

interface ProfileCardProps {
  profile: {
    id: string;
    name: string;
    college: string;
    branch: string;
    year: number;
    hobbies: string[];
    interests: string[];
    description: string;
    relationshipLevel: number;
  };
  onSendChatRequest: (profileId: string) => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile, onSendChatRequest }) => {
  return (
    <Card className="romantic-card hover:shadow-xl transition-all duration-300 transform hover:scale-105">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              {profile.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {profile.college} • {profile.branch} • Year {profile.year}
            </p>
          </div>
          <RelationshipBadge level={profile.relationshipLevel} />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Description */}
        <div>
          <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">About Me</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {profile.description}
          </p>
        </div>

        {/* Hobbies */}
        <div>
          <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Hobbies</h4>
          <div className="flex flex-wrap gap-2">
            {profile.hobbies.map((hobby, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-romantic-light-pink dark:bg-romantic-dark-card text-romantic-red dark:text-romantic-pink text-xs rounded-full"
              >
                {hobby}
              </span>
            ))}
          </div>
        </div>

        {/* Interests */}
        <div>
          <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Interests</h4>
          <div className="flex flex-wrap gap-2">
            {profile.interests.map((interest, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={() => onSendChatRequest(profile.id)}
            className="w-full romantic-btn flex items-center space-x-2"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Send Chat Request</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileCard;
