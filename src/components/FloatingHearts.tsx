
import React, { useEffect, useState } from 'react';

interface Heart {
  id: number;
  left: number;
  animationDuration: number;
  size: number;
}

const FloatingHearts = () => {
  const [hearts, setHearts] = useState<Heart[]>([]);

  useEffect(() => {
    const createHeart = () => {
      const newHeart: Heart = {
        id: Date.now() + Math.random(),
        left: Math.random() * 100,
        animationDuration: 4 + Math.random() * 4,
        size: 16 + Math.random() * 16
      };
      
      setHearts(prev => [...prev, newHeart]);
      
      setTimeout(() => {
        setHearts(prev => prev.filter(heart => heart.id !== newHeart.id));
      }, newHeart.animationDuration * 1000);
    };

    const interval = setInterval(createHeart, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-10">
      {hearts.map(heart => (
        <div
          key={heart.id}
          className="absolute text-romantic-red dark:text-romantic-pink opacity-60"
          style={{
            left: `${heart.left}%`,
            fontSize: `${heart.size}px`,
            animation: `heart-float ${heart.animationDuration}s linear forwards`
          }}
        >
          💖
        </div>
      ))}
    </div>
  );
};

export default FloatingHearts;
