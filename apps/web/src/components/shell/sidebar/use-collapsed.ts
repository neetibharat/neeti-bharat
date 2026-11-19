'use client';

import { useCallback, useSyncExternalStore } from 'react';

const KEY = 'sidebar-collapsed';
const listeners = new Set<() => void>();

/** Storage can be blocked or empty, so a failed read means expanded and a failed write is ignored. */
function read(): boolean {
  try {
    return window.localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

/** Whether the desktop sidebar is folded down to its icons, remembered in this browser. */
export function useSidebarCollapsed() {
  const collapsed = useSyncExternalStore(subscribe, read, () => false);
  const set = useCallback((next: boolean) => {
    try {
      window.localStorage.setItem(KEY, next ? '1' : '0');
    } catch {
      // Not remembered, but it still changes for this visit.
    }
    listeners.forEach((listener) => listener());
  }, []);
  return [collapsed, set] as const;
}
