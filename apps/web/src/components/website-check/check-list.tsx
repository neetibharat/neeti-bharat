'use client';

import { IconAlertTriangle, IconCircleCheck, IconCircleX, type Icon } from '@tabler/icons-react';
import type { WebsiteCheckResult, WebsiteCheckStatus } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { checkMessageKey } from '@/lib/website-check';

const LOOK: Record<WebsiteCheckStatus, { icon: Icon; tone: string }> = {
  pass: { icon: IconCircleCheck, tone: 'text-success' },
  warn: { icon: IconAlertTriangle, tone: 'text-accent' },
  fail: { icon: IconCircleX, tone: 'text-danger' },
};

function CheckRow({ result }: { result: WebsiteCheckResult }) {
  const t = useTranslations('websiteCheck.checks');
  const tStatus = useTranslations('websiteCheck.status');
  const { icon: StatusIcon, tone } = LOOK[result.status];
  // Which sentences exist depends on the check (`WEBSITE_MESSAGE_KEYS`), and a test keeps en.json in step with that list.
  const sentence = t as unknown as (key: string, values: Record<string, string | number>) => string;

  return (
    <li className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
      <StatusIcon
        className={`mt-0.5 size-5 shrink-0 ${tone}`}
        aria-label={tStatus(result.status)}
      />
      <div className="min-w-0">
        <p className="text-body font-medium text-fg">{t(`${result.id}.name`)}</p>
        <p className="text-label text-fg-muted">
          {sentence(`${result.id}.${checkMessageKey(result)}`, result.values ?? {})}
        </p>
      </div>
    </li>
  );
}

/** Every thing that was checked, with what was found, in the order of the report. */
export function CheckList({ results }: { results: WebsiteCheckResult[] }) {
  return (
    <ul className="divide-y divide-line">
      {results.map((result) => (
        <CheckRow key={result.id} result={result} />
      ))}
    </ul>
  );
}
