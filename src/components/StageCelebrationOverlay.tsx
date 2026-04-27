import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, Sparkles } from 'lucide-react';
import Confetti from './Confetti';
import {
  celebrateSpring,
  haloGlow,
  microCopyRise,
  stageGraduate,
} from '@/lib/animations';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const STAGE_NAMES: Record<number, string> = {
  1: 'Stranger',
  2: 'Acquaintance',
  3: 'Friend',
  4: 'Close Friend',
  5: 'Romantic Interest',
  6: 'Exclusive',
};

const STAGE_BLURBS: Record<number, string> = {
  2: 'You both feel a little more curious about each other.',
  3: 'Trust is forming. Voice notes and deeper details are now within reach.',
  4: "A real bond is here. Private photos and a shared memory vault unlock.",
  5: "You've named it. Romantic closeness, full-face photos, AI-shared recaps.",
  6: 'Exclusive. Discovery is locked; this is the path you walk together.',
};

interface Props {
  stage: number | null;
  partnerName?: string | null;
  onClose: () => void;
}

export default function StageCelebrationOverlay({ stage, partnerName, onClose }: Props) {
  const reduced = useReducedMotion();
  const [autoCloseAt] = useState<number | null>(stage ? Date.now() + 6000 : null);

  useEffect(() => {
    if (!autoCloseAt) return;
    const id = setTimeout(onClose, autoCloseAt - Date.now());
    return () => clearTimeout(id);
  }, [autoCloseAt, onClose]);

  useEffect(() => {
    if (!stage) return;
    function handler(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [stage, onClose]);

  return (
    <AnimatePresence>
      {stage !== null && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="stage-celebration-title"
        >
          {!reduced && <Confetti />}
          <motion.div
            className="relative px-8 py-10 mx-4 max-w-md w-full rounded-3xl bg-gradient-to-br from-romantic-red via-romantic-red/90 to-pink-500 text-white shadow-2xl text-center"
            initial={{ scale: 0.85, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 8, opacity: 0 }}
            transition={celebrateSpring}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              className="absolute inset-0 -z-10 rounded-3xl bg-pink-300/40 blur-2xl"
              variants={haloGlow}
              initial="initial"
              animate="animate"
            />
            <div className="flex justify-center mb-3">
              <motion.div
                variants={stageGraduate}
                initial="initial"
                animate="animate"
                className="relative inline-flex items-center justify-center h-20 w-20 rounded-full bg-white/15 backdrop-blur-sm"
              >
                <Heart className="h-10 w-10 fill-white" />
                <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-yellow-200" />
              </motion.div>
            </div>
            <motion.h2
              id="stage-celebration-title"
              className="text-2xl font-semibold tracking-tight"
              variants={stageGraduate}
              initial="initial"
              animate="animate"
            >
              You&apos;ve reached <span className="block text-3xl mt-1">{STAGE_NAMES[stage] ?? `Stage ${stage}`}</span>
            </motion.h2>
            <motion.p
              className="mt-3 text-sm leading-relaxed text-white/90"
              variants={microCopyRise}
              initial="initial"
              animate="animate"
            >
              {STAGE_BLURBS[stage] ?? 'A new chapter together.'}
            </motion.p>
            {partnerName && (
              <motion.p
                className="mt-2 text-xs text-white/70"
                variants={microCopyRise}
                initial="initial"
                animate="animate"
              >
                with {partnerName}
              </motion.p>
            )}
            <motion.button
              onClick={onClose}
              className="mt-6 inline-flex items-center justify-center px-5 py-2 rounded-full bg-white text-romantic-red text-sm font-medium hover:bg-white/90 transition"
              variants={microCopyRise}
              initial="initial"
              animate="animate"
            >
              Continue
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
