'use client';

import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import type { ProofByControlResponse, ProofControlGroup } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';
import { Badge } from '@/components/base/badge/badge';
import { Pagination } from '@/components/base/pagination/pagination';
import { Link } from '@/i18n/navigation';
import { cx } from '@/lib/utils/cx';
import { ProofItemRow } from './proof-item-row';

/** One page of controls, each opening to the proof it needs, with the page controls under them. */
export function ProofControls(props: {
  data: ProofByControlResponse;
  /** Open every control, for a search or a filter, where the person is looking for something. */
  defaultOpen: boolean;
  onPage: (page: number) => void;
}) {
  const t = useTranslations('proofPage');
  const { data } = props;
  if (data.groups.length === 0) return <p className="text-body text-fg-muted">{t('empty')}</p>;

  return (
    <>
      <ul className="flex flex-col gap-3">
        {data.groups.map((group) => (
          <ControlGroup key={group.controlId} group={group} defaultOpen={props.defaultOpen} />
        ))}
      </ul>
      <Pagination
        page={data.page}
        pageSize={data.pageSize}
        total={data.total}
        onPageChange={props.onPage}
      />
    </>
  );
}

function ControlGroup({ group, defaultOpen }: { group: ProofControlGroup; defaultOpen: boolean }) {
  const [chosen, setChosen] = useState<boolean | undefined>(undefined);
  const open = chosen ?? defaultOpen;
  const panel = useId();

  return (
    <li className="rounded-card border border-line/70 bg-surface shadow-card">
      <Header group={group} open={open} panel={panel} onToggle={() => setChosen(!open)} />
      {open && (
        <ul id={panel} className="divide-y divide-line/70 border-t border-line/70">
          {group.items.map((item) => (
            <ProofItemRow key={item.id} item={item} />
          ))}
        </ul>
      )}
    </li>
  );
}

/** The whole row opens the control. The arrow on the left, which sits above that link, opens and closes the list. */
function Header(props: {
  group: ProofControlGroup;
  open: boolean;
  panel: string;
  onToggle: () => void;
}) {
  const t = useTranslations('proofPage.byControl');
  const { group, open } = props;
  const Chevron = open ? IconChevronDown : IconChevronRight;

  return (
    <div
      className={cx(
        'relative flex items-center gap-3 px-5 py-4 has-[a:hover]:bg-page/60',
        // An open control's list sits right under the header, so only the top corners are round.
        open ? 'rounded-t-card' : 'rounded-card',
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={props.panel}
        aria-label={t(open ? 'hide' : 'show', { name: group.controlTitle })}
        onClick={props.onToggle}
        className="relative z-10 grid size-8 shrink-0 cursor-pointer place-items-center rounded-control border border-line-strong text-fg-muted hover:bg-surface-muted hover:text-fg"
      >
        <Chevron className="size-4" aria-hidden />
      </button>
      <div className="min-w-0 flex-1">
        <Link
          href={`/proof?control=${encodeURIComponent(group.controlId)}`}
          className="block truncate text-body font-medium text-fg after:absolute after:inset-0 after:content-['']"
        >
          {group.controlTitle}
        </Link>
        <Progress group={group} />
      </div>
      <Badge>{group.ruleId}</Badge>
    </div>
  );
}

/** How far the control is, and what is holding it back. */
function Progress({ group }: { group: ProofControlGroup }) {
  const t = useTranslations('proofPage.byControl');
  const { counts } = group;

  return (
    <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-label text-fg-muted">
      <span>{t('progress', { provided: counts.provided, total: counts.all })}</span>
      {counts.overdue > 0 && (
        <Badge color="danger">{t('overdue', { count: counts.overdue })}</Badge>
      )}
      {counts.due > 0 && <Badge color="warning">{t('due', { count: counts.due })}</Badge>}
      {counts.missing > 0 && <Badge>{t('missing', { count: counts.missing })}</Badge>}
    </span>
  );
}
