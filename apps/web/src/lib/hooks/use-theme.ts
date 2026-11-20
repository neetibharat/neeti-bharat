'use client';

import { useCallback, useEffect, useState } from 'react';
import { THEME_KEY, isThemeChoice, resolveTheme, type ThemeChoice } from '../theme';

const DARK_QUERY = '(prefers-color-scheme: dark)';

function read(): ThemeChoice {
  try {
    const stored = window.localStorage.getItem(THEME_KEY);
    return isThemeChoice(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}

function apply(choice: ThemeChoice) {
  const dark = resolveTheme(choice, window.matchMedia(DARK_QUERY).matches) === 'dark';
  if (dark) document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
}

/** The theme the person chose, and a way to change it. "System" follows the device, also while the app is open. */
export function useTheme(): [ThemeChoice, (choice: ThemeChoice) => void] {
  // Only ever used inside a menu that opens after the page has loaded, so the browser's storage is there to read.
  const [choice, setChoice] = useState<ThemeChoice>(() =>
    typeof window === 'undefined' ? 'system' : read(),
  );

  useEffect(() => {
    if (choice !== 'system') return;
    const query = window.matchMedia(DARK_QUERY);
    const onChange = () => apply('system');
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [choice]);

  const change = useCallback((next: ThemeChoice) => {
    setChoice(next);
    apply(next);
    try {
      window.localStorage.setItem(THEME_KEY, next);
    } catch {
      // A browser that refuses to store still gets the theme for this visit.
    }
  }, []);

  return [choice, change];
}
