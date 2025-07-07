
import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent } from '@/components/ui/card';

const ThemeControls: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [autoEnhance, setAutoEnhance] = useState(true);
  const [previewLevel, setPreviewLevel] = useState(1);

  const levels = [
    { level: 1, name: 'Stranger', color: 'bg-gray-100 dark:bg-gray-700' },
    { level: 2, name: 'Friend', color: 'bg-pink-100 dark:bg-pink-900' },
    { level: 3, name: 'Close', color: 'bg-rose-100 dark:bg-rose-900' },
    { level: 4, name: 'Intimate', color: 'bg-red-100 dark:bg-red-900' },
    { level: 5, name: 'Partner', color: 'bg-red-200 dark:bg-red-800' },
    { level: 6, name: 'Couple', color: 'bg-red-300 dark:bg-red-700' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Theme Mode
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Choose between light and dark theme
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Light</span>
          <Switch
            checked={theme === 'dark'}
            onCheckedChange={toggleTheme}
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">Dark</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Auto-enhance redness
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Automatically enhance romantic colors based on relationship level
          </p>
        </div>
        <Switch
          checked={autoEnhance}
          onCheckedChange={setAutoEnhance}
        />
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Preview at Different Levels
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {levels.map((level) => (
            <Button
              key={level.level}
              variant={previewLevel === level.level ? "default" : "outline"}
              size="sm"
              onClick={() => setPreviewLevel(level.level)}
              className="text-xs"
            >
              Level {level.level}
            </Button>
          ))}
        </div>
        
        <Card className={`transition-all duration-300 ${levels.find(l => l.level === previewLevel)?.color}`}>
          <CardContent className="p-4">
            <div className="text-center">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                {levels.find(l => l.level === previewLevel)?.name} Level Preview
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                This is how your profile and chat background will look at Level {previewLevel}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ThemeControls;
