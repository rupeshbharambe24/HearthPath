
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    // Create SignupData object with minimal info for now
    const signupData: SignupData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      college: '', // Will be filled in onboarding
      branch: '', // Will be filled in onboarding
      year: '', // Will be filled in onboarding
      photo: null // Will be filled in onboarding
    };

    onSubmit(signupData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md romantic-card">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-romantic-red to-romantic-pink rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">💖</span>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-romantic-red to-romantic-pink bg-clip-text text-transparent">
            Join HeartPath
          </CardTitle>
          <CardDescription>
            Use your approved college email to begin verified access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 rounded-xl border border-romantic-pink/30 bg-romantic-light-pink/60 p-3 text-sm text-gray-700 dark:border-romantic-red/20 dark:bg-romantic-red/10 dark:text-gray-200">
            HeartPath is currently limited to approved college email domains. You will verify your email before the app unlocks.
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                required
                className="rounded-lg"
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
