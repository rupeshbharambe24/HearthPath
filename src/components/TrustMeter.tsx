import React from 'react';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Heart } from 'lucide-react';

interface TrustMeterProps {
  trustScore: number;
  maxTrust?: number;
}

const TrustMeter: React.FC<TrustMeterProps> = ({ trustScore, maxTrust = 100 }) => {
  const percentage = (trustScore / maxTrust) * 100;

  const getTrustColor = (score: number) => {
    if (score >= 80) return 'text-romantic-red';
    if (score >= 60) return 'text-romantic-rose';
    if (score >= 40) return 'text-romantic-pink';
    return 'text-gray-500';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <motion.div
            animate={trustScore >= 60 ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Heart className={`w-4 h-4 ${getTrustColor(trustScore)}`} />
          </motion.div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Trust Score
          </span>
        </div>
        <motion.span
          className={`text-sm font-bold ${getTrustColor(trustScore)}`}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3, type: 'spring' }}
        >
          {trustScore}/{maxTrust}
        </motion.span>
      </div>
      <div className="relative">
        <Progress
          value={0}
          className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
        />
        {/* Animated fill overlay */}
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-romantic-pink to-romantic-red"
          initial={{ width: '0%' }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        />
      </div>
    </div>
  );
};

export default TrustMeter;
