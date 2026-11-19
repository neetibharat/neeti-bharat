'use client';

import { arc } from 'd3-shape';
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import { useEffect } from 'react';
import { TAU } from './polar';

const RING = { innerRadius: 55, outerRadius: 70, startAngle: 0 };
const ring = arc().cornerRadius(8);
const TRACK = ring({ ...RING, endAngle: TAU }) ?? '';

/** A ring that fills to `percent` (0 to 100) in the brand colour, on a pale track. It sweeps round when it first shows. */
export function RingGauge({ percent }: { percent: number }) {
  const reduced = useReducedMotion();
  const progress = useMotionValue(reduced ? percent : 0);
  const path = useTransform(
    progress,
    (value) => ring({ ...RING, endAngle: (Math.min(Math.max(value, 0), 100) / 100) * TAU }) ?? '',
  );

  useEffect(() => {
    if (reduced) {
      progress.set(percent);
      return;
    }
    const controls = animate(progress, percent, { duration: 1, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [percent, reduced, progress]);

  return (
    <svg viewBox="-72 -72 144 144" className="size-full" aria-hidden>
      <path d={TRACK} fill="var(--color-chart-gauge-track)" />
      <motion.path d={path} fill="var(--color-chart-gauge-fill)" />
    </svg>
  );
}
