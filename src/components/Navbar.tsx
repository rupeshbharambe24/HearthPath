
import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';

const Navbar = () => {
  const { theme } = useTheme();

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-romantic-dark-bg/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-romantic-red to-romantic-pink rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">💖</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-romantic-red to-romantic-pink bg-clip-text text-transparent">
                CollegeLoveLink
              </span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
