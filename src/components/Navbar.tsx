import React from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const Navbar = () => {
  return (
    <motion.nav
      className="sticky top-0 z-50 h-14 flex items-center justify-between px-4 sm:px-6 bg-white/80 dark:bg-[#0e0608]/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50"
      initial={{ y: -14, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div className="flex items-center space-x-2.5">
        <motion.div
          className="w-8 h-8 bg-gradient-to-br from-romantic-red to-romantic-pink rounded-xl flex items-center justify-center shadow-md shadow-romantic-red/15"
          whileHover={{ scale: 1.08, rotate: 8 }}
          transition={{ duration: 0.2 }}
        >
          <Heart className="w-4 h-4 text-white fill-white" />
        </motion.div>
        <span className="text-lg font-bold bg-gradient-to-r from-romantic-red to-romantic-rose bg-clip-text text-transparent">
          HeartPath
        </span>
      </div>
      <ThemeToggle />
    </motion.nav>
  );
};

export default Navbar;
