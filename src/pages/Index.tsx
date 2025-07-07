
import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import Landing from '@/components/Landing';
import LoginForm from '@/components/LoginForm';
import SignupForm, { SignupData } from '@/components/SignupForm';
import { useToast } from '@/hooks/use-toast';

type AuthState = 'landing' | 'login' | 'signup';

const Index = () => {
  const [authState, setAuthState] = useState<AuthState>('landing');
  const { toast } = useToast();

  const handleLogin = (email: string, password: string) => {
    console.log('Login attempt:', { email, password });
    toast({
      title: "Welcome back! 💖",
      description: "You've successfully signed in to CampusHeart.",
    });
    // Here you would typically handle the actual login logic
  };

  const handleSignup = (data: SignupData) => {
    console.log('Signup attempt:', data);
    toast({
      title: "Welcome to CampusHeart! 🎉",
      description: "Your account has been created successfully.",
    });
    // Here you would typically handle the actual signup logic
  };

  const renderContent = () => {
    switch (authState) {
      case 'login':
        return (
          <LoginForm 
            onSubmit={handleLogin}
            onSwitchToSignup={() => setAuthState('signup')}
          />
        );
      case 'signup':
        return (
          <SignupForm 
            onSubmit={handleSignup}
            onSwitchToLogin={() => setAuthState('login')}
          />
        );
      default:
        return (
          <Landing 
            onSignIn={() => setAuthState('login')}
            onSignUp={() => setAuthState('signup')}
          />
        );
    }
  };

  return (
    <AppLayout>
      {renderContent()}
    </AppLayout>
  );
};

export default Index;
