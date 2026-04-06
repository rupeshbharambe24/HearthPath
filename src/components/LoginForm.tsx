import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Heart } from 'lucide-react';

interface LoginFormProps {
  onSubmit: (email: string, password: string) => void;
  onSwitchToSignup: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, onSwitchToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-rose-50 via-white to-pink-50/40 dark:from-[#0e0608] dark:via-[#120a0c] dark:to-[#0e0608]">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -right-20 w-80 h-80 rounded-full bg-romantic-red/[0.06] blur-[80px]" />
        <div className="absolute bottom-1/4 -left-20 w-80 h-80 rounded-full bg-romantic-pink/[0.06] blur-[80px]" />
      </div>

      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div className="bg-white/80 dark:bg-[#1a1215]/80 backdrop-blur-xl rounded-2xl border border-gray-200/60 dark:border-gray-800/60 shadow-xl shadow-gray-200/40 dark:shadow-black/20 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-romantic-red to-romantic-pink flex items-center justify-center shadow-lg shadow-romantic-red/25"
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 250, damping: 18 }}
            >
              <Heart className="w-6 h-6 text-white fill-white" />
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome Back
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Sign in to continue your HeartPath journey
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">College Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 rounded-xl bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-gray-700 focus:border-romantic-red focus:ring-romantic-red/20"
              />
            </motion.div>

            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 rounded-xl bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-gray-700 focus:border-romantic-red focus:ring-romantic-red/20"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-romantic-red to-romantic-rose hover:from-romantic-rose hover:to-romantic-red text-white font-semibold shadow-lg shadow-romantic-red/20 hover:shadow-xl hover:shadow-romantic-red/30 transition-shadow"
                >
                  Sign In
                </Button>
              </motion.div>
            </motion.div>
          </form>

          <motion.div
            className="mt-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Don't have an account?{' '}
              <button
                onClick={onSwitchToSignup}
                className="text-romantic-red hover:text-romantic-rose font-semibold transition-colors"
              >
                Create Account
              </button>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginForm;
