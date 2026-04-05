
import React from 'react';
import { Button } from '@/components/ui/button';
import FloatingHearts from './FloatingHearts';

interface LandingProps {
  onSignIn: () => void;
  onSignUp: () => void;
}

const Landing: React.FC<LandingProps> = ({ onSignIn, onSignUp }) => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <FloatingHearts />
      
      <div className="relative z-20 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Animation Section */}
            <div className="flex justify-center lg:justify-start">
              <div className="relative">
                <div className="w-80 h-80 lg:w-96 lg:h-96 relative">
                  {/* Couple Silhouette */}
                  <div className="absolute inset-0 bg-gradient-to-br from-romantic-red to-romantic-pink rounded-full opacity-20 animate-pulse"></div>
                  <div className="absolute inset-4 bg-gradient-to-br from-romantic-red to-romantic-pink rounded-full opacity-40 animate-float"></div>
                  <div className="absolute inset-8 bg-gradient-to-br from-romantic-red to-romantic-pink rounded-full opacity-60 flex items-center justify-center">
                    <div className="text-6xl lg:text-8xl animate-float">
                      👫
                    </div>
                  </div>
                  
                  {/* Floating Elements */}
                  <div className="absolute -top-4 -right-4 text-3xl animate-float" style={{ animationDelay: '0.5s' }}>
                    💖
                  </div>
                  <div className="absolute -bottom-4 -left-4 text-2xl animate-float" style={{ animationDelay: '1s' }}>
                    💕
                  </div>
                  <div className="absolute top-1/4 -left-8 text-2xl animate-float" style={{ animationDelay: '1.5s' }}>
                    💝
                  </div>
                  <div className="absolute bottom-1/4 -right-8 text-2xl animate-float" style={{ animationDelay: '2s' }}>
                    💞
                  </div>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="text-center lg:text-left space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-romantic-red to-romantic-pink bg-clip-text text-transparent">
                    Let hearts meet
                  </span>
                  <br />
                  <span className="text-gray-800 dark:text-gray-200">
                    beyond the surface
                  </span>
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-400 max-w-lg mx-auto lg:mx-0">
                  Connect with verified college students through a trust-first relationship journey built on privacy,
                  compatibility, and gradual mutual access.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button 
                  onClick={onSignIn}
                  className="romantic-btn text-lg px-8 py-4 h-auto"
                >
                  Sign In
                </Button>
                <Button 
                  onClick={onSignUp}
                  variant="outline"
                  className="romantic-btn-outline text-lg px-8 py-4 h-auto"
                >
                  Create Account
                </Button>
              </div>

              <div className="pt-8 space-y-4">
                <div className="flex items-center justify-center lg:justify-start space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="w-2 h-2 bg-romantic-red rounded-full"></div>
                  <span>Approved college emails only</span>
                </div>
                <div className="flex items-center justify-center lg:justify-start space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="w-2 h-2 bg-romantic-red rounded-full"></div>
                  <span>Email verification before full access</span>
                </div>
                <div className="flex items-center justify-center lg:justify-start space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="w-2 h-2 bg-romantic-red rounded-full"></div>
                  <span>Trust-first profile progression</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
