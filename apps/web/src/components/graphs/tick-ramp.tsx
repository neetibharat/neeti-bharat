'use client';

import { motion } from 'motion/react';
import { useId } from 'react';

export interface RampBand {
  /** The first and last tick in the band, counting from 1. */
  from: number;
  to: number;
  label: string;
  /** A colour from the theme. */
  color: string;
}

export interface RampMark {
  key: string;
  /** The tick it stands on. */
  value: number;
  /** Written in its pill, such as "Now 6". */
  label: string;
  /** The mark to draw the eye to: a dark pill, a filled head and a glow. */
  strong?: boolean;
}

export interface TickRampProps {
  /** How many ticks: one for each point of the scale. */
  max: number;
  bands: RampBand[];
  /** Ticks up to here are solid. */
  filled: number;
  /** Ticks after `filled`, up to here, are hatched: what was taken off. */
  hatched?: number;
  marks: RampMark[];
}

const W = 740;
const BASE = 236;
const X = { from: 30, to: 720 };
const TICK = 10;
const PILL_GAP = 38;

type Geometry = { x: (i: number) => number; h: (i: number) => number };

const geometryOf = (max: number): Geometry => ({
  x: (i) => X.from + ((i - 1) * (X.to - X.from)) / (max - 1),
  h: (i) => 34 + Math.pow(i / max, 1.15) * 136,
});

const bandOf = (bands: RampBand[], i: number) =>
  Math.max(
    0,
    bands.findIndex((band) => i >= band.from && i <= band.to),
  );

/** Soft diagonal stripes in a band's colour. */
function Hatch({ id, color }: { id: string; color: string }) {
  return (
    <pattern
      id={id}
      width={5}
      height={5}
      patternUnits="userSpaceOnUse"
      patternTransform="rotate(45)"
    >
      <rect width={5} height={5} fill={`color-mix(in srgb, ${color} 22%, var(--color-surface))`} />
      <line
        x1={0}
        y1={0}
        x2={0}
        y2={5}
        stroke={`color-mix(in srgb, ${color} 60%, var(--color-surface))`}
        strokeWidth={2}
      />
    </pattern>
  );
}

/** For each band: a solid tick that pales towards the floor, and a hatch for what was taken off. */
function Paint({ id, bands }: { id: string; bands: RampBand[] }) {
  return (
    <defs>
      {bands.map((band, b) => (
        <g key={band.label}>
          <linearGradient id={`${id}-solid-${b}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={band.color} />
            <stop
              offset="1"
              stopColor={`color-mix(in srgb, ${band.color} 55%, var(--color-surface))`}
            />
          </linearGradient>
          <Hatch id={`${id}-hatch-${b}`} color={band.color} />
        </g>
      ))}
      <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation={6} />
      </filter>
    </defs>
  );
}

/** The ticks, rising from the floor one after another: solid, hatched, or a quiet grey for the rest of the scale. */
function Ticks(props: TickRampProps & { id: string; at: Geometry }) {
  const { id, at, max, bands, filled, hatched = filled } = props;
  const fillOf = (i: number) =>
    i <= filled
      ? `url(#${id}-solid-${bandOf(bands, i)})`
      : i <= hatched
        ? `url(#${id}-hatch-${bandOf(bands, i)})`
        : 'var(--color-surface-sunken)';

  return Array.from({ length: max }, (_, k) => k + 1).map((i) => (
    <motion.rect
      key={i}
      x={at.x(i) - TICK / 2}
      y={BASE - at.h(i)}
      width={TICK}
      height={at.h(i)}
      rx={TICK / 2}
      fill={fillOf(i)}
      opacity={i > hatched ? 0.6 : 1}
      initial={{ scaleY: 0 }}
      animate={{ scaleY: 1 }}
      transition={{ duration: 0.6, delay: i * 0.025, ease: [0.22, 1, 0.36, 1] }}
      style={{ transformOrigin: `${at.x(i)}px ${BASE}px` }}
    />
  ));
}

/** A rail of colour under each band, with its name. */
function Rails({ bands, at }: { bands: RampBand[]; at: Geometry }) {
  return bands.map((band) => (
    <g key={band.label}>
      <rect
        x={at.x(band.from) - 6}
        y={BASE + 10}
        width={at.x(band.to) - at.x(band.from) + 12}
        height={4}
        rx={2}
        fill={band.color}
      />
      <text
        x={(at.x(band.from) + at.x(band.to)) / 2}
        y={BASE + 32}
        textAnchor="middle"
        fontSize={11}
        className="fill-fg-subtle"
      >
        {band.label}
      </text>
    </g>
  ));
}

const pillWidth = (text: string) => text.length * 7.2 + 24;

/** A head on top of a tick, with its pill above. A strong one glows. */
function Mark(props: { mark: RampMark; at: Geometry; color: string; id: string; y: number }) {
  const { mark, at, color, id, y } = props;
  const [cx, top] = [at.x(mark.value), BASE - at.h(mark.value) - 10];

  return (
    <motion.g
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.5 }}
    >
      {mark.strong && (
        <circle cx={cx} cy={top} r={14} fill={color} opacity={0.45} filter={`url(#${id}-glow)`} />
      )}
      <circle
        cx={cx}
        cy={top}
        r={mark.strong ? 7 : 6}
        fill={mark.strong ? color : 'var(--color-surface)'}
        stroke={color}
        strokeWidth={3}
      />
      <Pill x={cx} y={y} text={mark.label} strong={mark.strong} />
    </motion.g>
  );
}

/** A rounded label: dark for the strong mark, outlined for the other. */
function Pill(props: { x: number; y: number; text: string; strong?: boolean }) {
  const width = pillWidth(props.text);
  // Kept inside the drawing, so a mark on the first or last tick is not cut off.
  const x = Math.min(Math.max(props.x, width / 2 + 2), W - width / 2 - 2);
  return (
    <>
      <rect
        x={x - width / 2}
        y={props.y - 13}
        width={width}
        height={26}
        rx={13}
        className={props.strong ? 'fill-fg' : 'fill-surface stroke-line'}
      />
      <text
        x={x}
        y={props.y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12.5}
        fontWeight={600}
        className={props.strong ? 'fill-surface' : 'fill-fg'}
      >
        {props.text}
      </text>
    </>
  );
}

/** Where each pill sits: above its tick, and lifted over the other when they would touch. */
function pillYs(marks: RampMark[], at: Geometry): number[] {
  const ys = marks.map((mark) => BASE - at.h(mark.value) - PILL_GAP);
  const [a, b] = marks;
  const [ya, yb] = ys;
  if (!a || !b || ya === undefined || yb === undefined) return ys;
  const room = (pillWidth(a.label) + pillWidth(b.label)) / 2 + 8;
  if (Math.abs(at.x(a.value) - at.x(b.value)) >= room) return ys;
  return a.strong ? [ya, Math.min(yb, ya - 34)] : [Math.min(ya, yb - 34), yb];
}

/**
 * A scale drawn as a rising ramp of ticks, one per point, coloured by band. Ticks up to `filled` are solid and those up
 * to `hatched` are hatched, so the hatched stretch is what was taken off. Marks stand on chosen ticks with a pill each.
 */
export function TickRamp(props: TickRampProps) {
  const id = useId();
  const at = geometryOf(props.max);
  const ys = pillYs(props.marks, at);
  const placed = props.marks.map((mark, i) => ({ mark, y: ys[i] ?? 0 }));
  // The strong mark is drawn last, so its pill sits over the other's.
  const ordered = [...placed.filter((p) => !p.mark.strong), ...placed.filter((p) => p.mark.strong)];

  return (
    <svg viewBox={`0 -30 ${W} 310`} className="w-full" aria-hidden>
      <Paint id={id} bands={props.bands} />
      {ordered
        .filter(({ mark }) => mark.strong)
        .map(({ mark, y }) => (
          <rect
            key={`${mark.key}-lane`}
            x={at.x(mark.value) - 16}
            y={y - 20}
            width={32}
            height={BASE - y + 28}
            rx={16}
            className="fill-surface-muted"
          />
        ))}
      <Ticks {...props} id={id} at={at} />
      <Rails bands={props.bands} at={at} />
      {ordered.map(({ mark, y }) => (
        <Mark
          key={mark.key}
          mark={mark}
          at={at}
          y={y}
          id={id}
          color={props.bands[bandOf(props.bands, mark.value)]?.color ?? ''}
        />
      ))}
    </svg>
  );
}
