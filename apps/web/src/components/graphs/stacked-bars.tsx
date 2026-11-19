'use client';

import { cumsum, max } from 'd3-array';
import { scaleLinear } from 'd3-scale';
import { useState } from 'react';
import { useWidth } from './use-width';

export interface BarSegment {
  key: string;
  label: string;
  value: number;
  /** A colour from the theme, such as `var(--color-chart-approved)`. */
  color: string;
}

export interface BarRow {
  label: string;
  segments: BarSegment[];
}

const LABEL_WIDTH = 140;
const ROW_HEIGHT = 34;
const BAR_HEIGHT = 14;
const RIGHT_ROOM = 8;

interface Tip {
  x: number;
  y: number;
  text: string;
}

/** One row's bars, side by side, each as wide as its share of the longest row. A segment of nothing is left out. */
function Segments(props: {
  row: BarRow;
  y: number;
  scale: (value: number) => number;
  onTip: (tip: Tip | null) => void;
}) {
  const { row, y, scale } = props;
  const ends = cumsum(row.segments, (segment) => segment.value);

  return row.segments.map((segment, index) => {
    if (segment.value === 0) return null;
    const x = LABEL_WIDTH + scale((ends[index] ?? 0) - segment.value);
    return (
      <rect
        key={segment.key}
        x={x}
        y={y + (ROW_HEIGHT - BAR_HEIGHT) / 2}
        width={Math.max(scale(segment.value), 0)}
        height={BAR_HEIGHT}
        rx={4}
        fill={segment.color}
        stroke="var(--color-surface)"
        strokeWidth={2}
        onMouseMove={(event) =>
          props.onTip({
            x: event.clientX,
            y: event.clientY,
            text: `${row.label} · ${segment.label}: ${segment.value}`,
          })
        }
        onMouseLeave={() => props.onTip(null)}
      />
    );
  });
}

/** The colours and what they mean, once each. */
function Legend({ segments }: { segments: BarSegment[] }) {
  return (
    <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-label text-fg-muted">
      {segments.map((segment) => (
        <li key={segment.key} className="flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ background: segment.color }} />
          {segment.label}
        </li>
      ))}
    </ul>
  );
}

/** Horizontal bars, one row for each thing, each split into coloured parts, with a key and a tooltip on each part. */
export function StackedBars({ rows }: { rows: BarRow[] }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [tip, setTip] = useState<Tip | null>(null);
  const longest =
    max(rows, (row) => row.segments.reduce((sum, segment) => sum + segment.value, 0)) ?? 1;
  const scale = scaleLinear()
    .domain([0, longest || 1])
    .range([0, Math.max(width - LABEL_WIDTH - RIGHT_ROOM, 0)]);

  return (
    <div ref={ref} className="relative w-full">
      <svg width={width} height={rows.length * ROW_HEIGHT} aria-hidden>
        {rows.map((row, index) => (
          <g key={row.label}>
            <text
              x={0}
              y={index * ROW_HEIGHT + ROW_HEIGHT / 2}
              dominantBaseline="central"
              fontSize={13}
              className="fill-fg-muted"
            >
              {row.label}
            </text>
            <Segments row={row} y={index * ROW_HEIGHT} scale={scale} onTip={setTip} />
          </g>
        ))}
      </svg>
      <Legend segments={rows[0]?.segments ?? []} />
      {tip && (
        <div
          className="pointer-events-none fixed z-50 rounded-control border border-line bg-surface px-2.5 py-1.5 text-label text-fg shadow-popover"
          style={{ left: tip.x + 12, top: tip.y + 12 }}
        >
          {tip.text}
        </div>
      )}
    </div>
  );
}
