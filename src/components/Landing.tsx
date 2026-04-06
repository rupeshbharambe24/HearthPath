import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Heart, Shield, Eye } from 'lucide-react';
import FloatingHearts from './FloatingHearts';

interface LandingProps {
  onSignIn: () => void;
  onSignUp: () => void;
}

const Landing: React.FC<LandingProps> = ({ onSignIn, onSignUp }) => {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-rose-50 via-white to-pink-50/40 dark:from-[#0e0608] dark:via-[#120a0c] dark:to-[#0e0608]">
      <FloatingHearts />

      {/* Background decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-romantic-red/[0.07] blur-[100px]" />
        <div className="absolute top-1/2 -left-40 w-[400px] h-[400px] rounded-full bg-romantic-pink/[0.08] blur-[100px]" />
        <div className="absolute -bottom-20 right-1/4 w-[300px] h-[300px] rounded-full bg-rose-400/[0.05] blur-[80px]" />
      </div>

      <div className="relative z-20 min-h-screen flex items-center justify-center px-4 py-16">
        <div className="max-w-6xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: Hero visual */}
            <motion.div
              className="flex justify-center lg:justify-start order-2 lg:order-1"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <div className="relative w-72 h-72 sm:w-80 sm:h-80 lg:w-[360px] lg:h-[360px]">
                {/* Outer glow ring */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-romantic-red/20 to-romantic-pink/20 blur-xl"
                  animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.7, 0.4] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                />
                {/* Main circle */}
                <div className="absolute inset-4 rounded-full bg-gradient-to-br from-romantic-red to-romantic-pink shadow-2xl shadow-romantic-red/30 flex items-center justify-center">
                  <motion.span
                    className="text-7xl lg:text-8xl select-none"
                    animate={{ y: [0, -8, 0], rotate: [0, 3, -3, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    👫
                  </motion.span>
                </div>

                {/* Orbiting emojis */}
                {[
                  { emoji: '💖', top: '-8%', right: '5%', delay: 0 },
                  { emoji: '💕', bottom: '-5%', left: '0%', delay: 0.8 },
                  { emoji: '💝', top: '20%', left: '-12%', delay: 1.6 },
                  { emoji: '💞', bottom: '15%', right: '-10%', delay: 2.4 },
                ].map(({ emoji, delay, ...pos }, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-2xl sm:text-3xl"
                    style={pos as React.CSSProperties}
                    animate={{
                      y: [0, -12, 0],
                      scale: [1, 1.15, 1],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay,
                    }}
                  >
                    {emoji}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right: Content */}
            <div className="text-center lg:text-left order-1 lg:order-2">
              <motion.div
                className="space-y-6"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <div className="space-y-3">
                  <motion.h1
                    className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <span className="bg-gradient-to-r from-romantic-red via-romantic-rose to-romantic-pink bg-clip-text text-transparent">
                      Let hearts meet
                    </span>
                    <br />
                    <span className="text-gray-900 dark:text-white">
                      beyond the surface
                    </span>
                  </motion.h1>
                  <motion.p
                    className="text-lg text-gray-600 dark:text-gray-400 max-w-lg mx-auto lg:mx-0 leading-relaxed"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.35 }}
                  >
                    Connect with verified college students through a trust-first
                    relationship journey built on privacy, compatibility, and
                    gradual mutual access.
                  </motion.p>
                </div>

                {/* CTA buttons */}
                <motion.div
                  className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.45 }}
                >
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button
                      onClick={onSignIn}
                      className="h-12 px-8 text-base font-semibold rounded-xl bg-gradient-to-r from-romantic-red to-romantic-rose hover:from-romantic-rose hover:to-romantic-red text-white shadow-lg shadow-romantic-red/25 transition-shadow hover:shadow-xl hover:shadow-romantic-red/30"
                    >
                      Sign In
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button
                      onClick={onSignUp}
                      variant="outline"
                      className="h-12 px-8 text-base font-semibold rounded-xl border-2 border-romantic-red/30 text-romantic-red hover:bg-romantic-red hover:text-white hover:border-romantic-red dark:border-romantic-pink/30 dark:text-romantic-pink dark:hover:bg-romantic-red dark:hover:text-white transition-all"
                    >
                      Create Account
                    </Button>
                  </motion.div>
                </motion.div>

                {/* Feature pills */}
                <motion.div
                  className="flex flex-wrap gap-3 justify-center lg:justify-start pt-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  {[
                    { icon: Shield, text: 'College emails only' },
                    { icon: Eye, text: 'Email verification' },
                    { icon: Heart, text: 'Trust-first progression' },
                  ].map(({ icon: Icon, text }) => (
                    <div
                      key={text}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/70 dark:bg-white/5 border border-gray-200/60 dark:border-gray-800 text-sm text-gray-700 dark:text-gray-300 backdrop-blur-sm"
                    >
                      <Icon className="w-3.5 h-3.5 text-romantic-red dark:text-romantic-pink" />
                      <span>{text}</span>
                    </div>
                  ))}
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
