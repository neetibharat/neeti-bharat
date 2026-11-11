'use client';

import { motion } from 'motion/react';
import type { ReactNode } from 'react';

/** A template (not a layout) remounts on every navigation, so each page eases in. */
export default function AppTemplate({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
