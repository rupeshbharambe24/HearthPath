import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Heart } from 'lucide-react';

interface SignupFormProps {
  onSubmit: (data: SignupData) => void;
  onSwitchToLogin: () => void;
}

export interface SignupData {
  name: string;
  email: string;
  college: string;
  branch: string;
  year: string;
  password: string;
  photo: File | null;
}

const SignupForm: React.FC<SignupFormProps> = ({ onSubmit, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    const signupData: SignupData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      college: '',
      branch: '',
      year: '',
      photo: null
    };

    onSubmit(signupData);
  };

  const fields = [
    { id: 'name', label: 'Full Name', type: 'text', placeholder: 'Enter your full name', value: formData.name },
    { id: 'email', label: 'Email', type: 'email', placeholder: 'you@college.edu or you@gmail.com', value: formData.email },
    { id: 'password', label: 'Password', type: 'password', placeholder: 'Create a strong password', value: formData.password },
    { id: 'confirmPassword', label: 'Confirm Password', type: 'password', placeholder: 'Confirm your password', value: formData.confirmPassword },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-rose-50 via-white to-pink-50/40 dark:from-[#0e0608] dark:via-[#120a0c] dark:to-[#0e0608]">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 -right-20 w-80 h-80 rounded-full bg-romantic-red/[0.06] blur-[80px]" />
        <div className="absolute bottom-1/3 -left-20 w-80 h-80 rounded-full bg-romantic-pink/[0.06] blur-[80px]" />
      </div>

      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div className="bg-white/80 dark:bg-[#1a1215]/80 backdrop-blur-xl rounded-2xl border border-gray-200/60 dark:border-gray-800/60 shadow-xl shadow-gray-200/40 dark:shadow-black/20 p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <motion.div
              className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-romantic-red to-romantic-pink flex items-center justify-center shadow-lg shadow-romantic-red/25"
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 250, damping: 18 }}
            >
              <Heart className="w-6 h-6 text-white fill-white" />
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Join HeartPath
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Use an approved email domain to begin
            </p>
          </div>

          {/* Info banner */}
          <motion.div
            className="mb-5 rounded-xl bg-romantic-red/[0.06] dark:bg-romantic-red/10 border border-romantic-red/10 dark:border-romantic-red/15 p-3 text-sm text-gray-600 dark:text-gray-300"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            HeartPath is built for verified student access. During testing, approved public email domains may also be enabled.
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map((field, i) => (
              <motion.div
                key={field.id}
                className="space-y-1.5"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
              >
                <Label htmlFor={field.id} className="text-sm font-medium text-gray-700 dark:text-gray-300">{field.label}</Label>
                <Input
                  id={field.id}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={field.value}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  required
                  className="h-11 rounded-xl bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-gray-700 focus:border-romantic-red focus:ring-romantic-red/20"
                />
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="pt-1"
            >
              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-romantic-red to-romantic-rose hover:from-romantic-rose hover:to-romantic-red text-white font-semibold shadow-lg shadow-romantic-red/20 hover:shadow-xl hover:shadow-romantic-red/30 transition-shadow"
                >
                  Create Account
                </Button>
              </motion.div>
            </motion.div>
          </form>

          <motion.div
            className="mt-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Already have an account?{' '}
              <button
                onClick={onSwitchToLogin}
                className="text-romantic-red hover:text-romantic-rose font-semibold transition-colors"
              >
                Sign In
              </button>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default SignupForm;
