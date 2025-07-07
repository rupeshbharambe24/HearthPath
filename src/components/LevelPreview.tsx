
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, EyeOff } from 'lucide-react';

interface LevelPreviewProps {
  userInfo: {
    name: string;
    college: string;
    branch: string;
    year: string;
    hobbies: string;
    aboutMe: string;
  };
  level: number;
}

const LevelPreview: React.FC<LevelPreviewProps> = ({ userInfo, level }) => {
  const getVisibleInfo = () => {
    const base = { name: userInfo.name, college: userInfo.college };
    
    if (level >= 2) Object.assign(base, { year: userInfo.year });
    if (level >= 3) Object.assign(base, { branch: userInfo.branch });
    if (level >= 4) Object.assign(base, { hobbies: userInfo.hobbies });
    if (level >= 5) Object.assign(base, { aboutMe: userInfo.aboutMe });
    
    return base;
  };

  const visibleInfo = getVisibleInfo();
  const hiddenFields = Object.keys(userInfo).filter(key => !(key in visibleInfo));

  return (
    <div className="space-y-4">
      <Card className="border border-romantic-red/20">
        <CardContent className="p-4">
          <h3 className="font-semibold text-romantic-red mb-3">Visible Information</h3>
          {Object.entries(visibleInfo).map(([key, value]) => (
            <div key={key} className="flex items-center space-x-2 mb-2">
              <Eye className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
              <span className="text-sm">{value}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {hiddenFields.length > 0 && (
        <Card className="border border-gray-300 dark:border-gray-600">
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-500 mb-3">Hidden Information</h3>
            {hiddenFields.map((field) => (
              <div key={field} className="flex items-center space-x-2 mb-2">
                <EyeOff className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium capitalize text-gray-400">
                  {field.replace(/([A-Z])/g, ' $1')}: ••••••
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LevelPreview;
