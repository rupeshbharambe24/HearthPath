import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface Props {
  count?: number;
  colors?: string[];
  duration?: number;
}

const DEFAULT_COLORS = [
  '#ff6b8b',
  '#ffb6c1',
  '#ffd166',
  '#9bd0c1',
  '#c5b3ff',
  '#ffffff',
];

const SHAPES = ['rect', 'circle', 'tri'] as const;

export default function Confetti({ count = 32, colors = DEFAULT_COLORS, duration = 2.6 }: Props) {
  const reduced = useReducedMotion();
  const particles = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const color = colors[i % colors.length];
      const shape = SHAPES[i % SHAPES.length];
      const left = Math.random() * 100;
      const horizontalDrift = (Math.random() - 0.5) * 30;
      const delay = Math.random() * 0.5;
      const fallDuration = duration + Math.random() * 0.8;
      const rotation = Math.random() * 720 - 360;
      const size = 6 + Math.random() * 8;
      return { id: i, color, shape, left, horizontalDrift, delay, fallDuration, rotation, size };
    });
  }, [count, colors, duration]);

  if (reduced) {
    return (
      <div className="pointer-events-none fixed inset-0 z-[60] flex items-start justify-center pt-8" aria-hidden="true">
        <div className="text-3xl tracking-widest opacity-80">♡ ♡ ♡</div>
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden="true">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute"
          initial={{
            top: '-5%',
            left: `${p.left}%`,
            opacity: 0,
            rotate: 0,
          }}
          animate={{
            top: '105%',
            left: `${p.left + p.horizontalDrift}%`,
            opacity: [0, 1, 1, 0],
            rotate: p.rotation,
          }}
          transition={{
            duration: p.fallDuration,
            delay: p.delay,
            ease: [0.45, 0, 0.55, 1],
            opacity: { times: [0, 0.05, 0.85, 1] },
          }}
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.shape === 'tri' ? 'transparent' : p.color,
            borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'rect' ? '2px' : 0,
            ...(p.shape === 'tri'
              ? {
                  width: 0,
                  height: 0,
                  borderLeft: `${p.size / 2}px solid transparent`,
                  borderRight: `${p.size / 2}px solid transparent`,
                  borderBottom: `${p.size}px solid ${p.color}`,
                  backgroundColor: 'transparent',
                }
              : {}),
          }}
        />
      ))}
    </div>
  );
}
