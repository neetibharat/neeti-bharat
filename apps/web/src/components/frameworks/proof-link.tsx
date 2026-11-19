'use client';

import { IconPaperclip } from '@tabler/icons-react';
import type { ControlResponse } from '@dpdp-kit/shared';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { cx } from '@/lib/utils/cx';

/**
 * Takes you to the proof of one control, on the Proof page. It shows how much of the required proof is in,
 * so a control that still needs some stands out, and goes orange once work has started but the proof is not all there.
 */
export function ProofLink({ control }: { control: ControlResponse }) {
  const t = useTranslations('frameworks.proof');
  const label =
    control.proofRequired > 0
      ? t('progress', { provided: control.proofProvided, required: control.proofRequired })
      : control.evidenceCount > 0
        ? t('count', { count: control.evidenceCount })
        : t('none');
  const incomplete = control.status !== 'not_started' && control.status !== 'done';

  return (
    <Link
      href={`/proof?control=${encodeURIComponent(control.id)}`}
      className={cx(
        'inline-flex h-9 items-center gap-2 rounded-control px-3 text-label font-semibold hover:bg-surface-muted',
        incomplete ? 'text-accent' : 'text-fg-muted hover:text-fg',
      )}
    >
      <IconPaperclip className="size-4" />
      {label}
    </Link>
  );
}
