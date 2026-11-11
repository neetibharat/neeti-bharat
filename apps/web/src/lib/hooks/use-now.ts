'use client';

import { useEffect, useState } from 'react';

const MINUTE_MS = 60_000;

/** The time now, refreshed every minute, for a countdown that has to stay true while the page is open. */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), MINUTE_MS);
    return () => clearInterval(timer);
  }, []);

  return now;
}
