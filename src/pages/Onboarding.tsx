
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import UploadInput from '@/components/UploadInput';
import { Heart } from 'lucide-react';

const Onboarding = () => {
  const [formData, setFormData] = useState({
    name: '',
    college_name: '',
    branch: '',
    year: '',
    about: '',
    hobbies: [] as string[],
    photo: null as File | null
  });
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const hobbyOptions = [
    'Reading', 'Gaming', 'Music', 'Sports', 'Art', 'Cooking', 'Travel', 
    'Photography', 'Dancing', 'Writing', 'Movies', 'Fitness', 'Technology'
  ];

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleHobbyToggle = (hobby: string) => {
    setFormData(prev => ({
      ...prev,
      hobbies: prev.hobbies.includes(hobby)
        ? prev.hobbies.filter(h => h !== hobby)
        : [...prev.hobbies, hobby]
    }));
  };

  const handlePhotoSelect = (file: File) => {
    setFormData(prev => ({ ...prev, photo: file }));
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadPhoto = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/level_1.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file, {
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
      }

      const { data } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    
    try {
      let photoUrl = null;
      
      // Upload photo if provided
      if (formData.photo) {
        photoUrl = await uploadPhoto(formData.photo);
        if (!photoUrl) {
          toast({
            title: "Photo upload failed",
            description: "Please try uploading your photo again.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
      }

      // Update user profile
      const { error } = await supabase
        .from('users')
        .update({
          name: formData.name,
          college_name: formData.college_name,
          branch: formData.branch,
          year: parseInt(formData.year),
          about: formData.about,
          hobbies: formData.hobbies,
          photo_levels: photoUrl ? { level_1: photoUrl } : {}
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Welcome to CampusHeart! 💖",
        description: "Your profile has been set up successfully.",
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Profile setup failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-romantic-light-pink to-white dark:from-romantic-dark-bg dark:to-gray-900 p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="romantic-card">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-romantic-red to-romantic-pink rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-romantic-red to-romantic-pink bg-clip-text text-transparent">
              Complete Your Profile
            </CardTitle>
            <CardDescription>
              Let's set up your CampusHeart profile to help you find meaningful connections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="college_name">College Name</Label>
                  <Input
                    id="college_name"
                    placeholder="Your college/university"
                    value={formData.college_name}
                    onChange={(e) => handleInputChange('college_name', e.target.value)}
                    required
                    className="rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="branch">Branch/Major</Label>
                  <Input
                    id="branch"
                    placeholder="Computer Science, etc."
                    value={formData.branch}
                    onChange={(e) => handleInputChange('branch', e.target.value)}
                    required
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Academic Year</Label>
                  <Select onValueChange={(value) => handleInputChange('year', value)}>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1st Year</SelectItem>
                      <SelectItem value="2">2nd Year</SelectItem>
                      <SelectItem value="3">3rd Year</SelectItem>
                      <SelectItem value="4">4th Year</SelectItem>
                      <SelectItem value="5">Graduate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="about">About Me</Label>
                <Textarea
                  id="about"
                  placeholder="Tell others about yourself, your interests, and what you're looking for..."
                  value={formData.about}
                  onChange={(e) => handleInputChange('about', e.target.value)}
                  className="rounded-lg min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Hobbies & Interests</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {hobbyOptions.map((hobby) => (
                    <button
                      key={hobby}
                      type="button"
                      onClick={() => handleHobbyToggle(hobby)}
                      className={`p-2 text-sm rounded-lg border transition-colors ${
                        formData.hobbies.includes(hobby)
                          ? 'bg-romantic-red text-white border-romantic-red'
                          : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-romantic-red'
                      }`}
                    >
                      {hobby}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Profile Photo (Level 1 - Anonymous)</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Upload a photo that doesn't show your face - this will be visible to everyone at Level 1
                </p>
                <UploadInput
                  onFileSelect={handlePhotoSelect}
                  preview={photoPreview}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full romantic-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Setting up your profile...' : 'Complete Profile & Start Connecting'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;
