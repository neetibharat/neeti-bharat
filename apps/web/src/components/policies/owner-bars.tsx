'use client';

import { POLICY_STATUSES } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '@/components/base/card/card';
import type { OwnerCounts } from '@/lib/policy-stats';
import { CHART_TOOLTIP, STATUS_COLORS } from './chart-style';

const ROW_HEIGHT = 34;
const AXIS_ROOM = 56;

/** Who owns the policies and how far along each owner is, one bar per job split by status. */
export function OwnerBars({ owners }: { owners: OwnerCounts[] }) {
  const t = useTranslations('policies.overview');

  return (
    <Card title={t('owner.title')} description={t('owner.description')}>
      <div
        role="img"
        aria-label={t('owner.summary', { count: owners.length })}
        style={{ height: owners.length * ROW_HEIGHT + AXIS_ROOM }}
      >
        <Bars owners={owners} />
      </div>
    </Card>
  );
}

function Bars({ owners }: { owners: OwnerCounts[] }) {
  const tStatus = useTranslations('policies.status');
  const tJobs = useTranslations('jobRoles');
  const data = owners.map((owner) => ({ ...owner, name: tJobs(owner.role) }));

  return (
    <ResponsiveContainer>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
        <XAxis type="number" hide allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="name"
          width={140}
          tickLine={false}
          axisLine={false}
          tick={{ fill: 'var(--color-fg-muted)', fontSize: 13 }}
        />
        <Tooltip {...CHART_TOOLTIP} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 13 }}
          formatter={(label: string) => <span className="text-fg-muted">{label}</span>}
        />
        {POLICY_STATUSES.map((status) => (
          <Bar
            key={status}
            dataKey={status}
            name={tStatus(status)}
            stackId="owner"
            fill={STATUS_COLORS[status]}
            stroke="var(--color-surface)"
            strokeWidth={2}
            barSize={14}
            radius={4}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
