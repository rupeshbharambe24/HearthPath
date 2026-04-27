import { useEffect, useState } from 'react';

/**
 * Returns `true` if the user has requested reduced motion via OS-level
 * accessibility settings (`prefers-reduced-motion: reduce`). Components can
 * use this to skip layout/entry animations and respect the user's preference.
 */
export function useReducedMotion(): boolean {
  const getInitial = () => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };

  const [reduced, setReduced] = useState<boolean>(getInitial);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (event: MediaQueryListEvent) => setReduced(event.matches);
    setReduced(mql.matches);
    if (mql.addEventListener) {
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    }
    // Older Safari fallback
    mql.addListener(handler);
    return () => mql.removeListener(handler);
  }, []);

  return reduced;
}

export default useReducedMotion;
