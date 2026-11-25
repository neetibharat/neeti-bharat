import { useCallback, useRef, useState } from 'react';

/** The width of an element, kept up to date as it is resized, for charts that fit the space they are given. */
export function useWidth<T extends HTMLElement>() {
  const [width, setWidth] = useState(0);
  const observer = useRef<ResizeObserver | null>(null);

  const ref = useCallback((node: T | null) => {
    observer.current?.disconnect();
    if (!node) return;
    setWidth(node.getBoundingClientRect().width);
    observer.current = new ResizeObserver(([entry]) => setWidth(entry?.contentRect.width ?? 0));
    observer.current.observe(node);
  }, []);

  return [ref, width] as const;
}
