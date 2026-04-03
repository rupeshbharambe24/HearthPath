
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getStageName } from '@/lib/heartpath';

interface RelationshipBadgeProps {
  level: number;
  className?: string;
}

const RelationshipBadge: React.FC<RelationshipBadgeProps> = ({ level, className }) => {
  const getLevelConfig = (level: number) => {
    const configs = {
      1: { name: 'Stranger', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
      2: { name: 'Acquaintance', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300' },
      3: { name: 'Friend', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300' },
      4: { name: 'Close Friend', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
      5: { name: 'Romantic Interest', color: 'bg-romantic-red text-white' },
      6: { name: 'Exclusive', color: 'bg-gradient-to-r from-romantic-red to-romantic-pink text-white' },
    };
    return configs[level as keyof typeof configs] || {
      name: getStageName(level),
      color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    };
  };

  const config = getLevelConfig(level);

  return (
    <Badge 
      className={cn(
        "px-3 py-1 text-xs font-medium rounded-full border-0",
        config.color,
        className
      )}
    >
      Level {level}: {config.name}
    </Badge>
  );
};

export default RelationshipBadge;
