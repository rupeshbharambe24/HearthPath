
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import UploadInput from './UploadInput';

interface SignupFormProps {
  onSubmit: (data: SignupData) => void;
  onSwitchToLogin: () => void;
}

export interface SignupData {
  name: string;
  email: string;
  college: string;
  branch: string;
  year: string;
  password: string;
  photo: File | null;
}

const SignupForm: React.FC<SignupFormProps> = ({ onSubmit, onSwitchToLogin }) => {
  const [formData, setFormData] = useState<SignupData>({
    name: '',
    email: '',
    college: '',
    branch: '',
    year: '',
    password: '',
    photo: null
  });
  const [photoPreview, setPhotoPreview] = useState<string>('');

  const handleInputChange = (field: keyof SignupData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoSelect = (file: File) => {
    setFormData(prev => ({ ...prev, photo: file }));
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl romantic-card">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-romantic-red to-romantic-pink rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">💖</span>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-romantic-red to-romantic-pink bg-clip-text text-transparent">
            Join CampusHeart
          </CardTitle>
          <CardDescription>
            Create your profile and start connecting
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
                <Label htmlFor="email">College Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@college.edu"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  className="rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="college">College Name</Label>
                <Input
                  id="college"
                  placeholder="University/College name"
                  value={formData.college}
                  onChange={(e) => handleInputChange('college', e.target.value)}
                  required
                  className="rounded-lg"
                />
              </div>
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">Academic Year</Label>
                <Select onValueChange={(value) => handleInputChange('year', value)}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="freshman">Freshman</SelectItem>
                    <SelectItem value="sophomore">Sophomore</SelectItem>
                    <SelectItem value="junior">Junior</SelectItem>
                    <SelectItem value="senior">Senior</SelectItem>
                    <SelectItem value="graduate">Graduate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                  className="rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Profile Photo</Label>
              <UploadInput
                onFileSelect={handlePhotoSelect}
                preview={photoPreview}
              />
            </div>

            <Button type="submit" className="w-full romantic-btn">
              Create Account
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <button
                onClick={onSwitchToLogin}
                className="text-romantic-red hover:text-romantic-rose font-medium"
              >
                Sign In
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignupForm;
