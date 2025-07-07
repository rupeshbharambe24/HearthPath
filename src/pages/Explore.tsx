
import React from 'react';
import AppLayout from '@/components/AppLayout';
import Sidebar from '@/components/Sidebar';
import ProfileCard from '@/components/ProfileCard';
import { useToast } from '@/hooks/use-toast';

const Explore = () => {
  const { toast } = useToast();

  // Mock profile data
  const profiles = [
    {
      id: '1',
      name: 'Alex Johnson',
      college: 'Stanford University',
      branch: 'Computer Science',
      year: 3,
      hobbies: ['Photography', 'Hiking', 'Cooking'],
      interests: ['Technology', 'Travel', 'Music'],
      description: 'I love exploring new places and capturing moments through my camera. Always up for a good conversation about tech or life!',
      relationshipLevel: 1,
    },
    {
      id: '2',
      name: 'Maya Patel',
      college: 'MIT',
      branch: 'Mechanical Engineering',
      year: 2,
      hobbies: ['Dancing', 'Reading', 'Yoga'],
      interests: ['Innovation', 'Fitness', 'Art'],
      description: 'Passionate about creating solutions that make a difference. I find joy in movement, whether it\'s dancing or yoga.',
      relationshipLevel: 2,
    },
    {
      id: '3',
      name: 'Jordan Lee',
      college: 'Harvard University',
      branch: 'Psychology',
      year: 4,
      hobbies: ['Writing', 'Gaming', 'Volunteering'],
      interests: ['Human Behavior', 'Social Impact', 'Gaming'],
      description: 'Fascinated by the human mind and how we connect with each other. Love gaming and giving back to the community.',
      relationshipLevel: 3,
    },
    {
      id: '4',
      name: 'Sam Rodriguez',
      college: 'UC Berkeley',
      branch: 'Environmental Science',
      year: 3,
      hobbies: ['Surfing', 'Gardening', 'Rock Climbing'],
      interests: ['Sustainability', 'Outdoor Activities', 'Environmental Protection'],
      description: 'Ocean lover and environmental advocate. Happiest when I\'m outdoors connecting with nature.',
      relationshipLevel: 1,
    },
  ];

  const handleSendChatRequest = (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    toast({
      title: "Chat Request Sent! 💕",
      description: `Your chat request has been sent to ${profile?.name}. They'll be notified soon!`,
    });
  };

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
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profiles.map((profile) => (
                <ProfileCard
                  key={profile.id}
                  profile={profile}
                  onSendChatRequest={handleSendChatRequest}
                />
              ))}
            </div>
          </div>
        </main>
      </div>
    </AppLayout>
  );
};

export default Explore;
