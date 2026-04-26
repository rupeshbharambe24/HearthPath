// src/hooks/useOnboardingAutosave.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

// Columns autosave is allowed to write. Whitelisted to prevent accidental
// writes to access_state / onboarding_step / verification_badges etc.
export type AutosaveField =
  | 'name'
  | 'college_name'
  | 'branch'
  | 'year'
  | 'about'
  | 'hobbies'
  | 'relationship_intent'
  | 'preferred_chat_frequency'
  | 'communication_style'
  | 'value_tags'
  | 'lifestyle_preferences'
  | 'voice_notes_comfort'
  | 'privacy_comfort'
  | 'pace_style'
  | 'boundary_topics'
  | 'deal_breakers'
  | 'discovery_mode'
  | 'campus_zone'
  | 'pronouns'
  | 'languages'
  | 'heartpath_norms_acknowledged_at';

export interface UseOnboardingAutosave {
  status: AutosaveStatus;
  lastSavedAt: Date | null;
  errorMessage: string | null;
  /** Debounced (text fields). */
  saveField: (name: AutosaveField, value: unknown) => void;
  /** Immediate (selects, arrays, on-blur flush). */
  saveFieldNow: (name: AutosaveField, value: unknown) => Promise<void>;
  /** Cancel any pending debounced save. */
  flush: () => Promise<void>;
}

const DEBOUNCE_MS = 600;

export function useOnboardingAutosave(): UseOnboardingAutosave {
  const { user } = useAuth();
  const [status, setStatus] = useState<AutosaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Pending writes keyed by column. Latest value wins; one timer per call.
  const pending = useRef<Partial<Record<AutosaveField, unknown>>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track in-flight save count so a quick succession of saves shows
  // 'saving' until the last one resolves.
  const inflight = useRef(0);

  const persist = useCallback(async () => {
    if (!user?.id) return;
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    const payload = pending.current;
    if (Object.keys(payload).length === 0) return;
    pending.current = {};
    inflight.current += 1;
    setStatus('saving');
    setErrorMessage(null);

    try {
      const { error } = await supabase
        .from('users')
        .update(payload)
        .eq('id', user.id);
      if (error) throw error;
      setLastSavedAt(new Date());
      // If no more inflight saves, mark saved.
      if (inflight.current === 1) {
        setStatus('saved');
      }
    } catch (err) {
      console.warn('autosave failed:', err);
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Save failed');
    } finally {
      inflight.current = Math.max(0, inflight.current - 1);
    }
  }, [user?.id]);

  const saveField = useCallback(
    (name: AutosaveField, value: unknown) => {
      pending.current[name] = value;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => { void persist(); }, DEBOUNCE_MS);
    },
    [persist]
  );

  const saveFieldNow = useCallback(
    async (name: AutosaveField, value: unknown) => {
      pending.current[name] = value;
      await persist();
    },
    [persist]
  );

  const flush = useCallback(async () => {
    await persist();
  }, [persist]);

  // Flush on unmount so a quick navigation away doesn't lose a pending save.
  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
        // We can't await async work in cleanup, but fire-and-forget is fine —
        // the network request completes regardless of whether the component is
        // still mounted to render the result.
        void persist();
      }
    };
  }, [persist]);

  return { status, lastSavedAt, errorMessage, saveField, saveFieldNow, flush };
}
