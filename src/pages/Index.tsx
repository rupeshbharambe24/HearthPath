
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import Landing from '@/components/Landing';
import LoginForm from '@/components/LoginForm';
import SignupForm, { SignupData } from '@/components/SignupForm';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

type AuthState = 'landing' | 'login' | 'signup';

const Index = () => {
  const [authState, setAuthState] = useState<AuthState>('landing');
  const { login, signup, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = (email: string, password: string) => {
    console.log('Login attempt:', { email, password });
    login(email, password);
    toast({
      title: "Welcome back! 💖",
      description: "You've successfully signed in to CampusHeart.",
    });
  };

  const handleSignup = (data: SignupData) => {
    console.log('Signup attempt:', data);
    signup(data);
    toast({
      title: "Welcome to CampusHeart! 🎉",
      description: "Your account has been created successfully.",
    });
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
