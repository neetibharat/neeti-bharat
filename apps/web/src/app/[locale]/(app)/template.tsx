import type { ReactNode } from 'react';

/**
 * A template (not a layout) remounts on every navigation, so each page eases in again. The motion is in
 * `.page-stagger` in styles/theme.css.
 */
export default function AppTemplate({ children }: { children: ReactNode }) {
  return <div className="page-stagger">{children}</div>;
}
