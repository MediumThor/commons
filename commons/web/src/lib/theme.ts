import { useCallback, useState } from 'react';

export type Theme = 'dark' | 'light';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light');

  const setTheme = useCallback((next: Theme) => {
    const root = document.documentElement;
    const apply = () => {
      root.classList.toggle('dark', next === 'dark');
      root.style.colorScheme = next;
      setThemeState(next);
    };
    try { localStorage.setItem('oc-theme', next); } catch { /* private mode */ }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    if (doc.startViewTransition && !reduce) doc.startViewTransition(apply);
    else apply();
  }, []);

  return { theme, setTheme, toggle: () => setTheme(theme === 'dark' ? 'light' : 'dark') };
}
