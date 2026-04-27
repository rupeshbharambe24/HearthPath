import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  relationshipId: string | null | undefined;
  lastCheckinAt: string | null | undefined;
  onStart: () => void;
}

export default function CheckinReminderBanner({ relationshipId, lastCheckinAt, onStart }: Props) {
  const [dismissed, setDismissed] = useState(false);

  // Check localStorage on mount
  useEffect(() => {
    if (!relationshipId) return;
    const key = `checkin-banner-dismissed-${relationshipId}`;
    const ts = localStorage.getItem(key);
    if (ts) {
      const ageMs = Date.now() - new Date(ts).getTime();
      if (ageMs < 24 * 60 * 60 * 1000) setDismissed(true);
    }
  }, [relationshipId]);

  if (!relationshipId || dismissed) return null;

  const lastTime = lastCheckinAt ? new Date(lastCheckinAt).getTime() : null;
  const daysSince = lastTime ? Math.floor((Date.now() - lastTime) / (1000 * 60 * 60 * 24)) : null;

  // Don't show if last check-in was within the last 7 days.
  if (daysSince !== null && daysSince < 7) return null;

  function dismiss() {
    if (!relationshipId) return;
    localStorage.setItem(`checkin-banner-dismissed-${relationshipId}`, new Date().toISOString());
    setDismissed(true);
  }

  const message =
    daysSince === null
      ? "You haven't done a shared check-in yet. Take a minute to share where you are."
      : `It's been ${daysSince} days since your last shared check-in. Take a minute to share where you are.`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="rounded-lg border border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 p-4 flex items-start gap-3 mb-4"
        role="status"
      >
        <Calendar className="h-5 w-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <div className="text-sm text-amber-900 dark:text-amber-100">{message}</div>
          <div className="mt-2 flex items-center gap-2">
            <Button size="sm" onClick={onStart}>
              Start check-in
            </Button>
            <Button size="sm" variant="ghost" onClick={dismiss}>
              Remind me tomorrow
            </Button>
          </div>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 -mt-1 -mr-1"
          onClick={dismiss}
          aria-label="Dismiss reminder"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </motion.div>
    </AnimatePresence>
  );
}
