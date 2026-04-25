
import React, { useState } from 'react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import PhotoManager from '@/components/PhotoManager';
import LevelPreview from '@/components/LevelPreview';
import EditableField from '@/components/EditableField';
import VerificationStatusCard from '@/components/VerificationStatusCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Camera, Eye } from 'lucide-react';
import { useUserData } from '@/hooks/useUserData';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { aboutSchema, nameSchema } from '@/lib/schemas';

const MyProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [previewLevel, setPreviewLevel] = useState(1);
  const [saving, setSaving] = useState(false);
  const { user, refreshUser } = useAuth();
  const { profile, loading } = useUserData();
  const { toast } = useToast();

  const [userInfo, setUserInfo] = useState({
    name: '',
    college_name: '',
    branch: '',
    year: '',
    hobbies: '',
    about: '',
  });

  // Initialize form data when profile loads
  React.useEffect(() => {
    if (profile) {
      setUserInfo({
        name: profile.name || '',
        college_name: profile.college_name || '',
        branch: profile.branch || '',
        year: profile.year?.toString() || '',
        hobbies: profile.hobbies?.join(', ') || '',
        about: profile.about || '',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user?.id) return;

    const nameResult = nameSchema.safeParse(userInfo.name.trim());
    if (!nameResult.success) {
      toast({
        title: 'Cannot save profile',
        description: nameResult.error.issues[0]?.message || 'Invalid name.',
        variant: 'destructive',
      });
      return;
    }

    const aboutResult = aboutSchema.safeParse(userInfo.about);
    if (!aboutResult.success) {
      toast({
        title: 'Cannot save profile',
        description: aboutResult.error.issues[0]?.message || 'Invalid bio.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);

      const updateData = {
        name: userInfo.name,
        college_name: userInfo.college_name,
        branch: userInfo.branch,
        year: userInfo.year ? parseInt(userInfo.year) : null,
        hobbies: userInfo.hobbies ? userInfo.hobbies.split(',').map(h => h.trim()) : [],
        about: userInfo.about,
      };

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        toast({
          title: "Failed to save profile",
          description: "Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Profile updated! ✨",
        description: "Your changes have been saved successfully.",
      });

      await refreshUser();
      setIsEditing(false);
    } catch (error) {
      console.error('Error in handleSave:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="p-6">
            <div className="max-w-6xl mx-auto">
              <div className="animate-pulse space-y-8">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                My Profile
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your profile and privacy settings
              </p>
            </div>

            {user ? (
              <div className="mb-8">
                <VerificationStatusCard
                  profileCompleteness={user.profileCompleteness}
                  verificationBadges={user.verificationBadges}
                  title="Verification Status"
                  description="Verified access and profile completeness help HeartPath stay college-only and trust-first."
                />
              </div>
            ) : null}

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
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : isEditing ? 'Save' : 'Edit'}
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
                    value={userInfo.college_name}
                    isEditing={isEditing}
                    onChange={(value) => setUserInfo({...userInfo, college_name: value})}
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
                    value={userInfo.about}
                    isEditing={isEditing}
                    onChange={(value) => setUserInfo({...userInfo, about: value})}
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
                  <LevelPreview userInfo={{
                    name: userInfo.name,
                    college: userInfo.college_name,
                    branch: userInfo.branch,
                    year: userInfo.year,
                    hobbies: userInfo.hobbies,
                    aboutMe: userInfo.about
                  }} level={previewLevel} />
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
      </div>
    </AuthenticatedLayout>
  );
};

export default MyProfile;
