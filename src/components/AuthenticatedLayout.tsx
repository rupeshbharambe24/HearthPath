import React from 'react';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import ThemeToggle from './ThemeToggle';
import NotificationBell from './NotificationBell';
import { Heart } from 'lucide-react';

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

const AuthenticatedLayout: React.FC<AuthenticatedLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-romantic-dark-bg">
      {/* Sidebar - desktop only */}
      <Sidebar />

      {/* Mobile top bar - visible only on mobile (lg:hidden) */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between h-14 px-4 bg-white/90 dark:bg-romantic-dark-bg/95 backdrop-blur-md border-b border-gray-200/80 dark:border-gray-700/50">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 bg-gradient-to-br from-romantic-red to-romantic-pink rounded-full flex items-center justify-center">
            <Heart className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-romantic-red to-romantic-pink bg-clip-text text-transparent">
            HeartPath
          </span>
        </div>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <ThemeToggle />
        </div>
      </div>

      {/* Desktop top-right action bar - sits above the main content */}
      <div className="hidden lg:flex fixed top-3 right-4 z-40 items-center gap-1">
        <NotificationBell />
      </div>

      {/* Main content area - offset for sidebar on desktop, offset for mobile nav at bottom */}
      <main className="lg:ml-64 min-h-screen pb-20 lg:pb-0">
        {children}
      </main>
    </div>
  );
};

export default AuthenticatedLayout;
