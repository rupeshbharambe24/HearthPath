import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { attentionPing } from '@/lib/animations';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface Props {
  until: string | null | undefined;
  label?: string;
  finishedLabel?: string;
  emphasis?: 'subtle' | 'pronounced';
  className?: string;
}

export default function CountdownPill({
  until,
  label = 'Available in',
  finishedLabel = 'Available now',
  emphasis = 'subtle',
  className = '',
}: Props) {
  const [now, setNow] = useState(() => Date.now());
  const reduced = useReducedMotion();

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!until) return null;
  const target = new Date(until).getTime();
  const remainingMs = Math.max(0, target - now);
  const finished = remainingMs === 0;

  const days = Math.floor(remainingMs / 86_400_000);
  const hours = Math.floor((remainingMs % 86_400_000) / 3_600_000);
  const minutes = Math.floor((remainingMs % 3_600_000) / 60_000);
  const seconds = Math.floor((remainingMs % 60_000) / 1000);

  const text = finished
    ? finishedLabel
    : days > 0
    ? `${days}d ${hours}h ${minutes}m`
    : hours > 0
    ? `${hours}h ${minutes}m ${seconds}s`
    : `${minutes}m ${seconds.toString().padStart(2, '0')}s`;

  const tone = finished
    ? 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30'
    : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30';

  const pingProps = emphasis === 'pronounced' && !reduced
    ? { variants: attentionPing, initial: 'initial', animate: 'animate' }
    : {};

  return (
    <motion.span
      {...pingProps}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${tone} ${className}`}
      role="status"
      aria-live="polite"
    >
      <Clock className="h-3 w-3" />
      <span>{label} {text}</span>
    </motion.span>
  );
}
