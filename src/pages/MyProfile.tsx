
import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import Sidebar from '@/components/Sidebar';
import PhotoManager from '@/components/PhotoManager';
import LevelPreview from '@/components/LevelPreview';
import EditableField from '@/components/EditableField';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Camera, Eye } from 'lucide-react';

const MyProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [previewLevel, setPreviewLevel] = useState(1);
  const [userInfo, setUserInfo] = useState({
    name: 'Alex Johnson',
    college: 'Stanford University',
    branch: 'Computer Science',
    year: 'Junior',
    hobbies: 'Photography, Reading, Hiking',
    aboutMe: 'Love exploring new places and meeting interesting people. Always up for deep conversations over coffee.',
  });

  const handleSave = () => {
    setIsEditing(false);
    // Here you would typically save to backend
    console.log('Profile saved:', userInfo);
  };

  return (
    <AppLayout>
      <div className="flex min-h-screen bg-gray-50 dark:bg-romantic-dark-bg">
        <Sidebar />
        <main className="flex-1 lg:ml-64 p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                My Profile
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your profile and privacy settings
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Profile Information */}
              <Card className="romantic-card">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <User className="w-5 h-5" />
                      <span>Profile Information</span>
                    </div>
                    <Button
                      onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                      className="romantic-btn text-sm"
                    >
                      {isEditing ? 'Save' : 'Edit'}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <EditableField
                    label="Name"
                    value={userInfo.name}
                    isEditing={isEditing}
                    onChange={(value) => setUserInfo({...userInfo, name: value})}
                  />
                  <EditableField
                    label="College"
                    value={userInfo.college}
                    isEditing={isEditing}
                    onChange={(value) => setUserInfo({...userInfo, college: value})}
                  />
                  <EditableField
                    label="Branch"
                    value={userInfo.branch}
                    isEditing={isEditing}
                    onChange={(value) => setUserInfo({...userInfo, branch: value})}
                  />
                  <EditableField
                    label="Year"
                    value={userInfo.year}
                    isEditing={isEditing}
                    onChange={(value) => setUserInfo({...userInfo, year: value})}
                  />
                  <EditableField
                    label="Hobbies"
                    value={userInfo.hobbies}
                    isEditing={isEditing}
                    onChange={(value) => setUserInfo({...userInfo, hobbies: value})}
                    multiline
                  />
                  <EditableField
                    label="About Me"
                    value={userInfo.aboutMe}
                    isEditing={isEditing}
                    onChange={(value) => setUserInfo({...userInfo, aboutMe: value})}
                    multiline
                  />
                </CardContent>
              </Card>

              {/* Level Preview */}
              <Card className="romantic-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Eye className="w-5 h-5" />
                    <span>Privacy Simulator</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">
                      Preview as Level:
                    </label>
                    <select 
                      value={previewLevel}
                      onChange={(e) => setPreviewLevel(Number(e.target.value))}
                      className="w-full p-2 border rounded-lg dark:bg-romantic-dark-card dark:border-gray-600"
                    >
                      {[1,2,3,4,5,6].map(level => (
                        <option key={level} value={level}>Level {level}</option>
                      ))}
                    </select>
                  </div>
                  <LevelPreview userInfo={userInfo} level={previewLevel} />
                </CardContent>
              </Card>
            </div>

            {/* Photo Manager */}
            <Card className="romantic-card mt-8">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Camera className="w-5 h-5" />
                  <span>Photo Management</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PhotoManager />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AppLayout>
  );
};

export default MyProfile;
