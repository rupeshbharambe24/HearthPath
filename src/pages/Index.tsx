
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import Landing from '@/components/Landing';
import LoginForm from '@/components/LoginForm';
import SignupForm, { SignupData } from '@/components/SignupForm';
import { useAuth } from '@/contexts/AuthContext';

type AuthState = 'landing' | 'login' | 'signup';

const Index = () => {
  const [authState, setAuthState] = useState<AuthState>('landing');
  const { login, signup, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
    } catch (error) {
      // Error is handled in the AuthContext
    }
  };

  const handleSignup = async (data: SignupData) => {
    try {
      await signup(data);
    } catch (error) {
      // Error is handled in the AuthContext
    }
  };

  // Show loading spinner while checking auth state
  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-romantic-red mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

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
