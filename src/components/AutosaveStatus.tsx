// src/components/AutosaveStatus.tsx
import { useEffect, useState } from 'react';
import { Loader2, Check, AlertCircle } from 'lucide-react';

interface Props {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSavedAt: Date | null;
  errorMessage: string | null;
}

export default function AutosaveStatus({ status, lastSavedAt, errorMessage }: Props) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!lastSavedAt) return;
    const id = setInterval(() => setTick((t) => t + 1), 30 * 1000);
    return () => clearInterval(id);
  }, [lastSavedAt]);
  // tick is read here so the relative time refreshes; the lint rule about
  // unused expressions doesn't fire because of the void.
  void tick;

  if (status === 'saving') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" /> Saving…
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-amber-600">
        <AlertCircle className="h-3 w-3" /> {errorMessage ?? 'Save failed'}
      </span>
    );
  }
  if (status === 'saved' && lastSavedAt) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Check className="h-3 w-3 text-green-500" /> Saved {formatAgo(lastSavedAt)}
      </span>
    );
  }
  return null;
}

function formatAgo(d: Date): string {
  const seconds = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}
