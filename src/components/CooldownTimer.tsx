
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface CooldownTimerProps {
  startTime: Date;
  cooldownDays?: number;
}

const CooldownTimer: React.FC<CooldownTimerProps> = ({ startTime, cooldownDays = 7 }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const endTime = new Date(startTime.getTime() + cooldownDays * 24 * 60 * 60 * 1000);
      const now = new Date();
      const difference = endTime.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [startTime, cooldownDays]);

  const isComplete = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  if (isComplete) {
    return (
      <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
        <CardContent className="p-6 text-center">
          <div className="text-4xl mb-2">🎉</div>
          <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
            Cooldown Complete!
          </h3>
          <p className="text-sm text-green-600 dark:text-green-300">
            You can now match with new people again.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border-red-200 dark:border-red-800">
      <CardContent className="p-6">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Cooldown Period
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            You can match again in:
          </p>
        </div>
        
        <div className="grid grid-cols-4 gap-4 text-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
            <div className="text-2xl font-bold text-romantic-red">{timeLeft.days}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Days</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
            <div className="text-2xl font-bold text-romantic-red">{timeLeft.hours}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Hours</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
            <div className="text-2xl font-bold text-romantic-red">{timeLeft.minutes}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Minutes</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
            <div className="text-2xl font-bold text-romantic-red">{timeLeft.seconds}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Seconds</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CooldownTimer;
