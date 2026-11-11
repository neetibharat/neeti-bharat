'use client';

import { useCallback, useState } from 'react';

/** The values of a form being typed: the values, a way to change some of them, and a way to start over. */
export function useFormDraft<T extends object>(initial: T) {
  const [values, setValues] = useState(initial);
  const patch = useCallback(
    (change: Partial<T>) => setValues((current) => ({ ...current, ...change })),
    [],
  );
  const reset = useCallback(() => setValues(initial), [initial]);
  return [values, patch, reset] as const;
}
