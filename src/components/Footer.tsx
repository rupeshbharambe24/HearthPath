
import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-romantic-dark-bg border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-br from-romantic-red to-romantic-pink rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">💖</span>
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-romantic-red to-romantic-pink bg-clip-text text-transparent">
              CampusHeart
            </span>
          </div>
          <div className="flex space-x-6 text-sm text-gray-600 dark:text-gray-400">
            <a href="#" className="hover:text-romantic-red transition-colors">About</a>
            <a href="#" className="hover:text-romantic-red transition-colors">Privacy</a>
            <a href="#" className="hover:text-romantic-red transition-colors">Terms</a>
            <a href="#" className="hover:text-romantic-red transition-colors">Contact</a>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-500 dark:text-gray-400">
          © 2024 CampusHeart. Made with ❤️ for college students.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
