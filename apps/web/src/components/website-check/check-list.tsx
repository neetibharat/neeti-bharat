'use client';

import { IconAlertTriangle, IconCircleCheck, IconCircleX, type Icon } from '@tabler/icons-react';
import type { WebsiteCheckResult, WebsiteCheckStatus } from '@neeti-bharat/shared';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/base/badge/badge';
import { Card } from '@/components/base/card/card';
import { CHECK_GROUPS, checkMessageKey } from '@/lib/website-check';

const LOOK: Record<
  WebsiteCheckStatus,
  { icon: Icon; tone: string; badge: 'success' | 'warning' | 'danger' }
> = {
  pass: { icon: IconCircleCheck, tone: 'text-success', badge: 'success' },
  warn: { icon: IconAlertTriangle, tone: 'text-accent', badge: 'warning' },
  fail: { icon: IconCircleX, tone: 'text-danger', badge: 'danger' },
};

function CheckRow({ result }: { result: WebsiteCheckResult }) {
  const t = useTranslations('websiteCheck.checks');
  const tStatus = useTranslations('websiteCheck.status');
  const { icon: StatusIcon, tone, badge } = LOOK[result.status];
  // Which sentences exist depends on the check (`WEBSITE_MESSAGE_KEYS`), and a test keeps en.json in step with that list.
  const sentence = t as unknown as (key: string, values: Record<string, string | number>) => string;

  return (
    <li className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
      <StatusIcon className={`mt-0.5 size-5 shrink-0 ${tone}`} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-body font-medium text-fg">{t(`${result.id}.name`)}</p>
        <p className="text-label text-fg-muted">
          {sentence(`${result.id}.${checkMessageKey(result)}`, result.values ?? {})}
        </p>
      </div>
      <Badge color={badge}>{tStatus(result.status)}</Badge>
    </li>
  );
}

function Group({ id, results }: { id: string; results: WebsiteCheckResult[] }) {
  const t = useTranslations('websiteCheck.groups');
  const failing = results.filter((result) => result.status !== 'pass').length;

  return (
    <Card
      title={t(`${id}.title` as 'privacy.title')}
      description={t(`${id}.about` as 'privacy.about')}
      actions={
        failing > 0 ? <Badge color="gray">{t('needsWork', { count: failing })}</Badge> : null
      }
    >
      <ul className="divide-y divide-line">
        {results.map((result) => (
          <CheckRow key={result.id} result={result} />
        ))}
      </ul>
    </Card>
  );
}

/** The results in groups: what DPDP asks to see on the site, the connection, and the browser's protections. */
export function CheckList({ results }: { results: WebsiteCheckResult[] }) {
  const byId = new Map(results.map((result) => [result.id, result]));

  return (
    <div className="flex flex-col gap-4">
      {CHECK_GROUPS.map((group) => {
        const found = group.checks.flatMap((id) => byId.get(id) ?? []);
        return found.length ? <Group key={group.id} id={group.id} results={found} /> : null;
      })}
    </div>
  );
}
