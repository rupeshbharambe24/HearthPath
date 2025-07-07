
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, MessageSquare, Star } from 'lucide-react';

interface MemoryEntry {
  id: string;
  type: 'milestone' | 'heart' | 'memory';
  title: string;
  description: string;
  date: string;
  level?: number;
}

interface MemoryTrailProps {
  memories: MemoryEntry[];
  relationshipLevel: number;
}

const MemoryTrail: React.FC<MemoryTrailProps> = ({ memories, relationshipLevel }) => {
  const getMemoryIcon = (type: string) => {
    switch (type) {
      case 'heart':
        return <Heart className="w-4 h-4 text-romantic-red" />;
      case 'milestone':
        return <Star className="w-4 h-4 text-romantic-pink" />;
      default:
        return <MessageSquare className="w-4 h-4 text-romantic-rose" />;
    }
  };

  return (
    <Card className="romantic-card h-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Heart className="w-5 h-5 text-romantic-red" />
          <span>Memory Trail</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {memories.map((memory) => (
            <div key={memory.id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-romantic-dark-card rounded-lg">
              <div className="flex-shrink-0 mt-1">
                {getMemoryIcon(memory.type)}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                  {memory.title}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {memory.description}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  {memory.date}
                </p>
              </div>
            </div>
          ))}
          
          {relationshipLevel >= 4 && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                💕 Your relationship is blossoming! More memories await...
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MemoryTrail;
