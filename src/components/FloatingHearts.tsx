import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Heart {
  id: number;
  left: number;
  duration: number;
  size: number;
  delay: number;
  emoji: string;
}

const heartEmojis = ['💖', '💕', '💗', '💓', '💞'];

const FloatingHearts = () => {
  const [hearts, setHearts] = useState<Heart[]>([]);

  const createHeart = useCallback(() => {
    const newHeart: Heart = {
      id: Date.now() + Math.random(),
      left: Math.random() * 100,
      duration: 5 + Math.random() * 4,
      size: 14 + Math.random() * 14,
      delay: 0,
      emoji: heartEmojis[Math.floor(Math.random() * heartEmojis.length)],
    };

    setHearts((prev) => {
      // Keep max 8 hearts at a time for performance
      const trimmed = prev.length >= 8 ? prev.slice(1) : prev;
      return [...trimmed, newHeart];
    });

    // Remove after animation completes
    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
    }, newHeart.duration * 1000);
  }, []);

  useEffect(() => {
    const interval = setInterval(createHeart, 2500);
    return () => clearInterval(interval);
  }, [createHeart]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-10">
      <AnimatePresence>
        {hearts.map((heart) => (
          <motion.div
            key={heart.id}
            className="absolute text-romantic-red/50 dark:text-romantic-pink/40"
            style={{ left: `${heart.left}%`, fontSize: `${heart.size}px` }}
            initial={{ y: '100vh', opacity: 0, rotate: 0 }}
            animate={{
              y: '-100px',
              opacity: [0, 0.7, 0.7, 0],
              rotate: Math.random() > 0.5 ? 180 : -180,
              x: [0, (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 40],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: heart.duration,
              ease: 'linear',
              opacity: { times: [0, 0.1, 0.85, 1] },
            }}
          >
            {heart.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default FloatingHearts;
