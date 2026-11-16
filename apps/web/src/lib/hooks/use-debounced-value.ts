'use client';

import { useEffect, useState } from 'react';

/** The value, but only once it has stopped changing for `delay` milliseconds. For searches that call the API. */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return settled;
}
