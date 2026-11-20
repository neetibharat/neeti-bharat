'use client';

import { useCallback, useState } from 'react';

function read(key: string): string {
  try {
    return window.localStorage.getItem(key) ?? '';
  } catch {
    return '';
  }
}

/**
 * Text kept in this browser, so something typed once, such as a note about the company, is there the next time. A
 * browser that refuses to store still works: the text lasts for the visit.
 */
export function useRememberedText(key: string): [string, (value: string) => void] {
  // Used only where the page has loaded in the browser, so storage is there to read.
  const [text, setText] = useState(() => (typeof window === 'undefined' ? '' : read(key)));

  const change = useCallback(
    (value: string) => {
      setText(value);
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // Nothing to do: the text is still in the field.
      }
    },
    [key],
  );

  return [text, change];
}
