
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Lock, Unlock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UnlockCardProps {
  isLocked: boolean;
  children: React.ReactNode;
  className?: string;
}

const UnlockCard: React.FC<UnlockCardProps> = ({ isLocked, children, className }) => {
  return (
    <Card className={cn('romantic-card relative overflow-hidden', className)}>
      {isLocked && (
        <div className="absolute inset-0 backdrop-blur-sm bg-black/10 dark:bg-black/30 z-10 flex items-center justify-center">
          <div className="text-center space-y-2">
            <Lock className="w-8 h-8 text-gray-500 mx-auto" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Locked</p>
          </div>
        </div>
      )}
      
      <CardContent className={cn('p-4', isLocked && 'blur-sm')}>
        {children}
      </CardContent>
      
      {!isLocked && (
        <div className="absolute top-2 right-2">
          <Unlock className="w-4 h-4 text-green-500" />
        </div>
      )}
    </Card>
  );
};

export default UnlockCard;
