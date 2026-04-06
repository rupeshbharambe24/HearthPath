import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '@/components/AppLayout';
import Landing from '@/components/Landing';
import LoginForm from '@/components/LoginForm';
import SignupForm, { SignupData } from '@/components/SignupForm';
import { useAuth } from '@/contexts/AuthContext';
import { canAccessProtectedArea } from '@/lib/access-state';
import { scaleIn } from '@/lib/animations';

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
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="relative w-10 h-10 mx-auto mb-4"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <div className="rounded-full h-10 w-10 border-b-2 border-romantic-red" />
            </motion.div>
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </motion.div>
        </div>
      </AppLayout>
    );
  }

  const renderContent = () => {
    switch (authState) {
      case 'login':
        return <LoginForm onSubmit={handleLogin} onSwitchToSignup={() => setAuthState('signup')} />;
      case 'signup':
        return <SignupForm onSubmit={handleSignup} onSwitchToLogin={() => setAuthState('login')} />;
      case 'verification-sent':
        return (
          <div className="min-h-screen flex items-center justify-center p-4">
            <motion.div
              className="w-full max-w-md"
              variants={scaleIn}
              initial="initial"
              animate="animate"
            >
              <div className="romantic-card glass-card rounded-3xl border border-romantic-pink/30 p-8 text-center shadow-xl">
                <motion.div
                  className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-romantic-light-pink dark:bg-romantic-red/20"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.5, delay: 0.15, type: 'spring', stiffness: 200 }}
                >
                  <span className="text-2xl">💌</span>
                </motion.div>
                <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Check your college email</h2>
                <p className="mb-2 text-sm text-gray-600 dark:text-gray-300">
                  We sent a verification link to <span className="font-medium">{pendingVerificationEmail}</span>.
                </p>
                <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                  Confirm your email to unlock HeartPath onboarding and verified student access.
                </p>
                <motion.div
                  className="space-y-3"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <motion.button
                    type="button"
                    className="romantic-btn w-full rounded-lg px-4 py-3 text-sm font-medium text-white"
                    onClick={() => void resendVerificationEmail(pendingVerificationEmail)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Resend verification email
                  </motion.button>
                  <motion.button
                    type="button"
                    className="w-full rounded-lg border border-romantic-pink/30 px-4 py-3 text-sm font-medium text-romantic-red transition hover:bg-romantic-light-pink/50"
                    onClick={() => setAuthState('login')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Back to sign in
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        );
      default:
        return <Landing onSignIn={() => setAuthState('login')} onSignUp={() => setAuthState('signup')} />;
    }
  };

  return (
    <AppLayout>
      <AnimatePresence mode="wait">
        <motion.div
          key={authState}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </AppLayout>
  );
};

export default Index;
