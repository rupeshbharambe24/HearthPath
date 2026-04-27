import type { Variants, Transition } from 'framer-motion';

// Shared spring configs - smooth but not bouncy
export const smoothSpring: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
};

export const gentleSpring: Transition = {
  type: 'spring',
  stiffness: 200,
  damping: 25,
};

// Page transition variants
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export const pageTransition: Transition = {
  duration: 0.3,
  ease: [0.25, 0.1, 0.25, 1],
};

// Stagger container for grids/lists
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const staggerContainerFast: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

// Card entrance variants
export const cardVariants: Variants = {
  initial: { opacity: 0, y: 20, scale: 0.97 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  },
};

// Fade up for text/sections
export const fadeUp: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
  },
};

// Fade in (no movement)
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.4 },
  },
};

// Scale in for modals/badges
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
  },
};

// Slide in from left (sidebar)
export const slideInLeft: Variants = {
  initial: { x: -20, opacity: 0 },
  animate: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
  },
};

// Chat bubble entrance
export const bubbleVariants: Variants = {
  initial: { opacity: 0, y: 8, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] },
  },
};

// Relationship level -> animation intensity mapping
// Higher levels get more expressive animations (deeper connection = more life)
export function getLevelPulse(level: number): Variants {
  const intensityMap: Record<number, number> = {
    1: 0,
    2: 0.02,
    3: 0.03,
    4: 0.04,
    5: 0.06,
    6: 0.08,
  };
  const intensity = intensityMap[level] || 0;

  if (intensity === 0) {
    return {
      initial: {},
      animate: {},
    };
  }

  return {
    initial: { scale: 1 },
    animate: {
      scale: [1, 1 + intensity, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };
}

// Relationship level -> glow shadow mapping
export function getLevelGlow(level: number): string {
  const glows: Record<number, string> = {
    1: '',
    2: '0 0 8px rgba(255,138,149,0.15)',
    3: '0 0 12px rgba(241,78,92,0.2)',
    4: '0 0 16px rgba(255,90,95,0.25)',
    5: '0 0 20px rgba(255,90,95,0.35)',
    6: '0 0 24px rgba(255,90,95,0.45), 0 0 48px rgba(233,30,99,0.2)',
  };
  return glows[level] || '';
}

// Hover lift for interactive cards
export const hoverLift = {
  whileHover: {
    y: -4,
    scale: 1.01,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  whileTap: {
    scale: 0.98,
    transition: { duration: 0.1 },
  },
};

// Subtle float for decorative elements
export const floatAnimation: Variants = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// --- Phase 3 Plan A additions ---

/** A bouncy spring for celebratory moments (stage advance, milestone). */
export const celebrateSpring: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 18,
  mass: 0.9,
};

/** Slow ambient pulse for "live" indicators (online dot, awaiting partner). */
export const pulseSlow: Variants = {
  initial: { opacity: 0.6, scale: 1 },
  animate: {
    opacity: [0.6, 1, 0.6],
    scale: [1, 1.06, 1],
    transition: {
      duration: 2.4,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/** Glowing halo behind a featured element (used during celebration). */
export const haloGlow: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: {
    opacity: [0, 0.65, 0.45, 0.65, 0],
    scale: [0.8, 1.4, 1.6, 1.4, 1.8],
    transition: {
      duration: 2.2,
      ease: 'easeInOut',
      times: [0, 0.2, 0.5, 0.8, 1],
    },
  },
};

/** Stage badge graduation: scale up + tilt + settle. */
export const stageGraduate: Variants = {
  initial: { scale: 0.7, rotate: -8, opacity: 0 },
  animate: {
    scale: [0.7, 1.18, 1],
    rotate: [-8, 4, 0],
    opacity: [0, 1, 1],
    transition: {
      duration: 0.9,
      ease: [0.34, 1.56, 0.64, 1],
      times: [0, 0.6, 1],
    },
  },
};

/** Soft rise for affirming microcopy under the celebration card. */
export const microCopyRise: Variants = {
  initial: { y: 12, opacity: 0 },
  animate: {
    y: 0,
    opacity: 1,
    transition: { delay: 0.45, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

/** Gentle attention ping — used on cooldown countdown when freshly set. */
export const attentionPing: Variants = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.08, 1],
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};
