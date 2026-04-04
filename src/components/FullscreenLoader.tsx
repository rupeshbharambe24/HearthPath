import React from 'react';

interface FullscreenLoaderProps {
  label?: string;
}

const FullscreenLoader: React.FC<FullscreenLoaderProps> = ({ label = 'Loading...' }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-romantic-dark-bg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-romantic-red mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">{label}</p>
      </div>
    </div>
  );
};

export default FullscreenLoader;
