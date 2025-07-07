
import React from 'react';
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
          <Heart className={`w-4 h-4 ${getTrustColor(trustScore)}`} />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Trust Score
          </span>
        </div>
        <span className={`text-sm font-bold ${getTrustColor(trustScore)}`}>
          {trustScore}/{maxTrust}
        </span>
      </div>
      <Progress 
        value={percentage} 
        className="h-2 bg-gray-200 dark:bg-gray-700"
      />
    </div>
  );
};

export default TrustMeter;
