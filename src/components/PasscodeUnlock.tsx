
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Unlock, Heart, Sparkles } from 'lucide-react';

interface PasscodeUnlockProps {
  question: string;
  correctAnswer: string;
  lockedContent: {
    type: 'text' | 'image';
    content: string;
  };
  title: string;
}

const PasscodeUnlock: React.FC<PasscodeUnlockProps> = ({
  question,
  correctAnswer,
  lockedContent,
  title
}) => {
  const [userAnswer, setUserAnswer] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showError, setShowError] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleUnlock = () => {
    if (userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()) {
      setIsUnlocked(true);
      setShowError(false);
    } else {
      setShowError(true);
      setAttempts(prev => prev + 1);
      setTimeout(() => setShowError(false), 3000);
    }
  };

  const handleReset = () => {
    setUserAnswer('');
    setIsUnlocked(false);
    setShowError(false);
    setAttempts(0);
  };

  return (
    <Card className="romantic-card max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {isUnlocked ? (
            <Unlock className="w-5 h-5 text-green-500" />
          ) : (
            <Lock className="w-5 h-5 text-gray-500" />
          )}
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {!isUnlocked ? (
          <div className="space-y-4">
            {/* Locked Content Preview */}
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-6 text-center relative">
              <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
                <Lock className="w-12 h-12 text-white" />
              </div>
              <div className="blur-sm">
                {lockedContent.type === 'text' ? (
                  <p className="text-gray-600 dark:text-gray-400">
                    {lockedContent.content.substring(0, 50)}...
                  </p>
                ) : (
                  <div className="w-full h-32 bg-gradient-to-br from-romantic-red/20 to-romantic-pink/20 rounded" />
                )}
              </div>
            </div>
            
            {/* Unlock Question */}
            <div className="text-center space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                🔐 Only the truly close will know...
              </p>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {question}
              </h3>
            </div>
            
            {/* Answer Input */}
            <div className="space-y-3">
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Enter your answer..."
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-romantic-red focus:border-transparent dark:bg-romantic-dark-card dark:text-white"
                onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
              />
              
              {showError && (
                <p className="text-red-500 text-sm text-center animate-pulse">
                  That's not it. Try again! ({attempts} attempts)
                </p>
              )}
              
              <Button 
                onClick={handleUnlock}
                disabled={!userAnswer.trim()}
                className="w-full romantic-btn"
              >
                <Unlock className="w-4 h-4 mr-2" />
                Unlock Memory
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Unlocked Content */}
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center space-x-2 text-green-500">
                <Sparkles className="w-5 h-5" />
                <span className="font-semibold">Memory Unlocked!</span>
                <Sparkles className="w-5 h-5" />
              </div>
              
              <div className="bg-gradient-to-br from-romantic-red/5 to-romantic-pink/5 rounded-lg p-4 border-2 border-romantic-red/20">
                {lockedContent.type === 'text' ? (
                  <p className="text-gray-900 dark:text-white">
                    {lockedContent.content}
                  </p>
                ) : (
                  <img 
                    src={lockedContent.content} 
                    alt="Unlocked memory" 
                    className="w-full rounded-lg"
                  />
                )}
              </div>
              
              <div className="flex items-center justify-center space-x-1 text-romantic-red">
                <Heart className="w-4 h-4" />
                <span className="text-sm">You know them well!</span>
                <Heart className="w-4 h-4" />
              </div>
            </div>
            
            <Button 
              onClick={handleReset}
              variant="outline"
              className="w-full border-romantic-red text-romantic-red hover:bg-romantic-red hover:text-white"
            >
              Lock Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PasscodeUnlock;
