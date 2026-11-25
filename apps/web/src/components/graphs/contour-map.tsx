'use client';

import { range } from 'd3-array';
import { scaleLinear } from 'd3-scale';
import { area, line } from 'd3-shape';
import { motion } from 'motion/react';
import { useId } from 'react';

export interface MapBand {
  /** The band covers every place where x times y is at least this. The first band, at 0, fills the whole map. */
  above: number;
  /** A colour from the theme. */
  color: string;
}

export interface MapPoint {
  key: string;
  x: number;
  y: number;
  color: string;
  /** Written beside the point. */
  label: string;
  /** A solid dot, or a ring. */
  filled: boolean;
}

export interface ContourMapProps {
  /** How many steps each axis has. The places are 1 to `steps`. */
  steps: number;
  bands: MapBand[];
  points: MapPoint[];
  xLabel: string;
  yLabel: string;
}

const SIZE = 360;
const PAD = { left: 44, right: 12, top: 12, bottom: 44 };
const PLOT = SIZE - PAD.left - PAD.right;
const RADIUS = 16;
const SAMPLE = 0.05;

/** A band's colour as a soft tint, so the map stays light and the dots stand out. */
const tint = (color: string) => `color-mix(in srgb, ${color} 20%, var(--color-surface))`;

type Scale = (value: number) => number;

/** The edge of a band: the line where x times y is `above`, kept inside the map. */
function edgeY(above: number, x: number, steps: number, y: Scale): number {
  return y(Math.min(Math.max(above / x, 0.5), steps + 0.5));
}

/** Each band as the area above its edge, laid from the lowest up, so a higher band covers the one below it. */
function Bands({ steps, bands, x, y }: { steps: number; bands: MapBand[]; x: Scale; y: Scale }) {
  const xs = range(0.5, steps + 0.5 + SAMPLE, SAMPLE);
  const shape = (above: number) =>
    area<number>()
      .x((value) => x(value))
      .y0(y(steps + 0.5))
      .y1((value) => edgeY(above, value, steps, y))(xs) ?? '';

  return bands.map((band) => (
    <path key={band.above} d={shape(band.above)} fill={tint(band.color)} />
  ));
}

/** A thin line along each band's edge, so the bands read as contours. */
function Edges({ steps, bands, x, y }: { steps: number; bands: MapBand[]; x: Scale; y: Scale }) {
  const xs = range(0.5, steps + 0.5 + SAMPLE, SAMPLE);

  return bands
    .filter((band) => band.above > 0)
    .map((band) => {
      const inside = xs.filter(
        (value) => band.above / value <= steps + 0.5 && band.above / value >= 0.5,
      );
      const path = line<number>()
        .x((value) => x(value))
        .y((value) => y(band.above / value))(inside);
      return (
        <path
          key={band.above}
          d={path ?? ''}
          fill="none"
          stroke="var(--color-surface)"
          strokeWidth={2.5}
        />
      );
    });
}

/** The numbers along both axes, and what each axis is. */
function Axes(props: ContourMapProps & { x: Scale; y: Scale }) {
  const steps = range(1, props.steps + 1);

  return (
    <g className="fill-fg-subtle" fontSize={11}>
      {steps.map((step) => (
        <g key={step}>
          <text x={props.x(step)} y={SIZE - PAD.bottom + 18} textAnchor="middle">
            {step}
          </text>
          <text x={PAD.left - 12} y={props.y(step)} textAnchor="end" dominantBaseline="central">
            {step}
          </text>
        </g>
      ))}
      <text
        x={PAD.left + PLOT / 2}
        y={SIZE - 6}
        textAnchor="middle"
        fontSize={12}
        className="fill-fg-muted"
      >
        {props.xLabel}
      </text>
      <text
        transform={`translate(12 ${PAD.top + PLOT / 2}) rotate(-90)`}
        textAnchor="middle"
        fontSize={12}
        className="fill-fg-muted"
      >
        {props.yLabel}
      </text>
    </g>
  );
}

/** The twenty-five places a rating can be, as faint dots on the map. */
function Grid({ steps, x, y }: { steps: number; x: Scale; y: Scale }) {
  return range(1, steps + 1).flatMap((i) =>
    range(1, steps + 1).map((j) => (
      <circle
        key={`${i}:${j}`}
        cx={x(i)}
        cy={y(j)}
        r={2}
        className="fill-fg-subtle"
        opacity={0.35}
      />
    )),
  );
}

/** The path of a gentle curve between two places, stopping short of each dot. Null when they are too close for one. */
function curveBetween(a: { x: number; y: number }, b: { x: number; y: number }): string | null {
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  if (length < RADIUS * 2.4) return null;
  const [ux, uy] = [(b.x - a.x) / length, (b.y - a.y) / length];
  const start = { x: a.x + ux * (RADIUS + 3), y: a.y + uy * (RADIUS + 3) };
  const end = { x: b.x - ux * (RADIUS + 5), y: b.y - uy * (RADIUS + 5) };
  const bend = length * 0.1;
  const control = { x: (start.x + end.x) / 2 - uy * bend, y: (start.y + end.y) / 2 + ux * bend };
  return `M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`;
}

/** A gentle curve from one point to another, stopping short of each dot, with a head at the end. */
function Arrow({ from, to, x, y }: { from: MapPoint; to: MapPoint; x: Scale; y: Scale }) {
  const id = useId();
  const d = curveBetween({ x: x(from.x), y: y(from.y) }, { x: x(to.x), y: y(to.y) });
  if (!d) return null;

  return (
    <>
      <defs>
        <marker
          id={id}
          viewBox="0 0 10 10"
          refX={7}
          refY={5}
          markerUnits="userSpaceOnUse"
          markerWidth={11}
          markerHeight={11}
          orient="auto"
        >
          <path
            d="M1 1 L9 5 L1 9 Z"
            className="fill-fg stroke-fg"
            strokeWidth={1}
            strokeLinejoin="round"
          />
        </marker>
      </defs>
      <path
        d={d}
        fill="none"
        className="stroke-fg"
        strokeWidth={1.75}
        strokeLinecap="round"
        markerEnd={`url(#${id})`}
      />
    </>
  );
}

interface Direction {
  x: number;
  y: number;
}

/** A small rounded label with a soft shadow, centred on a place. */
function Tag({ label, color, x, y }: { label: string; color: string; x: number; y: number }) {
  const width = label.length * 6.4 + 20;

  return (
    <g transform={`translate(${x} ${y})`}>
      <rect
        x={-width / 2}
        y={-11}
        width={width}
        height={22}
        rx={11}
        fill="var(--color-surface)"
        stroke={`color-mix(in srgb, ${color} 55%, transparent)`}
        strokeWidth={1.5}
        style={{
          filter: 'drop-shadow(0 2px 4px color-mix(in srgb, var(--color-fg) 14%, transparent))',
        }}
      />
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={11}
        fontWeight={600}
        className="fill-fg"
      >
        {label}
      </text>
    </g>
  );
}

/** Keeps a label inside the map's edges. */
const within = (value: number, half: number) =>
  Math.min(Math.max(value, half + 4), SIZE - half - 4);

/**
 * A dot on the map. A ring for where the risk started, a solid dot for where it is now. Its name sits on the side
 * away from the other dot, so it never lands on the arrow.
 */
function Point({ point, away, x, y }: { point: MapPoint; away: Direction; x: Scale; y: Scale }) {
  const [cx, cy] = [x(point.x), y(point.y)];
  const half = (point.label.length * 6.4 + 20) / 2;

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45 }}
      style={{ transformOrigin: `${cx}px ${cy}px` }}
    >
      <circle
        cx={cx}
        cy={cy}
        r={point.filled ? 11 : 10}
        fill={point.filled ? point.color : 'var(--color-surface)'}
        stroke={point.filled ? 'var(--color-surface)' : point.color}
        strokeWidth={point.filled ? 3 : 4}
        style={{
          filter: `drop-shadow(0 3px 5px color-mix(in srgb, ${point.color} 55%, transparent))`,
        }}
      />
      <Tag
        label={point.label}
        color={point.color}
        x={within(cx + away.x * 34, half)}
        y={within(cy + away.y * 30, 11)}
      />
    </motion.g>
  );
}

/** The way to move a label away from another point: opposite to it, or straight up when there is no other. */
function awayFrom(point: MapPoint, other: MapPoint | undefined, x: Scale, y: Scale): Direction {
  if (!other) return { x: 0, y: -1 };
  const [dx, dy] = [x(other.x) - x(point.x), y(other.y) - y(point.y)];
  const length = Math.hypot(dx, dy);
  return length < 1 ? { x: 0, y: -1 } : { x: -dx / length, y: -dy / length };
}

/**
 * A square map of two scales. Smooth bands, in the colour of each level, show where the product of the two crosses
 * from one level to the next, and dots show where things are. With two dots, an arrow shows which way the second moved.
 */
export function ContourMap(props: ContourMapProps) {
  const { steps, bands, points } = props;
  const clip = useId();
  const x = scaleLinear()
    .domain([0.5, steps + 0.5])
    .range([PAD.left, PAD.left + PLOT]);
  const y = scaleLinear()
    .domain([0.5, steps + 0.5])
    .range([PAD.top + PLOT, PAD.top]);
  const [first, second] = points;

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mx-auto w-full max-w-sm" aria-hidden>
      <defs>
        <clipPath id={clip}>
          <rect x={PAD.left} y={PAD.top} width={PLOT} height={PLOT} rx={20} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <Bands steps={steps} bands={bands} x={x} y={y} />
        <Edges steps={steps} bands={bands} x={x} y={y} />
        <Grid steps={steps} x={x} y={y} />
      </g>
      <Axes {...props} x={x} y={y} />
      {first && second && <Arrow from={first} to={second} x={x} y={y} />}
      {points.map((point, index) => (
        <Point
          key={point.key}
          point={point}
          away={awayFrom(point, points[index === 0 ? 1 : 0], x, y)}
          x={x}
          y={y}
        />
      ))}
    </svg>
  );
}
