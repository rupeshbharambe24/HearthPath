import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getStageName } from '@/lib/heartpath';
import { getLevelPulse } from '@/lib/animations';

interface LevelTagBadgeProps {
  level: number;
}

const LevelTagBadge: React.FC<LevelTagBadgeProps> = ({ level }) => {
  const getLevelColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 2: return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      case 3: return 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200';
      case 4: return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 5: return 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100';
      case 6: return 'bg-red-300 text-red-900 dark:bg-red-700 dark:text-red-100';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const pulseVariants = getLevelPulse(level);

  return (
    <motion.div
      variants={pulseVariants}
      initial="initial"
      animate="animate"
      className="inline-block"
    >
      <Badge className={cn('text-xs font-medium transition-all duration-300', getLevelColor(level))}>
        Level {level}: {getStageName(level)}
      </Badge>
    </motion.div>
  );
};

export default LevelTagBadge;
