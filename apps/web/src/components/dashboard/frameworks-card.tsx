'use client';

import type { FrameworkSummaryResponse } from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/base/card/card';
import { FrameworkSeal } from '@/components/frameworks/framework-seal';
import { ReadinessBar } from '@/components/frameworks/readiness-bar';
import { percentOf } from '@/lib/percent';
import { Link } from '@/i18n/navigation';

/** Each framework you follow, with how far along it is. Each row opens the framework. */
export function FrameworksCard({ frameworks }: { frameworks: FrameworkSummaryResponse[] }) {
  const t = useTranslations('dashboard.frameworks');

  return (
    <Card title={t('title')} description={t('description')}>
      <ul className="flex flex-col gap-4">
        {frameworks.map((framework) => (
          <li key={framework.id}>
            <Link
              href={`/frameworks/${encodeURIComponent(framework.id)}`}
              className="group flex flex-col gap-2 rounded-control p-1 transition hover:bg-surface-muted/60"
            >
              <span className="flex items-center gap-3">
                <FrameworkSeal name={framework.seal} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body font-medium text-fg">
                    {framework.name}
                  </span>
                  <span className="block text-label text-fg-muted">
                    {t('count', { done: framework.controlsDone, total: framework.controlsTotal })}
                  </span>
                </span>
              </span>
              <ReadinessBar
                percent={percentOf(framework.controlsDone, framework.controlsTotal)}
                label={framework.name}
              />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
