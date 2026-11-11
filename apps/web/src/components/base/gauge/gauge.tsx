'use client';

import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from 'recharts';

/** A ring that fills to `percent` (0 to 100), for use on the brand gradient. */
export function Gauge({ percent }: { percent: number }) {
  return (
    <ResponsiveContainer>
      <RadialBarChart
        data={[{ value: percent }]}
        innerRadius="76%"
        outerRadius="100%"
        startAngle={90}
        endAngle={-270}
        barSize={14}
      >
        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} angleAxisId={0} />
        <RadialBar
          dataKey="value"
          fill="var(--color-chart-gauge-fill)"
          cornerRadius={8}
          background={{ fill: 'var(--color-chart-gauge-track)' }}
        />
      </RadialBarChart>
    </ResponsiveContainer>
  );
}
