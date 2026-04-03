
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, EyeOff } from 'lucide-react';
import { buildVisibleProfile, getStageDescription, getStageName } from '@/lib/heartpath';

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
  const visibleProfile = buildVisibleProfile(
    {
      name: userInfo.name,
      college_name: userInfo.college,
      branch: userInfo.branch,
      year: userInfo.year ? Number(userInfo.year) : null,
      hobbies: userInfo.hobbies ? userInfo.hobbies.split(',').map((hobby) => hobby.trim()).filter(Boolean) : [],
      about: userInfo.aboutMe,
    },
    level,
    []
  );

  const visibleInfo = {
    name: visibleProfile.name,
    college: visibleProfile.college,
    branch: visibleProfile.branch,
    year: visibleProfile.year ? String(visibleProfile.year) : 'Hidden until deeper trust',
    hobbies: visibleProfile.hobbies.length ? visibleProfile.hobbies.join(', ') : 'Hidden until deeper trust',
    aboutMe: visibleProfile.about,
  };
  const hiddenKeysByLevel = level >= 5 ? [] : level >= 4 ? ['aboutMe'] : level >= 3 ? ['hobbies', 'aboutMe'] : level >= 2 ? ['branch', 'hobbies', 'aboutMe'] : ['year', 'branch', 'hobbies', 'aboutMe'];
  const hiddenFields = Object.keys(userInfo).filter((key) => hiddenKeysByLevel.includes(key));

  return (
    <div className="space-y-4">
      <Card className="border border-romantic-red/20 bg-romantic-light-pink/40 dark:bg-romantic-red/10">
        <CardContent className="p-4">
          <h3 className="font-semibold text-romantic-red mb-1">
            Level {level}: {getStageName(level)}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {getStageDescription(level)}
          </p>
        </CardContent>
      </Card>

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
