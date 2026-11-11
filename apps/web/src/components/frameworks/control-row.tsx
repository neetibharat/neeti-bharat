'use client';

import type { ControlResponse } from '@dpdp-kit/shared';
import { ControlStatusBadge } from './control-status-badge';
import { IconUser } from '@tabler/icons-react';
import { useFormatter, useTranslations } from 'next-intl';
import { Badge } from '@/components/base/badge/badge';
import { Link } from '@/i18n/navigation';
import { cx } from '@/lib/utils/cx';
import { EditControlButton } from './edit-control-button';
import { ProofLink } from './proof-link';

export interface ControlRowProps {
  control: ControlResponse;
  /** Auditors can read the checklist but not change it. */
  canEdit: boolean;
}

/** One job: what it asks, which policies cover it, who owns it and how far along it is. */
export function ControlRow({ control, canEdit }: ControlRowProps) {
  return (
    <li className="grid gap-3 py-4 pr-5 pl-12 md:grid-cols-[minmax(0,1fr)_auto] md:gap-6">
      <div className="min-w-0">
        <ControlTitle control={control} />
        <p className="mt-0.5 text-label text-fg-muted">{control.description}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-fg-subtle">
          <WhoLine control={control} />
          <Gaps control={control} />
          {control.policies.length > 0 && <PolicyLinks policies={control.policies} />}
          <ReviewDate date={control.reviewDate} />
        </div>
      </div>
      <div className="flex flex-wrap items-start gap-2 md:flex-nowrap">
        <ProofLink control={control} />
        {canEdit && <EditControlButton control={control} />}
      </div>
    </li>
  );
}

function ControlTitle({ control }: { control: ControlResponse }) {
  const t = useTranslations('frameworks');

  return (
    <p className="flex flex-wrap items-center gap-2 text-body font-medium text-fg">
      {control.title}
      {control.isCustom && <Badge color="brand">{t('control.custom')}</Badge>}
      <ControlStatusBadge status={control.status} />
    </p>
  );
}

/** What is still needed before the control counts as done, in orange so it stands out from the rest. */
function Gaps({ control }: { control: ControlResponse }) {
  const t = useTranslations('frameworks.control.missing');
  if (control.status === 'done') return null;

  return (
    <>
      {control.policiesApproved < control.policiesTotal && (
        <span className="text-accent">
          {t('policies', { approved: control.policiesApproved, total: control.policiesTotal })}
        </span>
      )}
      <ProofGap control={control} />
    </>
  );
}

/** How much of the proof the control needs is in, or that it has none at all. */
function ProofGap({ control }: { control: ControlResponse }) {
  const t = useTranslations('frameworks.control.missing');
  if (control.proofRequired > 0) {
    return control.proofProvided < control.proofRequired ? (
      <span className="text-accent">
        {t('proofProgress', { provided: control.proofProvided, required: control.proofRequired })}
      </span>
    ) : null;
  }
  return control.evidenceCount === 0 ? <span className="text-accent">{t('proof')}</span> : null;
}

function ReviewDate({ date }: { date: string | null }) {
  const t = useTranslations('frameworks.control');
  const format = useFormatter();
  if (!date) return null;
  const shown = format.dateTime(new Date(`${date}T00:00:00.000Z`), {
    dateStyle: 'medium',
    timeZone: 'UTC',
  });

  return <span>{t('reviewOn', { date: shown })}</span>;
}

function PolicyLinks({ policies }: { policies: ControlResponse['policies'] }) {
  const t = useTranslations('frameworks');

  return (
    <span>
      {t('coveredBy')}{' '}
      {policies.map((policy, index) => (
        <span key={policy.id}>
          {index > 0 && ', '}
          <Link
            href={`/policies/${policy.id}`}
            className="underline-offset-2 hover:text-brand hover:underline"
          >
            {policy.title}
          </Link>
        </span>
      ))}
    </span>
  );
}

/** Says the owner is the default one: shown beside it, and read out in full to screen readers. */
function DefaultOwnerNote() {
  const t = useTranslations('frameworks');

  return (
    <>
      <span aria-hidden className="text-fg-subtle">
        ({t('ownerDefaultTag')})
      </span>
      <span className="sr-only">{t('ownerDefault')}</span>
    </>
  );
}

/**
 * Who is on it: the person named on the control, or else the job that owns it and whoever holds that job.
 * Orange when nobody does. Changing it is done in the edit dialog, not here.
 */
function WhoLine({ control }: { control: ControlResponse }) {
  const t = useTranslations('frameworks');
  const tJobs = useTranslations('jobRoles');
  const holder = control.ownerName ?? t('nobody');
  const text = control.assignee
    ? control.assignee.name
    : `${tJobs(control.ownerRole)} \u00b7 ${holder}`;
  const vacant = !control.assignee && !control.ownerName;
  const isDefault = control.ownerIsDefault && !control.assignee;

  return (
    <span
      className={cx('inline-flex items-center gap-1', vacant ? 'text-accent' : 'text-fg-muted')}
    >
      <IconUser className="size-3.5" />
      {text}
      {isDefault && <DefaultOwnerNote />}
    </span>
  );
}
