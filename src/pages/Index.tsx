
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import Landing from '@/components/Landing';
import LoginForm from '@/components/LoginForm';
import SignupForm, { SignupData } from '@/components/SignupForm';
import { useAuth } from '@/contexts/AuthContext';
import { canAccessProtectedArea } from '@/lib/access-state';

type AuthState = 'landing' | 'login' | 'signup' | 'verification-sent';

const Index = () => {
  const [authState, setAuthState] = useState<AuthState>('landing');
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState('');
  const { login, signup, resendVerificationEmail, isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (canAccessProtectedArea(user.accessState)) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
    } catch (error) {
      // Error is handled in the AuthContext
    }
  };

  const handleSignup = async (data: SignupData) => {
    try {
      const result = await signup(data);
      if (result.needsEmailConfirmation) {
        setPendingVerificationEmail(result.email);
        setAuthState('verification-sent');
      }
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
      case 'verification-sent':
        return (
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md romantic-card rounded-3xl border border-romantic-pink/30 bg-white/95 p-8 text-center shadow-xl dark:bg-romantic-dark-card">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-romantic-light-pink dark:bg-romantic-red/20">
                <span className="text-2xl">💌</span>
              </div>
              <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Check your college email</h2>
              <p className="mb-2 text-sm text-gray-600 dark:text-gray-300">
                We sent a verification link to <span className="font-medium">{pendingVerificationEmail}</span>.
              </p>
              <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                Confirm your email to unlock HeartPath onboarding and verified student access.
              </p>
              <div className="space-y-3">
                <button
                  type="button"
                  className="romantic-btn w-full rounded-lg px-4 py-3 text-sm font-medium text-white"
                  onClick={() => void resendVerificationEmail(pendingVerificationEmail)}
                >
                  Resend verification email
                </button>
                <button
                  type="button"
                  className="w-full rounded-lg border border-romantic-pink/30 px-4 py-3 text-sm font-medium text-romantic-red transition hover:bg-romantic-light-pink/50"
                  onClick={() => setAuthState('login')}
                >
                  Back to sign in
                </button>
              </div>
            </div>
          </div>
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
