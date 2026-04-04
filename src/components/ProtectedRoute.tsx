
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, isLoading, user } = useAuth();

  // Show loading while auth state is being determined
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-romantic-dark-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-romantic-red"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Redirect to onboarding if user needs onboarding
  if (user?.needsOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // Redirect to dashboard if user completed onboarding but is on onboarding page
  if (!user?.needsOnboarding && location.pathname === '/onboarding') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
